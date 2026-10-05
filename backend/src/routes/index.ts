import { Router, Request, Response } from "express";
import { userRoutes } from "./user-routes.js";
import { campaignRoutes } from "./campaign-routes.js";
import { donorRoutes } from "./donor-routes.js";
import { productRoutes } from "./product-routes.js";
import { eventRoutes } from "./event-routes.js";
import { transactionRoutes } from "./transaction-routes.js";
import { receiptRoutes } from "./receipt-routes.js";
import { transactionItemRoutes } from "./transaction-item-routes.js";
import { postRoutes } from "./post-routes.js";
import { supporterRoutes } from "./supporter-routes.js";
import { certificateRoutes } from "./certificate-routes.js";

export const routes = Router()

routes.get("/ping", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Request Accepted",
  })
})

routes.use("/user", userRoutes)
routes.use("/campaign", campaignRoutes)
routes.use("/donor", donorRoutes)
routes.use("/product", productRoutes)
routes.use("/event", eventRoutes)
routes.use("/transaction", transactionRoutes)
routes.use("/receipt", receiptRoutes)
routes.use("/transaction-item", transactionItemRoutes)
routes.use("/post", postRoutes)
routes.use("/supporter", supporterRoutes)
routes.use("/certificate", certificateRoutes)