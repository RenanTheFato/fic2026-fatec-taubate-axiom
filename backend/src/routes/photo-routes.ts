import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { UploadPhotoController } from "../controllers/photo/upload-photo-controller.js";
import { GetPhotoController } from "../controllers/photo/get-photo-controller.js";

export const photoRoutes = Router()

// A foto de capa é peça de divulgação, então quem envia é quem cadastra campanha, evento, produto
// e notícia. O corpo cru é lido pelo `express.raw` montado no server.ts, antes do `express.json`.
photoRoutes.post("/upload", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new UploadPhotoController().handle(req, res)
})

// Pública: a foto já está na vitrine do site, e o id é um UUID imprevisível.
photoRoutes.get("/:id", async (req: Request, res: Response) => {
  return new GetPhotoController().handle(req, res)
})
