import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import PartnersPage from "../pages/public/partners-page"
import { renderWithProviders } from "./utils/render-with-providers"

describe("parceiros", () => {
  // Parceiro sem arquivo de logo continua sendo um item de lista com nome
  // legível, e não um buraco na grade: é isso que mantém a página apresentável
  // enquanto as marcas não chegam.
  it("lista a rede com nome acessível por parceiro", async () => {
    renderWithProviders(<PartnersPage />, "/parceiros")

    expect(screen.getByRole("heading", { name: /^parceiros$/i })).toBeInTheDocument()
    expect(await screen.findByText("Mann + Hummel")).toBeInTheDocument()
    expect(screen.getByText("Cobreq")).toBeInTheDocument()
  })

  it("oferece o caminho de quem quer entrar na rede", () => {
    renderWithProviders(<PartnersPage />, "/parceiros")

    expect(screen.getByRole("link", { name: /quero ser parceiro/i })).toHaveAttribute(
      "href",
      "/fale-conosco",
    )
    expect(screen.getByRole("heading", { name: /como uma empresa entra na rede/i })).toBeInTheDocument()
  })
})
