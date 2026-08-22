import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateEventController } from "../controllers/event/create-event-controller.js";

export const eventRoutes = Router()

eventRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new CreateEventController().handle(req, res)
})
