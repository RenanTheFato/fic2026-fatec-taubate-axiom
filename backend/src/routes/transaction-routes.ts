import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateTransactionController } from "../controllers/transaction/create-transaction-controller.js";
import { TransactionWebhookController } from "../controllers/transaction/transaction-webhook-controller.js";
import { ListTransactionsController } from "../controllers/transaction/list-transactions-controller.js";
import { GetTransactionController } from "../controllers/transaction/get-transaction-controller.js";
import { ConfirmTransactionController } from "../controllers/transaction/confirm-transaction-controller.js";
import { RefuseTransactionController } from "../controllers/transaction/refuse-transaction-controller.js";
import { CancelTransactionController } from "../controllers/transaction/cancel-transaction-controller.js";
import { RefundTransactionController } from "../controllers/transaction/refund-transaction-controller.js";

export const transactionRoutes = Router()

transactionRoutes.post("/create", async (req: Request, res: Response) => {
  return new CreateTransactionController().handle(req, res)
})

// Pública porque quem chama é o Stripe. A autenticação é a assinatura do próprio webhook,
// validada dentro do controller sobre o corpo cru montado em server.ts.
transactionRoutes.post("/webhook", async (req: Request, res: Response) => {
  return new TransactionWebhookController().handle(req, res)
})

transactionRoutes.get("/list", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new ListTransactionsController().handle(req, res)
})

// "/:id" fica depois dos caminhos literais, senão engole "/list" e "/webhook".
transactionRoutes.get("/:id", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new GetTransactionController().handle(req, res)
})

transactionRoutes.patch("/confirm/:id", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new ConfirmTransactionController().handle(req, res)
})

transactionRoutes.patch("/refuse/:id", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new RefuseTransactionController().handle(req, res)
})

transactionRoutes.patch("/cancel/:id", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new CancelTransactionController().handle(req, res)
})

transactionRoutes.patch("/refund/:id", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new RefundTransactionController().handle(req, res)
})
