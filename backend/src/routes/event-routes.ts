import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateEventController } from "../controllers/event/create-event-controller.js";
import { ListEventsController } from "../controllers/event/list-events-controller.js";
import { ListAllEventsController } from "../controllers/event/list-all-events-controller.js";
import { GetEventBySlugController } from "../controllers/event/get-event-by-slug-controller.js";
import { PublishEventController } from "../controllers/event/publish-event-controller.js";
import { UpdateEventController } from "../controllers/event/update-event-controller.js";
import { UpdateEventCapacityController } from "../controllers/event/update-event-capacity-controller.js";
import { FinishEventController } from "../controllers/event/finish-event-controller.js";
import { CancelEventController } from "../controllers/event/cancel-event-controller.js";
import { DeleteEventController } from "../controllers/event/delete-event-controller.js";

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

eventRoutes.get("/:slug", async (req: Request, res: Response) => {
  return new GetEventBySlugController().handle(req, res)
})

eventRoutes.patch("/publish/:event_id", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new PublishEventController().handle(req, res)
})

eventRoutes.put("/update/:event_id", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new UpdateEventController().handle(req, res)
})

eventRoutes.patch("/capacity/:event_id", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new UpdateEventCapacityController().handle(req, res)
})

eventRoutes.patch("/finish/:event_id", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new FinishEventController().handle(req, res)
})

eventRoutes.patch("/cancel/:event_id", AuthMiddleware, RoleMiddleware("admin"), async (req: Request, res: Response) => {
  return new CancelEventController().handle(req, res)
})

eventRoutes.delete("/delete/:event_id", AuthMiddleware, RoleMiddleware("admin"), async (req: Request, res: Response) => {
  return new DeleteEventController().handle(req, res)
})
