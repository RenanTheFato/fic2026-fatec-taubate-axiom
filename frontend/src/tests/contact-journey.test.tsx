import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ContactPage from "../pages/public/contact-page"
import OmbudsmanPage from "../pages/public/ombudsman-page"
import SupportersPage from "../pages/public/supporters-page"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const mocks = vi.hoisted(() => ({
  sendContactMessage: vi.fn(),
  requestWallRemoval: vi.fn(),
  listSupporters: vi.fn(),
}))

vi.mock("../services/contact/contact-service", () => ({
  sendContactMessage: mocks.sendContactMessage,
  requestWallRemoval: mocks.requestWallRemoval,
}))

vi.mock("../services/supporter/list-supporters-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listSupporters: mocks.listSupporters,
}))

describe("contato com a associação", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.listSupporters.mockResolvedValue({ supporters: [{ name: "Ana Lima" }], total: 1, contributors: 2, seed: "abc123" })
  })

  it("grava a mensagem do Fale Conosco na caixa de entrada e só então confirma", async () => {
    const user = userEvent.setup()
    mocks.sendContactMessage.mockResolvedValue(undefined)

    renderWithProviders(<ContactPage />, "/fale-conosco")

    await fillField(user, /nome completo/i, "Joana Ribeiro")
    await fillField(user, /^e-mail/i, "joana@exemplo.com.br")
    await user.selectOptions(screen.getByLabelText(/^assunto/i), "doacao")
    await fillField(user, /^mensagem/i, "Posso doar em nome da empresa e receber o recibo com o CNPJ?")
    await user.click(screen.getByRole("button", { name: /enviar mensagem/i }))

    await waitFor(() => expect(mocks.sendContactMessage).toHaveBeenCalledTimes(1))
    expect(mocks.sendContactMessage.mock.calls[0][0]).toEqual({
      channel: "contact",
      subject: "doacao",
      name: "Joana Ribeiro",
      email: "joana@exemplo.com.br",
      phone: null,
      message: "Posso doar em nome da empresa e receber o recibo com o CNPJ?",
    })

    const status = await screen.findByRole("status")
    expect(status).toHaveTextContent(/recebemos sua mensagem/i)
    expect(status).toHaveTextContent("joana@exemplo.com.br")
  })

  it("mantém o texto e oferece o e-mail quando o servidor não responde", async () => {
    const user = userEvent.setup()
    mocks.sendContactMessage.mockRejectedValue(new Error("Network Error"))

    renderWithProviders(<OmbudsmanPage />, "/ouvidoria")

    await fillField(user, /nome completo/i, "Marcos Tavares")
    await fillField(user, /^e-mail/i, "marcos@exemplo.com.br")
    await user.selectOptions(screen.getByLabelText(/tipo de manifestação/i), "sugestao")
    await fillField(user, /^mensagem/i, "Uma sessão do Dia de Portas Abertas no fim da tarde ajudaria muito.")
    await user.click(screen.getByRole("button", { name: /enviar manifestação/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/contato@somosdobem.org.br/i)
    expect(mocks.sendContactMessage.mock.calls[0][0]).toEqual(expect.objectContaining({ channel: "ombudsman", subject: "sugestao" }))
    expect(screen.getByLabelText(/^mensagem/i)).toHaveValue("Uma sessão do Dia de Portas Abertas no fim da tarde ajudaria muito.")
    expect(screen.queryByText(/recebemos sua mensagem/i)).not.toBeInTheDocument()
  })

  it("pede a retirada do nome do mural sem afirmar que ele já saiu", async () => {
    const user = userEvent.setup()
    mocks.requestWallRemoval.mockResolvedValue(undefined)

    renderWithProviders(<SupportersPage />, "/mural-do-bem")

    await fillField(user, /nome como aparece no mural/i, "Ana Lima")
    await fillField(user, /e-mail usado na contribuição/i, "ana@exemplo.com.br")
    await user.click(screen.getByRole("button", { name: /pedir a retirada/i }))

    await waitFor(() =>
      expect(mocks.requestWallRemoval.mock.calls[0][0]).toEqual({ name: "Ana Lima", email: "ana@exemplo.com.br", message: null }),
    )

    const status = await screen.findByText(/recebemos o pedido/i)
    expect(status).toHaveTextContent(/a equipe confere o cadastro/i)
  })

  it("não envia pedido de retirada sem e-mail", async () => {
    const user = userEvent.setup()

    renderWithProviders(<SupportersPage />, "/mural-do-bem")

    await fillField(user, /nome como aparece no mural/i, "Ana Lima")
    await user.click(screen.getByRole("button", { name: /pedir a retirada/i }))

    expect(await screen.findByText(/escreva um e-mail válido/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/e-mail usado na contribuição/i)).toHaveFocus())
    expect(mocks.requestWallRemoval).not.toHaveBeenCalled()
  })
})
