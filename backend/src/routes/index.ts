import { Router, Request, Response } from "express";
import { userRoutes } from "./user-routes.js";
import { campaignRoutes } from "./campaign-routes.js";
import { donorRoutes } from "./donor-routes.js";

export const routes = Router()

routes.get("/ping", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Request Accepted",
  })
})

routes.use("/user", userRoutes)
routes.use("/campaign", campaignRoutes)
routes.use("/donor", donorRoutes)