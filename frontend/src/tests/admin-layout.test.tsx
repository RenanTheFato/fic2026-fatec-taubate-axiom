import { screen, within } from "@testing-library/react"
import { Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import AdminLayout from "../layouts/admin-layout"
import type { User, UserRole } from "../types/user-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { getProfile } = vi.hoisted(() => ({ getProfile: vi.fn() }))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

function signedInAs(role: UserRole) {
  const user: User = {
    id: "99999999-9999-4999-8999-999999999999",
    name: "Equipe Somos do Bem",
    email: "equipe@somosdobem.org.br",
    role,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }

  window.localStorage.setItem("somosdobem.token", "token-de-teste")
  getProfile.mockResolvedValue(user)
}

function renderAt(path: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="*" element={<p>conteúdo da tela</p>} />
      </Route>
    </Routes>,
    path,
  )
}

describe("menu do painel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("mostra os módulos em cima e as telas do módulo atual embaixo", async () => {
    signedInAs("admin")
    renderAt("/admin/comunicacao/eventos")

    const modules = await screen.findByRole("navigation", { name: /módulos do painel/i })
    expect(within(modules).getByRole("link", { name: /painel geral/i })).toBeInTheDocument()
    expect(within(modules).getByRole("link", { name: /financeiro/i })).toBeInTheDocument()
    expect(within(modules).getByRole("link", { name: /comunicação/i })).toHaveAttribute("aria-current", "page")

    const screens = screen.getByRole("navigation", { name: /telas de comunicação/i })
    const tabs = within(screens).getAllByRole("link").map((link) => link.textContent)
    expect(tabs).toEqual(["Campanhas", "Eventos", "Produtos", "Notícias", "Certificados"])
    expect(within(screens).getByRole("link", { name: /eventos/i })).toHaveAttribute("aria-current", "page")
  })

  it("mantém o módulo aceso numa tela que mora abaixo de outra", async () => {
    signedInAs("communication")
    renderAt("/admin/comunicacao/certificados/editor")

    const screens = await screen.findByRole("navigation", { name: /telas de comunicação/i })
    expect(within(screens).getByRole("link", { name: /certificados/i })).toHaveClass("text-primary")
  })

  it("não oferece módulo que o papel não alcança", async () => {
    signedInAs("finance")
    renderAt("/admin/financeiro/recibos")

    const modules = await screen.findByRole("navigation", { name: /módulos do painel/i })
    expect(within(modules).queryByRole("link", { name: /comunicação/i })).not.toBeInTheDocument()
    expect(within(modules).queryByRole("link", { name: /meu painel/i })).not.toBeInTheDocument()
  })

  it("não desenha a segunda faixa quando o módulo tem uma tela só", async () => {
    signedInAs("admin")
    renderAt("/admin")

    await screen.findByRole("navigation", { name: /módulos do painel/i })
    expect(screen.queryByRole("navigation", { name: /telas de/i })).not.toBeInTheDocument()
  })
})
