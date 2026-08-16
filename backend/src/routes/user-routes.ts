import { Router, Request, Response } from "express";
import { CreateUserController } from "../controllers/user/create-user-controller.js";
import { AuthUserController } from "../controllers/user/auth-user-controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { GetUserProfileController } from "../controllers/user/get-user-profile-controller.js";
import { DeleteUserController } from "../controllers/user/delete-user-controller.js";

export const userRoutes = Router()

userRoutes.post("/create", async (req: Request, res: Response) => {
  return new CreateUserController().handle(req, res)
})

userRoutes.post("/auth", async (req: Request, res: Response) => {
  return new AuthUserController().handle(req, res)
})

userRoutes.get("/profile", AuthMiddleware, async(req: Request, res: Response) => {
  return new GetUserProfileController().handle(req, res)
})

userRoutes.delete("/delete", AuthMiddleware, async(req: Request, res: Response) => {
  return new DeleteUserController().handle(req, res)
})