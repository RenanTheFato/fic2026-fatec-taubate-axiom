import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateRegistrationController } from "../controllers/registration/create-registration-controller.js";
import { GetTicketController } from "../controllers/registration/get-ticket-controller.js";
import { ListEventRegistrationsController } from "../controllers/registration/list-event-registrations-controller.js";
import { CheckInRegistrationController } from "../controllers/registration/check-in-registration-controller.js";
import { UndoCheckInController } from "../controllers/registration/undo-check-in-controller.js";
import { CancelRegistrationController } from "../controllers/registration/cancel-registration-controller.js";

export const registrationRoutes = Router()

// Pública: a inscrição no evento gratuito. O convite pago ganha a inscrição na confirmação.
registrationRoutes.post("/create", async (req: Request, res: Response) => {
  return new CreateRegistrationController().handle(req, res)
})

// Pública: a página do ingresso, aberta pelo código, que é a credencial.
registrationRoutes.get("/ticket/:code", async (req: Request, res: Response) => {
  return new GetTicketController().handle(req, res)
})

// A operação do evento é da Comunicação, como o cadastro dele. A lista traz nome, e-mail e
// telefone de participante, por isso nunca é pública.
registrationRoutes.get("/list/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListEventRegistrationsController().handle(req, res)
})

registrationRoutes.patch("/check-in/:code", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new CheckInRegistrationController().handle(req, res)
})

registrationRoutes.patch("/undo-check-in/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new UndoCheckInController().handle(req, res)
})

registrationRoutes.patch("/cancel/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new CancelRegistrationController().handle(req, res)
})
