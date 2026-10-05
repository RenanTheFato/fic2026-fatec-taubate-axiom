import { Request, Response } from "express";
import { ListCertificateAssetsService } from "../../services/certificate/list-certificate-assets-service.js";

export class ListCertificateAssetsController {
  async handle(req: Request, res: Response) {
    try {
      const listCertificateAssetsService = new ListCertificateAssetsService()
      const assets = await listCertificateAssetsService.execute()

      return res.status(200).json({ message: "Assets Fetched Successfully", assets })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
