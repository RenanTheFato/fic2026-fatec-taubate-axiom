import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import VolunteeringPage from "../pages/public/volunteering-page"
import VolunteerSignupPage from "../pages/public/volunteer-signup-page"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const { applyVolunteer, authenticate, getProfile } = vi.hoisted(() => ({
  applyVolunteer: vi.fn(),
  authenticate: vi.fn(),
  getProfile: vi.fn(),
}))

vi.mock("../services/volunteer/volunteer-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  applyVolunteer,
}))

vi.mock("../services/auth/auth-user-service", () => ({ authenticate }))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

function renderSignup() {
  return renderWithProviders(
    <Routes>
      <Route path="/seja-voluntario" element={<VolunteerSignupPage />} />
      <Route path="/voluntario/painel" element={<p>painel do voluntário</p>} />
    </Routes>,
    "/seja-voluntario",
  )
}

type User = ReturnType<typeof userEvent.setup>

async function fillPerson(user: User, password = "Voluntario@2026") {
  await fillField(user, /nome completo/i, "Joana Ribeiro dos Santos")
  await fillField(user, /e-mail/i, "joana@exemplo.com")
  await fillField(user, /telefone/i, "19998877665")
  await fillField(user, /crie uma senha/i, password)
  await fillField(user, /repita a senha/i, password)
  await user.selectOptions(screen.getByLabelText(/onde você quer ajudar/i), "eventos")
  await fillField(user, /conte um pouco sobre você/i, "Tenho tempo livre nas manhãs e quero ajudar.")
}

describe("cadastro de voluntariado", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("a página do programa explica as frentes e leva ao cadastro", () => {
    renderWithProviders(<VolunteeringPage />, "/voluntariado")

    expect(screen.getByRole("heading", { name: /^voluntariado$/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /onde o voluntariado atua/i })).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: /cadastrar|seja voluntário/i })[0]).toHaveAttribute(
      "href",
      "/seja-voluntario",
    )
  })

  // O cadastro cria a conta junto e já entra com ela: a pessoa acompanha a
  // análise pelo painel, sem esperar um e-mail.
  it("grava o cadastro com a conta e leva ao painel do voluntário", async () => {
    const user = userEvent.setup()
    applyVolunteer.mockResolvedValue(undefined)
    authenticate.mockResolvedValue("token-novo")
    getProfile.mockResolvedValue({
      id: "user-1",
      name: "Joana Ribeiro dos Santos",
      email: "joana@exemplo.com",
      role: "volunteer",
      created_at: "2026-10-22T12:00:00.000Z",
      updated_at: "2026-10-22T12:00:00.000Z",
    })

    renderSignup()

    await fillPerson(user)
    await user.click(screen.getByRole("checkbox", { name: /manhã/i }))
    await user.click(screen.getByRole("checkbox", { name: /autorizo a associação/i }))
    await user.click(screen.getByRole("button", { name: /enviar cadastro/i }))

    expect(await screen.findByText("painel do voluntário")).toBeInTheDocument()
    expect(applyVolunteer.mock.calls[0][0]).toEqual(expect.objectContaining({
      name: "Joana Ribeiro dos Santos",
      email: "joana@exemplo.com",
      password: "Voluntario@2026",
      area: "eventos",
      availability: ["manha"],
      city: null,
    }))
    expect(authenticate).toHaveBeenCalledWith("joana@exemplo.com", "Voluntario@2026")
  })

  // Sem disponibilidade a coordenação não tem como escalar ninguém, então o
  // conjunto de períodos é campo obrigatório como qualquer outro: recusa o
  // envio, explica o motivo e leva o foco até ele.
  it("recusa o envio sem período marcado e leva o foco ao campo", async () => {
    const user = userEvent.setup()
    renderSignup()

    await fillPerson(user)
    await user.click(screen.getByRole("button", { name: /enviar cadastro/i }))

    expect(await screen.findByText(/marque pelo menos um período/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("group", { name: /quando você tem disponibilidade/i })).toHaveFocus())
    expect(applyVolunteer).not.toHaveBeenCalled()
  })

  it("diz o que falta na senha antes de enviar", async () => {
    const user = userEvent.setup()
    renderSignup()

    await fillPerson(user, "voluntario2026")
    await user.click(screen.getByRole("button", { name: /enviar cadastro/i }))

    expect(await screen.findByText(/inclua pelo menos uma letra maiúscula/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/crie uma senha/i)).toHaveFocus())
    expect(applyVolunteer).not.toHaveBeenCalled()
  })
})
