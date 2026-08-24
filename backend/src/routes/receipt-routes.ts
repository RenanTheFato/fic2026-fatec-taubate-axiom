import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { ListReceiptsController } from "../controllers/receipt/list-receipts-controller.js";
import { VerifyReceiptController } from "../controllers/receipt/verify-receipt-controller.js";
import { DownloadReceiptController } from "../controllers/receipt/download-receipt-controller.js";
import { DownloadReceiptCertificateController } from "../controllers/receipt/download-receipt-certificate-controller.js";
import { GetReceiptController } from "../controllers/receipt/get-receipt-controller.js";

export const receiptRoutes = Router()

// não existe rota de emissão, recibo nasce dentro da confirmação da transação, na mesma transação
// de banco. Emitir por fora abriria caminho para recibo sem pagamento confirmado

receiptRoutes.get("/list", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new ListReceiptsController().handle(req, res)
})

// quem confere um recibo é o doador ou um auditor externo, que não tem conta
// hash é a credencial de 64 caracteres imprevisíveis que só quem tem o documento conhece
receiptRoutes.get("/verify/:hash", async (req: Request, res: Response) => {
  return new VerifyReceiptController().handle(req, res)
})

receiptRoutes.get("/download/:hash", async (req: Request, res: Response) => {
  return new DownloadReceiptController().handle(req, res)
})

receiptRoutes.get("/certificate/:hash", async (req: Request, res: Response) => {
  return new DownloadReceiptCertificateController().handle(req, res)
})

receiptRoutes.get("/:id", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new GetReceiptController().handle(req, res)
})
