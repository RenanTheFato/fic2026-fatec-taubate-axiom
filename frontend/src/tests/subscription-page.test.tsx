import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import SubscriptionPage from "../pages/public/subscription-page"
import { renderWithProviders } from "./utils/render-with-providers"

const { params } = vi.hoisted(() => ({ params: { token: "" } }))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()

  return { ...actual, useParams: () => params }
})

describe("gerenciar doação recorrente", () => {
  it("mostra a doação e oferece o cancelamento em dois passos", async () => {
    params.token = "tok-doacao-mensal-0001"

    const user = (await import("@testing-library/user-event")).default.setup()
    renderWithProviders(<SubscriptionPage />, "/assinaturas/gerenciar/tok-doacao-mensal-0001")

    expect(await screen.findByRole("heading", { name: /gerenciar sua doação/i })).toBeInTheDocument()
    expect(screen.getAllByText(/R\$\s?50,00/).length).toBeGreaterThan(0)

    // Encerrar uma doação recorrente não pode acontecer em um clique: o primeiro
    // botão abre a explicação, e só depois existe a confirmação.
    expect(screen.queryByRole("link", { name: /confirmar cancelamento/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /quero cancelar/i }))

    expect(screen.getByRole("link", { name: /confirmar cancelamento/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /manter minha doação/i })).toBeInTheDocument()
  })

  it("link truncado no e-mail não vira tela de erro", async () => {
    params.token = "tok-123"

    renderWithProviders(<SubscriptionPage />, "/assinaturas/gerenciar/tok-123")

    expect(await screen.findByText(/não encontramos esta doação/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /falar com a associação/i })).toHaveAttribute(
      "href",
      "/fale-conosco",
    )
  })
})
