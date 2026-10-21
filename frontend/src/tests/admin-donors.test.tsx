import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import DonorsPage from "../pages/admin/donors-page"
import type { AdminDonor } from "../services/admin/list-donors-service"
import type { User } from "../types/user-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listDonors: vi.fn(),
  createDonor: vi.fn(),
  updateDonor: vi.fn(),
  anonymizeDonor: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile: mocks.getProfile }))
vi.mock("../services/admin/list-donors-service", () => ({ listDonors: mocks.listDonors }))
vi.mock("../services/admin/donor-actions-service", () => ({
  createDonor: mocks.createDonor,
  updateDonor: mocks.updateDonor,
  anonymizeDonor: mocks.anonymizeDonor,
}))

function person(role: User["role"]): User {
  return {
    id: `user-${role}`,
    name: "Equipe",
    email: `${role}@somosdobem.org.br`,
    role,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }
}

const MARIA: AdminDonor = {
  id: "donor-1",
  user_id: null,
  name: "Maria Oliveira",
  email: "maria@exemplo.com.br",
  document: "12345678901",
  document_type: "cpf",
  phone: null,
  anonymized_at: null,
  created_at: "2026-03-01T12:00:00.000Z",
  updated_at: "2026-03-01T12:00:00.000Z",
}

describe("doadores no painel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.setItem("somosdobem.token", "token-de-teste")
    mocks.getProfile.mockResolvedValue(person("finance"))
    mocks.listDonors.mockResolvedValue({ donors: [MARIA], total: 1 })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("corrige o cadastro sem mexer no documento, que liga a pessoa aos recibos", async () => {
    const user = userEvent.setup()
    mocks.updateDonor.mockResolvedValue({ ...MARIA, phone: "19 99876-5432" })

    renderWithProviders(<DonorsPage />, "/admin/financeiro/doadores")

    await screen.findAllByText("Maria Oliveira")
    await user.click(screen.getAllByRole("button", { name: /^editar$/i })[0])

    expect(screen.queryByLabelText(/cpf ou cnpj/i)).not.toBeInTheDocument()
    await fillField(user, /^telefone/i, "19 99876-5432")
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }))

    await waitFor(() =>
      expect(mocks.updateDonor).toHaveBeenCalledWith("donor-1", { name: "Maria Oliveira", email: "maria@exemplo.com.br", phone: "19 99876-5432" }),
    )
    expect(await screen.findByText(/foi atualizado/i)).toBeInTheDocument()
  })

  it("recusa documento que não é CPF nem CNPJ antes de cadastrar", async () => {
    const user = userEvent.setup()

    renderWithProviders(<DonorsPage />, "/admin/financeiro/doadores")

    await user.click(await screen.findByRole("button", { name: /cadastrar doador/i }))
    await fillField(user, /^nome/i, "Paulo Rocha")
    await fillField(user, /^e-mail/i, "paulo@exemplo.com.br")
    await fillField(user, /cpf ou cnpj/i, "123")
    await user.click(screen.getByRole("button", { name: /^cadastrar$/i }))

    expect(await screen.findByText(/informe um cpf/i)).toBeInTheDocument()
    expect(mocks.createDonor).not.toHaveBeenCalled()
  })

  it("só a administração anonimiza, e só depois de ler o que se perde", async () => {
    const user = userEvent.setup()

    const { unmount } = renderWithProviders(<DonorsPage />, "/admin/financeiro/doadores")

    await screen.findAllByText("Maria Oliveira")
    expect(screen.queryByRole("button", { name: /anonimizar/i })).not.toBeInTheDocument()
    unmount()

    mocks.getProfile.mockResolvedValue(person("admin"))
    mocks.anonymizeDonor.mockResolvedValue({ ...MARIA, anonymized_at: "2026-10-15T12:00:00.000Z" })

    renderWithProviders(<DonorsPage />, "/admin/financeiro/doadores")

    await screen.findAllByText("Maria Oliveira")
    await user.click(screen.getAllByRole("button", { name: /^anonimizar$/i })[0])

    const dialog = await screen.findByRole("alertdialog", { name: /anonimizar maria oliveira/i })
    expect(dialog).toHaveTextContent(/não voltam/i)
    expect(dialog).toHaveTextContent(/mural do bem/i)

    await user.click(within(dialog).getByRole("button", { name: /^anonimizar$/i }))
    await waitFor(() => expect(mocks.anonymizeDonor).toHaveBeenCalledWith("donor-1", expect.anything()))
  })
})
