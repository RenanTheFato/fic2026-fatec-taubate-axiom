import { Request, Response } from "express";
import { UserInterface } from "../../interfaces/user-interface.js";
import { DeleteUserService } from "../../services/user/delete-user-service.js";
import { NotFoundError } from "../../config/errors.js";

export class DeleteUserController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    try {
      const deleteUserService = new DeleteUserService()
      await deleteUserService.execute({ id })

      return res.status(204).json({})
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }

  }
}