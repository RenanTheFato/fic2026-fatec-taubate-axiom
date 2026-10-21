import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateContactMessageController } from "../controllers/contact/create-contact-message-controller.js";
import { RequestWallRemovalController } from "../controllers/contact/request-wall-removal-controller.js";
import { ListContactMessagesController } from "../controllers/contact/list-contact-messages-controller.js";
import { ResolveContactMessageController } from "../controllers/contact/resolve-contact-message-controller.js";
import { WithdrawFromWallController } from "../controllers/contact/withdraw-from-wall-controller.js";

export const contactRoutes = Router()

// As duas portas públicas: os formulários do site e o pedido de retirada do Mural do Bem.
contactRoutes.post("/create", async (req: Request, res: Response) => {
  return new CreateContactMessageController().handle(req, res)
})

contactRoutes.post("/wall-removal", async (req: Request, res: Response) => {
  return new RequestWallRemovalController().handle(req, res)
})

// A caixa de entrada. O papel abre a rota, e o service ainda filtra o canal: ouvidoria e
// candidatura ficam só com a administração.
contactRoutes.get("/list", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListContactMessagesController().handle(req, res)
})

contactRoutes.patch("/resolve/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ResolveContactMessageController().handle(req, res)
})

contactRoutes.patch("/withdraw-from-wall/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new WithdrawFromWallController().handle(req, res)
})
