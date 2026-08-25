import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { ListTransactionItemsController } from "../controllers/transaction-item/list-transaction-items-controller.js";
import { SummarizeTransactionItemsController } from "../controllers/transaction-item/summarize-transaction-items-controller.js";

export const transactionItemRoutes = Router()

transactionItemRoutes.get("/list", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new ListTransactionItemsController().handle(req, res)
})

transactionItemRoutes.get("/summary", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new SummarizeTransactionItemsController().handle(req, res)
})
