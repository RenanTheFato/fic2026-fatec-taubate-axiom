import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import AboutPage from "../pages/public/about-page"
import BoardPage from "../pages/public/board-page"
import FaqPage from "../pages/public/faq-page"
import { renderWithProviders } from "./utils/render-with-providers"

describe("páginas institucionais", () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.leituraFacil
  })

  it("o Modo Leitura Fácil troca o texto longo pelo curto", async () => {
    const user = userEvent.setup()
    renderWithProviders(<AboutPage />)

    expect(screen.getByText(/atua na defesa de direitos/i)).toBeInTheDocument()

    const toggle = screen.getByRole("button", { name: /leitura fácil/i })
    expect(toggle).toHaveAttribute("aria-pressed", "false")

    await user.click(toggle)

    expect(toggle).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(/cuidamos de pessoas com deficiência intelectual/i)).toBeInTheDocument()
    expect(screen.queryByText(/atua na defesa de direitos/i)).not.toBeInTheDocument()
    expect(document.documentElement.dataset.leituraFacil).toBe("on")
  })

  // Os dois colegiados são listas diferentes, e a mesma pessoa pode estar nas
  // duas: quem é eleito para um cargo também pode responder por uma pasta. O
  // teste trava isso, senão uma "correção" futura junta as duas listas e some
  // com um dos cargos da pessoa repetida.
  it("a diretoria mostra o colegiado eleito e as pastas nomeadas", async () => {
    renderWithProviders(<BoardPage />)

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /amadeu tachinardi rocha/i })).toBeInTheDocument(),
    )

    expect(screen.getByRole("heading", { name: /diretoria eleita/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /diretoria nomeada/i })).toBeInTheDocument()

    expect(screen.getByText("Presidente")).toBeInTheDocument()
    expect(screen.getByText("Diretor de Tecnologia")).toBeInTheDocument()

    // Victor ocupa a Tesouraria e a pasta de Planejamento, então o nome aparece
    // duas vezes, uma em cada colegiado.
    expect(screen.getAllByRole("heading", { name: /victor gonçalves hipólito/i })).toHaveLength(2)
  })

  it("a sanfona do FAQ liga botão e resposta por ARIA", async () => {
    const user = userEvent.setup()
    renderWithProviders(<FaqPage />)

    // A primeira pergunta de cada grupo já nasce aberta, então o teste usa uma
    // que começa fechada, que é o estado que a interação precisa mudar.
    const question = await screen.findByRole("button", { name: /onde ficam as unidades/i })
    expect(question).toHaveAttribute("aria-expanded", "false")

    await user.click(question)

    expect(question).toHaveAttribute("aria-expanded", "true")

    const panelId = question.getAttribute("aria-controls")
    expect(panelId).toBeTruthy()
    expect(document.getElementById(panelId!)).toHaveAccessibleName("Onde ficam as unidades?")
  })
})
