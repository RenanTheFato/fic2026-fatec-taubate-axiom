import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import SocialPage from "../pages/public/social-page"
import type { SocialPost } from "../types/social-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { listSocialPosts } = vi.hoisted(() => ({ listSocialPosts: vi.fn() }))

vi.mock("../services/social/list-social-posts-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listSocialPosts,
}))

const POSTS: SocialPost[] = [
  {
    id: "post-1",
    network: "instagram",
    url: "https://www.instagram.com/p/AAA/",
    caption: "O Natal do Bem 2026 começou!",
    image_url: "/imagens/campanhas/natal-do-bem-2026.jpg",
    video_id: null,
    published_at: "2026-10-07T15:00:00.000Z",
  },
  {
    id: "post-2",
    network: "youtube",
    url: "https://youtu.be/dQw4w9WgXcQ",
    caption: "Um dia na Oficina Terapêutica.",
    image_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    video_id: "dQw4w9WgXcQ",
    published_at: "2026-10-01T15:00:00.000Z",
  },
]

describe("redes sociais", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listSocialPosts.mockResolvedValue({ posts: POSTS, total: 2, networks: { instagram: 1, facebook: 0, youtube: 1 } })
  })

  it("mostra as publicações e o filtro só das redes que têm o que mostrar", async () => {
    renderWithProviders(<SocialPage />, "/redes-sociais")

    expect(screen.getByRole("heading", { name: /^redes sociais$/i, level: 1 })).toBeInTheDocument()
    expect(await screen.findByText("O Natal do Bem 2026 começou!")).toBeInTheDocument()

    const filters = screen.getByRole("group", { name: /^rede$/i })
    expect(within(filters).getByRole("button", { name: /instagram/i })).toBeInTheDocument()
    expect(within(filters).getByRole("button", { name: /youtube/i })).toBeInTheDocument()
    expect(within(filters).queryByRole("button", { name: /facebook/i })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /ver no instagram/i })).toHaveAttribute("href", "https://www.instagram.com/p/AAA/")
  })

  it("filtra pela rede escolhida", async () => {
    const user = userEvent.setup()

    renderWithProviders(<SocialPage />, "/redes-sociais")

    const filters = await screen.findByRole("group", { name: /^rede$/i })
    await user.click(within(filters).getByRole("button", { name: /youtube/i }))

    await waitFor(() => expect(listSocialPosts).toHaveBeenLastCalledWith({ network: "youtube", page: 1 }))
  })

  // O vídeo toca na própria página, e o player só existe depois que a pessoa
  // pediu: até lá a página não fala com o YouTube.
  it("toca o vídeo do YouTube no site, pelo domínio sem cookie", async () => {
    const user = userEvent.setup()

    renderWithProviders(<SocialPage />, "/redes-sociais")

    await screen.findByText("Um dia na Oficina Terapêutica.")
    expect(document.querySelector("iframe")).toBeNull()

    await user.click(screen.getByRole("button", { name: /assistir a publicação/i }))

    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByTitle(/vídeo do youtube/i)).toHaveAttribute("src", expect.stringContaining("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"))

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
