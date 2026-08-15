import { Router, Request, Response } from "express";
import { CreateUserController } from "../controllers/user/create-user-controller.js";
import { AuthUserController } from "../controllers/user/auth-user-controller.js";

export const userRoutes = Router()

userRoutes.post("/create", async (req: Request, res: Response) => {
  return new CreateUserController().handle(req, res)
})

userRoutes.post("/auth", async (req: Request, res: Response) => {
  return new AuthUserController().handle(req, res)
})