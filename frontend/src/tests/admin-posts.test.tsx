import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import PostsPage from "../pages/admin/posts-page"
import type { AdminPost } from "../types/news-types"
import type { User } from "../types/user-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const { getProfile, listAllPosts, savePost, actOnPost } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listAllPosts: vi.fn(),
  savePost: vi.fn(),
  actOnPost: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

vi.mock("../services/admin/posts-service", () => ({ listAllPosts, savePost, actOnPost }))

function post(overrides: Partial<AdminPost>): AdminPost {
  return {
    id: "post-1",
    title: "Prestação de contas do semestre",
    slug: "prestacao-de-contas-do-semestre",
    excerpt: "O resumo do que entrou.",
    body: "Primeiro parágrafo.\n\nSegundo parágrafo.",
    category: "inclusao",
    image_url: null,
    status: "draft",
    published_at: null,
    created_at: "2026-10-01T12:00:00.000Z",
    updated_at: "2026-10-01T12:00:00.000Z",
    author: { id: "user-1", name: "Comunicação Somos do Bem" },
    ...overrides,
  }
}

const COMMUNICATION: User = {
  id: "user-1",
  name: "Comunicação Somos do Bem",
  email: "comunicacao@somosdobem.org.br",
  role: "communication",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
}

describe("notícias no painel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.setItem("somosdobem.token", "token-de-teste")
    getProfile.mockResolvedValue(COMMUNICATION)
    listAllPosts.mockResolvedValue([
      post({}),
      post({ id: "post-2", title: "Natal do Bem 2026 está no ar", slug: "natal-do-bem-2026-esta-no-ar", status: "published", published_at: "2026-09-19T12:00:00.000Z" }),
    ])
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("publica o rascunho e arquiva o que está no ar, cada um com a ação que o estado permite", async () => {
    const user = userEvent.setup()
    actOnPost.mockResolvedValue(undefined)

    renderWithProviders(<PostsPage />, "/admin/comunicacao/noticias")

    await screen.findAllByText("Prestação de contas do semestre")

    await user.click(screen.getAllByRole("button", { name: /^publicar$/i })[0])
    await waitFor(() => expect(actOnPost.mock.calls[0]?.[0]).toEqual({ action: "publish", id: "post-1" }))

    await user.click(screen.getAllByRole("button", { name: /^arquivar$/i })[0])
    await waitFor(() => expect(actOnPost.mock.calls[1]?.[0]).toEqual({ action: "archive", id: "post-2" }))
  })

  it("escreve uma notícia nova como rascunho, com os parágrafos separados", async () => {
    const user = userEvent.setup()
    savePost.mockResolvedValue({ ...post({ id: "post-3", title: "Bazar de Natal confirmado" }) })

    renderWithProviders(<PostsPage />, "/admin/comunicacao/noticias")

    await user.click(await screen.findByRole("button", { name: /escrever notícia/i }))
    await fillField(user, /^título/i, "Bazar de Natal confirmado")
    await fillField(user, /^resumo/i, "O bazar volta em dezembro, na sede.")
    await fillField(user, /^texto/i, "Primeiro parágrafo do bazar.\n\nSegundo parágrafo do bazar.")
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }))

    await waitFor(() => expect(savePost).toHaveBeenCalledTimes(1))
    expect(savePost.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        title: "Bazar de Natal confirmado",
        category: "eventos",
        body: "Primeiro parágrafo do bazar.\n\nSegundo parágrafo do bazar.",
        image_url: null,
      }),
    )
    expect(await screen.findByText(/foi salva como rascunho/i)).toBeInTheDocument()
  })

  it("não envia texto curto demais e leva o foco ao primeiro campo com problema", async () => {
    const user = userEvent.setup()

    renderWithProviders(<PostsPage />, "/admin/comunicacao/noticias")

    await user.click(await screen.findByRole("button", { name: /escrever notícia/i }))
    await fillField(user, /^título/i, "Oi")
    await user.click(screen.getByRole("button", { name: /salvar rascunho/i }))

    expect(await screen.findByText(/pelo menos 4 letras/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/^título/i)).toHaveFocus())
    expect(savePost).not.toHaveBeenCalled()
  })
})
