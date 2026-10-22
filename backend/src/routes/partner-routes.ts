import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { ApplyPartnerController } from "../controllers/partner/apply-partner-controller.js";
import { ListPartnersController } from "../controllers/partner/list-partners-controller.js";
import { GetPartnerProfileController } from "../controllers/partner/get-partner-profile-controller.js";
import { ResubmitPartnerController } from "../controllers/partner/resubmit-partner-controller.js";
import { ListPartnerApplicationsController } from "../controllers/partner/list-partner-applications-controller.js";
import { ReviewPartnerController } from "../controllers/partner/review-partner-controller.js";

export const partnerRoutes = Router()

// As duas portas públicas: o pedido de parceria e a rede que a página de parceiros mostra.
partnerRoutes.post("/apply", async (req: Request, res: Response) => {
  return new ApplyPartnerController().handle(req, res)
})

partnerRoutes.get("/list", async (req: Request, res: Response) => {
  return new ListPartnersController().handle(req, res)
})

// O painel da própria empresa. O id vem do token, nunca da URL.
partnerRoutes.get("/profile", AuthMiddleware, RoleMiddleware("partner"), async (req: Request, res: Response) => {
  return new GetPartnerProfileController().handle(req, res)
})

partnerRoutes.patch("/resubmit", AuthMiddleware, RoleMiddleware("partner"), async (req: Request, res: Response) => {
  return new ResubmitPartnerController().handle(req, res)
})

// A análise dos pedidos é da associação: administração e comunicação, que cuida da captação.
partnerRoutes.get("/list-applications", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListPartnerApplicationsController().handle(req, res)
})

partnerRoutes.patch("/review/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ReviewPartnerController().handle(req, res)
})
