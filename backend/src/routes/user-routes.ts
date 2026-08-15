import { Router, Request, Response } from "express";
import { CreateUserController } from "../controllers/user/create-user-controller.js";

export const userRoutes = Router()

userRoutes.post("/create-user", async (req: Request, res: Response) => {
  return new CreateUserController().handle(req, res)
})