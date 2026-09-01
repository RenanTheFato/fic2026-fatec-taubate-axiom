import { screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import HomePage from "../pages/public/home-page"
import { renderWithProviders } from "./utils/render-with-providers"

vi.mock("../services/event/list-upcoming-events-service", () => ({
  listUpcomingEvents: vi.fn(async () => [
    {
      id: "1",
      campaign_id: null,
      title: "Jantar do Bem",
      slug: "jantar-do-bem",
      description: "Jantar beneficente da associação.",
      location: "Indaiatuba",
      starts_at: "2026-08-21T19:00:00.000Z",
      ends_at: null,
      ticket_price: "120.00",
      capacity: 100,
      taken_seats: 90,
      status: "published",
      image: null,
    },
  ]),
}))

vi.mock("../services/news/list-latest-news-service", () => ({
  listLatestNews: vi.fn(async () => []),
}))

describe("home", () => {
  it("mostra a identidade da ONG e as duas ações principais", async () => {
    renderWithProviders(<HomePage />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Somos do Bem")

    const doar = screen.getAllByRole("link", { name: /quero doar/i })
    expect(doar.length).toBeGreaterThan(0)
    expect(doar[0]).toHaveAttribute("href", "/doe-agora")

    expect(screen.getAllByRole("link", { name: /seja volunt/i })[0]).toHaveAttribute(
      "href",
      "/seja-voluntario",
    )

    // Os números institucionais precisam estar no HTML sem depender da animação.
    await waitFor(() => expect(screen.getByText("924")).toBeInTheDocument())
  })

  it("mostra o evento da agenda com o aviso de últimas vagas", async () => {
    renderWithProviders(<HomePage />)

    await waitFor(() => expect(screen.getByText("Jantar do Bem")).toBeInTheDocument())
    expect(screen.getByText("Últimas 10 vagas")).toBeInTheDocument()
  })

  it("assume o estado vazio quando não há notícia publicada", async () => {
    renderWithProviders(<HomePage />)

    await waitFor(() =>
      expect(screen.getByText(/ainda não há publicações/i)).toBeInTheDocument(),
    )
  })

  it("dá lugar próprio aos parceiros, com nome legível e chamada de adesão", async () => {
    renderWithProviders(<HomePage />)

    expect(screen.getByRole("heading", { name: /nossos parceiros/i })).toBeInTheDocument()

    // A faixa duplica a lista para o laço não ter emenda, e marca a cópia como
    // aria-hidden: na árvore de acessibilidade cada parceiro aparece uma vez só.
    await waitFor(() => expect(screen.getAllByText("Mann + Hummel").length).toBeGreaterThan(0))

    const naArvore = screen
      .getAllByRole("listitem")
      .filter((item) => item.textContent === "Mann + Hummel")

    expect(naArvore).toHaveLength(1)

    expect(screen.getByRole("link", { name: /quero ser parceiro/i })).toHaveAttribute(
      "href",
      "/parceiros",
    )
  })

  it("reserva o lugar das fotos que ainda não existem", async () => {
    renderWithProviders(<HomePage />)

    const slots = await screen.findAllByRole("img", { name: /espaço reservado para foto/i })
    expect(slots.length).toBeGreaterThan(0)
  })
})
