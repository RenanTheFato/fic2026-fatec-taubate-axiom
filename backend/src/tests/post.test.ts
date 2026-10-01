import { CreatePostController } from "../controllers/post/create-post-controller.js";
import { GetPostBySlugController } from "../controllers/post/get-post-by-slug-controller.js";
import { Post } from "../models/post-model.js";
import { ArchivePostService } from "../services/post/archive-post-service.js";
import { DeletePostService } from "../services/post/delete-post-service.js";
import { GetPostBySlugService } from "../services/post/get-post-by-slug-service.js";
import { ListPostsService } from "../services/post/list-posts-service.js";
import { PublishPostService } from "../services/post/publish-post-service.js";
import { BadRequestError } from "../config/errors.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

function storedPost(overrides: Record<string, unknown> = {}) {
  const attributes = {
    id: "post-1",
    title: "Natal do Bem 2026 está no ar",
    slug: "natal-do-bem-2026-esta-no-ar",
    status: "draft",
    published_at: null,
    ...overrides,
  }

  const post = {
    ...attributes,
    update: jest.fn().mockImplementation(async (values: Record<string, unknown>) => Object.assign(post, values)),
    destroy: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockImplementation(() => ({ ...attributes })),
  }

  return post
}

describe("News posts (write as draft, publish, read in public)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("creates a post as a draft, with the slug from the title and the author from the token", async () => {
    jest.spyOn(Post, "findOne").mockResolvedValue(null)
    const create = jest.spyOn(Post, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      get: () => values,
    })) as never)

    const req = mockRequest({
      user: { id: "user-communication" },
      body: {
        title: "Natal do Bem 2026 está no ar",
        excerpt: "A campanha de fim de ano já recebe doações.",
        body: "Primeiro parágrafo da notícia.\n\nSegundo parágrafo da notícia.",
        category: "eventos",
        image_url: "/imagens/campanhas/natal-do-bem-2026.jpg",
      },
    } as never)
    const res = mockResponse()

    await new CreatePostController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(201)

    const written = create.mock.calls[0][0] as Record<string, unknown>
    expect(written.slug).toBe("natal-do-bem-2026-esta-no-ar")
    expect(written.status).toBe("draft")
    expect(written.author_id).toBe("user-communication")
  })

  it("refuses an image that is neither a site path nor an https address", async () => {
    const req = mockRequest({
      user: { id: "user-communication" },
      body: {
        title: "Notícia com imagem estranha",
        excerpt: "Um resumo com tamanho suficiente.",
        body: "Um corpo de notícia com tamanho suficiente.",
        category: "saude",
        image_url: "javascript:alert(1)",
      },
    } as never)
    const res = mockResponse()

    await new CreatePostController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("lists only published posts to the public, newest first", async () => {
    const findAndCountAll = jest.spyOn(Post, "findAndCountAll").mockResolvedValue({ rows: [], count: 0 } as never)

    await new ListPostsService().execute({ category: "eventos", page: 2, limit: 12 })

    const query = findAndCountAll.mock.calls[0][0] as Record<string, unknown>
    expect(query.where).toEqual({ status: "published", category: "eventos" })
    expect(query.order).toEqual([["published_at", "DESC"], ["id", "ASC"]])
    expect(query.offset).toBe(12)
  })

  it("answers 404 for a draft read by slug, exactly as for a post that never existed", async () => {
    const findOne = jest.spyOn(Post, "findOne").mockResolvedValue(null)

    const req = mockRequest({ params: { slug: "prestacao-de-contas" } as never })
    const res = mockResponse()

    await new GetPostBySlugController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect((findOne.mock.calls[0][0] as { where: Record<string, unknown> }).where).toEqual({
      slug: "prestacao-de-contas",
      status: "published",
    })
  })

  it("keeps the original date when an archived post is published again", async () => {
    const original = new Date("2025-12-20T12:00:00.000Z")
    const post = storedPost({ status: "archived", published_at: original })
    jest.spyOn(Post, "findByPk").mockResolvedValue(post as never)

    await new PublishPostService().execute({ post_id: "post-1" })

    expect(post.update).toHaveBeenCalledWith({ status: "published", published_at: original })
  })

  it("archives instead of deleting what was already public", async () => {
    const published = storedPost({ status: "published", published_at: new Date() })
    jest.spyOn(Post, "findByPk").mockResolvedValue(published as never)

    await expect(new DeletePostService().execute({ post_id: "post-1" })).rejects.toBeInstanceOf(BadRequestError)
    expect(published.destroy).not.toHaveBeenCalled()

    await new ArchivePostService().execute({ post_id: "post-1" })
    expect(published.update).toHaveBeenCalledWith({ status: "archived" })
  })

  it("never returns the author id on the public read", async () => {
    const findOne = jest.spyOn(Post, "findOne").mockResolvedValue(storedPost({ status: "published" }) as never)

    await new GetPostBySlugService().execute({ slug: "natal-do-bem-2026-esta-no-ar" })

    expect((findOne.mock.calls[0][0] as { attributes: unknown }).attributes).toEqual({ exclude: ["author_id"] })
  })
})
