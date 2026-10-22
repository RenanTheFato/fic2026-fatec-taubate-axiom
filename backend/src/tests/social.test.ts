import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CreateSocialPostController } from "../controllers/social/create-social-post-controller.js";
import { ImportInstagramPostsController } from "../controllers/social/import-instagram-posts-controller.js";
import { env } from "../config/env.js";
import { SocialPost } from "../models/social-post-model.js";
import { ListSocialPostsService } from "../services/social/list-social-posts-service.js";
import { UploadPhotoService } from "../services/photo/upload-photo-service.js";
import { isNetworkUrl, youtubeVideoId } from "../utils/social-url.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

const STAR = readFileSync(resolve(process.cwd(), "src/assets/certificate/natal-estrela.png"))

function post(overrides: Record<string, unknown> = {}) {
  return {
    network: "instagram",
    url: "https://www.instagram.com/p/C9xYz12AbCd/",
    caption: "O Natal do Bem 2026 começou!",
    image_url: "/imagens/campanhas/natal-do-bem-2026.jpg",
    published_at: "2026-10-07T15:00:00.000Z",
    ...overrides,
  }
}

// O token é opcional no env, e a chave nem existe quando ele falta: o teste escreve e devolve o
// valor anterior no fim, em vez de substituir uma propriedade que pode não estar lá.
const originalToken = env.INSTAGRAM_ACCESS_TOKEN

function useToken(token: string | undefined) {
  env.INSTAGRAM_ACCESS_TOKEN = token
}

function response(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 400, statusText: ok ? "OK" : "Bad Request", json: async () => body, arrayBuffer: async () => STAR }
}

describe("Social media page (what the association posts, shown on the site)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  afterEach(() => {
    useToken(originalToken)
  })

  it("reads the video id from every address YouTube hands out when sharing", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("dQw4w9WgXcQ")
    expect(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
    expect(youtubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
    expect(youtubeVideoId("https://www.youtube.com/@somosdobem.indaiatuba")).toBeNull()
    expect(isNetworkUrl("instagram", "https://www.facebook.com/somosdobem.indaiatuba")).toBe(false)
  })

  it("stores a YouTube video with its id and the cover YouTube already publishes", async () => {
    const create = jest.spyOn(SocialPost, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      get: () => values,
    })) as never)

    const res = mockResponse()
    await new CreateSocialPostController().handle(mockRequest({
      user: { id: "user-communication" },
      body: post({ network: "youtube", url: "https://youtu.be/dQw4w9WgXcQ", image_url: null }),
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      video_id: "dQw4w9WgXcQ",
      image_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      visible: true,
    }))
  })

  it("refuses an Instagram post without its image and an address of another network", async () => {
    const create = jest.spyOn(SocialPost, "create")

    const imageless = mockResponse()
    await new CreateSocialPostController().handle(mockRequest({ user: { id: "user-communication" }, body: post({ image_url: null }) } as never), imageless)

    const wrongNetwork = mockResponse()
    await new CreateSocialPostController().handle(mockRequest({
      user: { id: "user-communication" },
      body: post({ url: "https://www.facebook.com/somosdobem.indaiatuba/posts/1" }),
    } as never), wrongNetwork)

    expect(imageless.status).toHaveBeenCalledWith(400)
    expect(wrongNetwork.status).toHaveBeenCalledWith(400)
    expect(create).not.toHaveBeenCalled()
  })

  it("shows the visitor only visible posts, with the count of each network", async () => {
    const findAndCountAll = jest.spyOn(SocialPost, "findAndCountAll").mockResolvedValue({ rows: [], count: 0 } as never)
    jest.spyOn(SocialPost, "findAll").mockResolvedValue([{ network: "instagram", total: 6 }, { network: "facebook", total: 3 }] as never)

    const { networks } = await new ListSocialPostsService().execute({ network: null, page: 1, limit: 12 })

    expect(findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ where: { visible: true } }))
    expect(networks).toEqual({ instagram: 6, facebook: 3, youtube: 0 })
  })

  it("says the Instagram import is off when there is no token, without calling Instagram", async () => {
    useToken(undefined)
    const fetch = jest.spyOn(globalThis, "fetch")

    const res = mockResponse()
    await new ImportInstagramPostsController().handle(mockRequest({ user: { id: "user-communication" } } as never), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it("imports only what is new, copying each image so the post doesn't break when the Instagram address expires", async () => {
    useToken("token-de-teste")
    jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response({
        data: [
          { id: "1801", caption: "Natal do Bem", media_type: "IMAGE", media_url: "https://cdn.instagram.com/1801.jpg", permalink: "https://www.instagram.com/p/AAA/", timestamp: "2026-10-07T15:00:00+0000" },
          { id: "1800", caption: "Já importado", media_type: "IMAGE", media_url: "https://cdn.instagram.com/1800.jpg", permalink: "https://www.instagram.com/p/BBB/", timestamp: "2026-10-01T15:00:00+0000" },
        ],
      }) as never)
      .mockResolvedValueOnce(response(null) as never)
    jest.spyOn(SocialPost, "findAll").mockResolvedValue([{ external_id: "1800" }] as never)
    const upload = jest.spyOn(UploadPhotoService.prototype, "execute").mockResolvedValue({ url: "http://localhost:3333/api/v1/photo/abc" } as never)
    const create = jest.spyOn(SocialPost, "create").mockResolvedValue({} as never)

    const res = mockResponse()
    await new ImportInstagramPostsController().handle(mockRequest({ user: { id: "user-communication" } } as never), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(upload).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      network: "instagram",
      external_id: "1801",
      url: "https://www.instagram.com/p/AAA/",
      image_url: "http://localhost:3333/api/v1/photo/abc",
    }))
    expect((res.json as jest.Mock).mock.calls[0][0]).toMatchObject({ imported: 1, skipped: 1, failed: 0 })
  })
})
