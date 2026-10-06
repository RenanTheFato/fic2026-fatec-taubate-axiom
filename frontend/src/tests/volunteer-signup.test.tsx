import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import VolunteeringPage from "../pages/public/volunteering-page"
import VolunteerSignupPage from "../pages/public/volunteer-signup-page"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

describe("cadastro de voluntariado", () => {
  it("a página do programa explica as frentes e leva ao cadastro", () => {
    renderWithProviders(<VolunteeringPage />, "/voluntariado")

    expect(screen.getByRole("heading", { name: /^voluntariado$/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /onde o voluntariado atua/i })).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: /cadastrar|seja voluntário/i })[0]).toHaveAttribute(
      "href",
      "/seja-voluntario",
    )
  })

  it("oferece o caminho direto de e-mail junto com o formulário", () => {
    renderWithProviders(<VolunteerSignupPage />, "/seja-voluntario")

    expect(screen.getByRole("heading", { name: /seja voluntário/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /contato@somosdobem\.org\.br/i })).toHaveAttribute(
      "href",
      "mailto:contato@somosdobem.org.br",
    )
  })

  // Sem disponibilidade a coordenação não tem como escalar ninguém, então o
  // conjunto de períodos é campo obrigatório como qualquer outro: recusa o
  // envio, explica o motivo e leva o foco até ele.
  it("recusa o envio sem período marcado e leva o foco ao campo", async () => {
    const user = userEvent.setup()
    renderWithProviders(<VolunteerSignupPage />, "/seja-voluntario")

    await fillField(user, /nome completo/i, "Joana Ribeiro dos Santos")
    await fillField(user, /e-mail/i, "joana@exemplo.com")
    await fillField(user, /telefone/i, "19998877665")
    await user.selectOptions(screen.getByLabelText(/onde você quer ajudar/i), "eventos")
    await fillField(user, /conte um pouco sobre você/i, "Tenho tempo livre nas manhãs e quero ajudar.")

    await user.click(screen.getByRole("button", { name: /enviar cadastro/i }))

    expect(await screen.findByText(/marque pelo menos um período/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("group", { name: /quando você tem disponibilidade/i })).toHaveFocus())
  })
})
