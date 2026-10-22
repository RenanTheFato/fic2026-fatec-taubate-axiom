import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateVolunteerShiftController } from "../controllers/volunteer-shift/create-volunteer-shift-controller.js";
import { ListVolunteerShiftsController } from "../controllers/volunteer-shift/list-volunteer-shifts-controller.js";
import { CancelVolunteerShiftController } from "../controllers/volunteer-shift/cancel-volunteer-shift-controller.js";
import { ListOpenVolunteerShiftsController } from "../controllers/volunteer-shift/list-open-volunteer-shifts-controller.js";
import { ListMyVolunteerShiftsController } from "../controllers/volunteer-shift/list-my-volunteer-shifts-controller.js";
import { JoinVolunteerShiftController } from "../controllers/volunteer-shift/join-volunteer-shift-controller.js";
import { LeaveVolunteerShiftController } from "../controllers/volunteer-shift/leave-volunteer-shift-controller.js";
import { ReviewVolunteerAssignmentController } from "../controllers/volunteer-shift/review-volunteer-assignment-controller.js";
import { RecordVolunteerAttendanceController } from "../controllers/volunteer-shift/record-volunteer-attendance-controller.js";

export const volunteerShiftRoutes = Router()

// A escala que a coordenação monta e fecha.
volunteerShiftRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new CreateVolunteerShiftController().handle(req, res)
})

volunteerShiftRoutes.get("/list", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListVolunteerShiftsController().handle(req, res)
})

volunteerShiftRoutes.patch("/cancel/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new CancelVolunteerShiftController().handle(req, res)
})

volunteerShiftRoutes.patch("/review-assignment/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ReviewVolunteerAssignmentController().handle(req, res)
})

volunteerShiftRoutes.patch("/attendance/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new RecordVolunteerAttendanceController().handle(req, res)
})

// O lado do voluntário: ver o que está aberto, a própria escala, entrar e sair.
volunteerShiftRoutes.get("/open", AuthMiddleware, RoleMiddleware("volunteer"), async (req: Request, res: Response) => {
  return new ListOpenVolunteerShiftsController().handle(req, res)
})

volunteerShiftRoutes.get("/mine", AuthMiddleware, RoleMiddleware("volunteer"), async (req: Request, res: Response) => {
  return new ListMyVolunteerShiftsController().handle(req, res)
})

volunteerShiftRoutes.post("/join/:id", AuthMiddleware, RoleMiddleware("volunteer"), async (req: Request, res: Response) => {
  return new JoinVolunteerShiftController().handle(req, res)
})

volunteerShiftRoutes.patch("/leave/:id", AuthMiddleware, RoleMiddleware("volunteer"), async (req: Request, res: Response) => {
  return new LeaveVolunteerShiftController().handle(req, res)
})
