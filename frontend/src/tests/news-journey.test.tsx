import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NotFoundError } from "../config/errors"
import NewsPage from "../pages/public/news-page"
import PostPage from "../pages/public/post-page"
import { toNewsPost } from "../services/news/list-news-service"
import type { ApiPost, NewsPost } from "../types/news-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { params, listNews, getPostBySlug } = vi.hoisted(() => ({
  params: { slug: "" },
  listNews: vi.fn(),
  getPostBySlug: vi.fn(),
}))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()

  return { ...actual, useParams: () => params }
})

vi.mock("../services/news/list-news-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listNews,
}))

vi.mock("../services/news/get-post-by-slug-service", () => ({ getPostBySlug }))

function apiPost(overrides: Partial<ApiPost>): ApiPost {
  return {
    id: "post",
    title: "Publicação",
    slug: "publicacao",
    excerpt: "Resumo da publicação.",
    body: "Primeiro parágrafo.\n\nSegundo parágrafo.",
    category: "eventos",
    image_url: null,
    status: "published",
    published_at: "2026-09-18T12:00:00.000Z",
    created_at: "2026-09-18T12:00:00.000Z",
    updated_at: "2026-09-18T12:00:00.000Z",
    ...overrides,
  }
}

const POSTS: NewsPost[] = [
  apiPost({
    id: "1",
    title: "Chocolate do Bem: uma Páscoa de solidariedade",
    slug: "chocolate-do-bem-uma-pascoa-de-solidariedade",
    category: "eventos",
  }),
  apiPost({
    id: "2",
    title: "Mudança de nome da APAE de Indaiatuba",
    slug: "mudanca-de-nome-da-apae-de-indaiatuba",
    category: "inclusao",
    body: "Em coletiva de imprensa, a instituição anunciou o novo nome e a nova identidade visual: Somos do Bem.\n\nA troca de nome não muda o trabalho.",
  }),
].map(toNewsPost)

describe("notícias", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listNews.mockResolvedValue(POSTS)
  })

  // O filtro é estado de tela sobre uma lista já carregada, então o teste
  // percorre exatamente o caminho do visitante: chega, vê tudo, escolhe um
  // assunto e passa a ver só aquele.
  it("lista as publicações e filtra por assunto", async () => {
    const user = userEvent.setup()
    renderWithProviders(<NewsPage />, "/noticias")

    expect(await screen.findByRole("link", { name: /chocolate do bem/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /mudança de nome/i })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^inclusão$/i }))

    expect(screen.getByRole("link", { name: /mudança de nome/i })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /chocolate do bem/i })).not.toBeInTheDocument()
  })

  it("abre a publicação pelo slug, com o corpo em parágrafos e as relacionadas", async () => {
    params.slug = "mudanca-de-nome-da-apae-de-indaiatuba"
    getPostBySlug.mockResolvedValue(POSTS[1])

    renderWithProviders(<PostPage />, "/noticias/mudanca-de-nome-da-apae-de-indaiatuba")

    expect(await screen.findByRole("heading", { name: /mudança de nome/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/nova identidade visual/i)).toBeInTheDocument()
    // O texto corrido da API vira dois parágrafos, e não um bloco com quebra perdida.
    expect(screen.getByText(/a troca de nome não muda o trabalho/i).tagName).toBe("P")
    expect(await screen.findByRole("heading", { name: /outras publicações/i })).toBeInTheDocument()
  })

  it("endereço que não existe é resposta, e não tela quebrada", async () => {
    params.slug = "publicacao-que-nao-existe"
    getPostBySlug.mockRejectedValue(new NotFoundError("Publicação não encontrada"))

    renderWithProviders(<PostPage />, "/noticias/publicacao-que-nao-existe")

    expect(await screen.findByText(/publicação não encontrada/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /ver todas as notícias/i })).toHaveAttribute(
      "href",
      "/noticias",
    )
  })
})
