import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { UnauthorizedError } from "../config/errors"
import LoginPage from "../pages/public/login-page"
import type { User, UserRole } from "../types/user-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const { authenticate, getProfile } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getProfile: vi.fn(),
}))

vi.mock("../services/auth/auth-user-service", () => ({ authenticate }))
vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

function profile(role: UserRole): User {
  return {
    id: "77777777-7777-4777-8777-777777777777",
    name: "Equipe Somos do Bem",
    email: "equipe@somosdobem.org.br",
    role,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }
}

// O destino de cada papel é o que se quer provar, então cada rota só precisa de
// um título próprio. A tela de verdade é testada em `admin-access`.
function routes() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/admin" element={<h1>Painel geral</h1>} />
      <Route path="/admin/financeiro/transacoes" element={<h1>Transações</h1>} />
      <Route path="/admin/comunicacao/campanhas" element={<h1>Campanhas</h1>} />
    </Routes>
  )
}

async function signIn(person: ReturnType<typeof userEvent.setup>) {
  await fillField(person, /e-mail/i, "equipe@somosdobem.org.br")
  await fillField(person, /senha/i, "Somos@2026")
  await person.click(screen.getByRole("button", { name: /^entrar$/i }))
}

describe("entrar no sistema", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticate.mockResolvedValue("token-de-teste")
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  // Este teste existe por causa de um defeito real: o `enabled` da consulta de
  // perfil era calculado a partir do `localStorage` durante a renderização, e
  // gravar o token no login não re-renderizava o provider. A consulta ficava
  // desligada para sempre, o perfil nunca chegava e a tela de login não saía do
  // lugar, com qualquer papel.
  it("leva a administração para o painel geral depois de entrar", async () => {
    getProfile.mockResolvedValue(profile("admin"))

    renderWithProviders(routes(), "/entrar")

    await signIn(userEvent.setup())

    expect(await screen.findByRole("heading", { name: /painel geral/i })).toBeInTheDocument()
  })

  it("leva a comunicação para as campanhas, e não para o painel geral", async () => {
    getProfile.mockResolvedValue(profile("communication"))

    renderWithProviders(routes(), "/entrar")

    await signIn(userEvent.setup())

    expect(await screen.findByRole("heading", { name: /^campanhas$/i })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /painel geral/i })).not.toBeInTheDocument()
  })

  it("não sai da tela quando a senha é recusada", async () => {
    authenticate.mockRejectedValue(new UnauthorizedError("E-mail ou senha inválidos."))

    renderWithProviders(routes(), "/entrar")

    await signIn(userEvent.setup())

    expect(await screen.findByText(/e-mail ou senha inválidos/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^entrar$/i })).toBeInTheDocument()
    expect(getProfile).not.toHaveBeenCalled()
  })
})
