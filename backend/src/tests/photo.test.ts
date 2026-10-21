import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GetPhotoController } from "../controllers/photo/get-photo-controller.js";
import { UploadPhotoController } from "../controllers/photo/upload-photo-controller.js";
import { CreateCampaignController } from "../controllers/campaign/create-campaign-controller.js";
import { UpdateProductController } from "../controllers/product/update-product-controller.js";
import { env } from "../config/env.js";
import { Photo } from "../models/photo-model.js";
import { CreateCampaignService } from "../services/campaign/create-campaign-service.js";
import { UpdateProductService } from "../services/product/update-product-service.js";
import { isImageUrl } from "../utils/image-url.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

const PICTURE = readFileSync(resolve(process.cwd(), "src/assets/certificate/natal-estrela.png"))

const photoId = "6f1c2a7e-4b3d-4e8f-9a10-2c3d4e5f6a7b"

describe("Cover photos (upload in the panel, use in the catalogue, serve to the site)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("stores an uploaded photo and answers with the address the catalogue records, never with the file", async () => {
    const create = jest.spyOn(Photo, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      get: () => ({ id: photoId, ...values }),
    })) as never)

    const res = mockResponse()

    await new UploadPhotoController().handle(mockRequest({
      user: { id: "user-communication" },
      query: { name: "cantata.png" },
      body: PICTURE,
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect((create.mock.calls[0][0] as Record<string, unknown>).uploaded_by).toBe("user-communication")

    const { photo } = (res.json as jest.Mock).mock.calls[0][0]
    expect(photo).not.toHaveProperty("data")
    expect(photo.url).toBe(`${env.APP_URL.replace(/\/+$/, "")}/api/v1/photo/${photoId}`)
    expect(isImageUrl(photo.url)).toBe(true)
  })

  it("refuses a file that is not PNG or JPEG, whatever the header says", async () => {
    const create = jest.spyOn(Photo, "create")
    const res = mockResponse()

    await new UploadPhotoController().handle(mockRequest({
      user: { id: "user-communication" },
      query: { name: "foto.jpg" },
      body: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"),
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(create).not.toHaveBeenCalled()
  })

  it("serves a photo as immutable and readable by the site's origin", async () => {
    jest.spyOn(Photo, "findByPk").mockResolvedValue({ mime_type: "image/png", data: PICTURE, size: PICTURE.length } as never)

    const res = mockResponse()
    res.set = jest.fn().mockReturnValue(res)

    await new GetPhotoController().handle(mockRequest({ params: { id: photoId } } as never), res)

    expect(res.status).toHaveBeenCalledWith(200)
    const headers = (res.set as jest.Mock).mock.calls[0][0]
    expect(headers["Cache-Control"]).toContain("immutable")
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("cross-origin")
  })

  it("lets a campaign carry an uploaded photo, but not an http address from somewhere else", async () => {
    const execute = jest.spyOn(CreateCampaignService.prototype, "execute").mockResolvedValue({ id: "campaign-1" } as never)
    const base = {
      title: "Natal do Bem 2026",
      goal_amount: 25000,
      starts_at: "2026-11-01T00:00:00.000Z",
    }

    const accepted = mockResponse()
    await new CreateCampaignController().handle(mockRequest({
      body: { ...base, image_url: `${env.APP_URL.replace(/\/+$/, "")}/api/v1/photo/${photoId}` },
    }), accepted)

    expect(accepted.status).toHaveBeenCalledWith(201)

    const refused = mockResponse()
    await new CreateCampaignController().handle(mockRequest({
      body: { ...base, image_url: "http://exemplo.com/foto.jpg" },
    }), refused)

    expect(refused.status).toHaveBeenCalledWith(400)
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it("accepts a site path on a product, the same rule as campaign, event and post", async () => {
    const execute = jest.spyOn(UpdateProductService.prototype, "execute").mockResolvedValue({ id: "product-1" } as never)
    const res = mockResponse()

    await new UpdateProductController().handle(mockRequest({
      params: { id: "product-1" } as never,
      body: { image_url: "/imagens/loja/camiseta-branca.jpg" },
    }), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ image_url: "/imagens/loja/camiseta-branca.jpg" }))
  })
})
