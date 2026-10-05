import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { ListCertificateFoldersController } from "../controllers/certificate/list-certificate-folders-controller.js";
import { ListCertificateDesignsController } from "../controllers/certificate/list-certificate-designs-controller.js";
import { CreateCertificateDesignController } from "../controllers/certificate/create-certificate-design-controller.js";
import { PreviewCertificateController } from "../controllers/certificate/preview-certificate-controller.js";
import { PreviewCertificateDesignController } from "../controllers/certificate/preview-certificate-design-controller.js";
import { ListIssuedCertificatesController } from "../controllers/certificate/list-issued-certificates-controller.js";
import { UploadCertificateAssetController } from "../controllers/certificate/upload-certificate-asset-controller.js";
import { ListCertificateAssetsController } from "../controllers/certificate/list-certificate-assets-controller.js";
import { GetCertificateAssetController } from "../controllers/certificate/get-certificate-asset-controller.js";

export const certificateRoutes = Router()

// O certificado é peça de divulgação: quem personaliza é a Comunicação, como em campanha e evento.
// A lista de certificados emitidos é a exceção, porque traz nome de doador e responde a quem já
// lida com recibo.

certificateRoutes.get("/list-folders", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListCertificateFoldersController().handle(req, res)
})

certificateRoutes.get("/list-designs", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListCertificateDesignsController().handle(req, res)
})

certificateRoutes.post("/create-design", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new CreateCertificateDesignController().handle(req, res)
})

certificateRoutes.post("/preview", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new PreviewCertificateController().handle(req, res)
})

certificateRoutes.get("/preview/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new PreviewCertificateDesignController().handle(req, res)
})

certificateRoutes.get("/list-issued", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new ListIssuedCertificatesController().handle(req, res)
})

// O corpo cru desta rota é lido pelo `express.raw` montado no server.ts, antes do `express.json`.
certificateRoutes.post("/upload-asset", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new UploadCertificateAssetController().handle(req, res)
})

certificateRoutes.get("/list-assets", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListCertificateAssetsController().handle(req, res)
})

// Pública: a imagem já está impressa em certificado que circula, e o id é um UUID imprevisível.
// Sem login é também o único jeito de uma `<img>` do editor carregá-la.
certificateRoutes.get("/asset/:id", async (req: Request, res: Response) => {
  return new GetCertificateAssetController().handle(req, res)
})
