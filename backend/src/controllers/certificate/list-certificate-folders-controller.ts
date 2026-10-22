import { Request, Response } from "express";
import { ListCertificateFoldersService } from "../../services/certificate/list-certificate-folders-service.js";
import { FACTORY_DESIGN, FACTORY_MESSAGE_DESIGN } from "../../utils/certificate-classic.js";

export class ListCertificateFoldersController {
  async handle(req: Request, res: Response) {
    try {
      const listCertificateFoldersService = new ListCertificateFoldersService()
      const folders = await listCertificateFoldersService.execute()

      // Os modelos de fábrica vão junto, um por variação: são o ponto de partida do editor numa pasta
      // que nunca teve versão.
      return res.status(200).json({
        message: "Certificate Folders Fetched Successfully",
        folders,
        factory: { amount: FACTORY_DESIGN, message: FACTORY_MESSAGE_DESIGN },
      })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
