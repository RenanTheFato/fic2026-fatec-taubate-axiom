import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import MessagesPage from "../pages/admin/messages-page"
import type { ContactMessage } from "../types/contact-types"
import type { User } from "../types/user-types"
import { renderWithProviders } from "./utils/render-with-providers"

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listMessages: vi.fn(),
  resolveMessage: vi.fn(),
  withdrawFromWall: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile: mocks.getProfile }))
vi.mock("../services/admin/messages-service", () => ({
  MESSAGES_PER_PAGE: 20,
  listMessages: mocks.listMessages,
  resolveMessage: mocks.resolveMessage,
  withdrawFromWall: mocks.withdrawFromWall,
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

function message(overrides: Partial<ContactMessage>): ContactMessage {
  return {
    id: "message-1",
    channel: "contact",
    subject: "doacao",
    name: "Roberta Campos",
    email: "roberta@exemplo.com.br",
    phone: null,
    message: "A empresa quer doar e precisa do recibo com o CNPJ.",
    status: "open",
    resolved_at: null,
    resolver: null,
    wall_status: null,
    created_at: "2026-10-14T13:00:00.000Z",
    ...overrides,
  }
}

const INBOX = [
  message({}),
  message({ id: "message-2", channel: "wall_removal", subject: null, name: "Larissa Herrera", email: "larissa@exemplo.com.br", message: null, wall_status: "listed" }),
  message({ id: "message-3", channel: "wall_removal", subject: null, name: "Paulo Rocha", email: "paulo@exemplo.com.br", message: null, wall_status: "no_donor" }),
]

describe("caixa de entrada do painel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.setItem("somosdobem.token", "token-de-teste")
    mocks.getProfile.mockResolvedValue(person("communication"))
    mocks.listMessages.mockResolvedValue({ contacts: INBOX, total: 3, open: 3 })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("mostra o assunto com o mesmo rótulo do site e marca a mensagem como resolvida", async () => {
    const user = userEvent.setup()
    mocks.resolveMessage.mockResolvedValue(message({ status: "resolved" }))

    renderWithProviders(<MessagesPage />, "/admin/comunicacao/mensagens")

    const card = (await screen.findByRole("heading", { name: "Roberta Campos" })).closest("li") as HTMLElement
    expect(within(card).getByText("Dúvida sobre doação")).toBeInTheDocument()
    expect(within(card).getByRole("link", { name: /responder por e-mail/i })).toHaveAttribute("href", expect.stringContaining("mailto:roberta@exemplo.com.br"))

    await user.click(within(card).getByRole("button", { name: /marcar como resolvida/i }))
    await waitFor(() => expect(mocks.resolveMessage).toHaveBeenCalledWith("message-1", expect.anything()))
  })

  it("retira do mural só o pedido cujo e-mail aparece nele, depois de confirmar", async () => {
    const user = userEvent.setup()
    mocks.withdrawFromWall.mockResolvedValue(6)

    renderWithProviders(<MessagesPage />, "/admin/comunicacao/mensagens")

    const unmatched = (await screen.findByRole("heading", { name: "Paulo Rocha" })).closest("li") as HTMLElement
    expect(within(unmatched).getByText(/nenhum doador usa este e-mail/i)).toBeInTheDocument()
    expect(within(unmatched).queryByRole("button", { name: /retirar do mural/i })).not.toBeInTheDocument()

    const listed = screen.getByRole("heading", { name: "Larissa Herrera" }).closest("li") as HTMLElement
    await user.click(within(listed).getByRole("button", { name: /retirar do mural/i }))

    const dialog = await screen.findByRole("alertdialog", { name: /retirar larissa herrera do mural/i })
    expect(dialog).toHaveTextContent(/o recibo e o certificado continuam valendo/i)

    await user.click(within(dialog).getByRole("button", { name: /retirar do mural/i }))

    await waitFor(() => expect(mocks.withdrawFromWall).toHaveBeenCalledWith("message-2", expect.anything()))
    expect(await screen.findByText(/saiu do mural do bem/i)).toBeInTheDocument()
  })

  it("oferece ouvidoria e candidatura no filtro só para a administração", async () => {
    const { unmount } = renderWithProviders(<MessagesPage />, "/admin/comunicacao/mensagens")

    const filter = await screen.findByLabelText(/^canal/i)
    expect(within(filter).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Todos os canais",
      "Fale conosco",
      "Retirada do mural",
    ])
    unmount()

    mocks.getProfile.mockResolvedValue(person("admin"))

    renderWithProviders(<MessagesPage />, "/admin/comunicacao/mensagens")

    const adminFilter = await screen.findByLabelText(/^canal/i)
    expect(within(adminFilter).getAllByRole("option")).toHaveLength(5)
  })
})
