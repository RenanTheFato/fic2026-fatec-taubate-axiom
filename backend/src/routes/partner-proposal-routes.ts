import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreatePartnerProposalController } from "../controllers/partner-proposal/create-partner-proposal-controller.js";
import { ListMyPartnerProposalsController } from "../controllers/partner-proposal/list-my-partner-proposals-controller.js";
import { WithdrawPartnerProposalController } from "../controllers/partner-proposal/withdraw-partner-proposal-controller.js";
import { PayPartnerProposalController } from "../controllers/partner-proposal/pay-partner-proposal-controller.js";
import { ListPartnerProposalsController } from "../controllers/partner-proposal/list-partner-proposals-controller.js";
import { ReviewPartnerProposalController } from "../controllers/partner-proposal/review-partner-proposal-controller.js";

export const partnerProposalRoutes = Router()

// O lado da empresa: sugerir, acompanhar, desistir e pagar o que foi aceito. O service ainda confere
// que a proposta é da empresa que chama, e a de outra responde como inexistente.
partnerProposalRoutes.post("/create", AuthMiddleware, RoleMiddleware("partner"), async (req: Request, res: Response) => {
  return new CreatePartnerProposalController().handle(req, res)
})

partnerProposalRoutes.get("/mine", AuthMiddleware, RoleMiddleware("partner"), async (req: Request, res: Response) => {
  return new ListMyPartnerProposalsController().handle(req, res)
})

partnerProposalRoutes.patch("/withdraw/:id", AuthMiddleware, RoleMiddleware("partner"), async (req: Request, res: Response) => {
  return new WithdrawPartnerProposalController().handle(req, res)
})

partnerProposalRoutes.post("/pay/:id", AuthMiddleware, RoleMiddleware("partner"), async (req: Request, res: Response) => {
  return new PayPartnerProposalController().handle(req, res)
})

// O lado da associação: ler e responder.
partnerProposalRoutes.get("/list", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListPartnerProposalsController().handle(req, res)
})

partnerProposalRoutes.patch("/review/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ReviewPartnerProposalController().handle(req, res)
})
