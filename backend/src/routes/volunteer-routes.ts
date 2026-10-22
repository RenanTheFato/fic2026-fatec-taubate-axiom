import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { ApplyVolunteerController } from "../controllers/volunteer/apply-volunteer-controller.js";
import { GetVolunteerProfileController } from "../controllers/volunteer/get-volunteer-profile-controller.js";
import { ResubmitVolunteerController } from "../controllers/volunteer/resubmit-volunteer-controller.js";
import { ListVolunteersController } from "../controllers/volunteer/list-volunteers-controller.js";
import { ReviewVolunteerController } from "../controllers/volunteer/review-volunteer-controller.js";

export const volunteerRoutes = Router()

// O cadastro do site: cria a conta e o cadastro em análise.
volunteerRoutes.post("/apply", async (req: Request, res: Response) => {
  return new ApplyVolunteerController().handle(req, res)
})

volunteerRoutes.get("/profile", AuthMiddleware, RoleMiddleware("volunteer"), async (req: Request, res: Response) => {
  return new GetVolunteerProfileController().handle(req, res)
})

volunteerRoutes.patch("/resubmit", AuthMiddleware, RoleMiddleware("volunteer"), async (req: Request, res: Response) => {
  return new ResubmitVolunteerController().handle(req, res)
})

// A coordenação do voluntariado: administração e comunicação, como o resto do que é divulgação.
volunteerRoutes.get("/list", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListVolunteersController().handle(req, res)
})

volunteerRoutes.patch("/review/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ReviewVolunteerController().handle(req, res)
})
