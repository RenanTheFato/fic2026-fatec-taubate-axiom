import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateEventController } from "../controllers/event/create-event-controller.js";
import { ListEventsController } from "../controllers/event/list-events-controller.js";
import { ListAllEventsController } from "../controllers/event/list-all-events-controller.js";

export const eventRoutes = Router()

eventRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new CreateEventController().handle(req, res)
})

eventRoutes.get("/list", async (req: Request, res: Response) => {
  return new ListEventsController().handle(req, res)
})

eventRoutes.get("/list-all", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new ListAllEventsController().handle(req, res)
})