import { Router, Request, Response } from "express";
import { userRoutes } from "./user-routes.js";

export const routes = Router()

routes.get("/ping", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Request Accepted",
  })
})

routes.use("/user", userRoutes)