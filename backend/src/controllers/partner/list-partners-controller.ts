import { Request, Response } from "express";
import { ListPartnersService } from "../../services/partner/list-partners-service.js";

export class ListPartnersController {
  async handle(req: Request, res: Response) {
    try {
      const listPartnersService = new ListPartnersService()
      const partners = await listPartnersService.execute()

      return res.status(200).json({ message: "Partners Fetched Successfully", partners })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
