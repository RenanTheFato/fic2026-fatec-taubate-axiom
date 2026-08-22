import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateDonorController } from "../controllers/donor/create-donor-controller.js";
import { ListDonorsController } from "../controllers/donor/list-donors-controller.js";
import { GetDonorController } from "../controllers/donor/get-donor-controller.js";
import { GetDonorProfileController } from "../controllers/donor/get-donor-profile-controller.js";
import { UpdateDonorController } from "../controllers/donor/update-donor-controller.js";
import { AnonymizeDonorController } from "../controllers/donor/anonymize-donor-controller.js";

export const donorRoutes = Router()

donorRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "finance"), async (req: Request, res: Response) => {
  return new CreateDonorController().handle(req, res)
})

donorRoutes.get("/list", AuthMiddleware, RoleMiddleware("admin", "finance"), async(req: Request, res: Response) => {
  return new ListDonorsController().handle(req, res)
})

// "/profile" precisa vir antes de "/:id", senão o express casa o caminho literal com o param
donorRoutes.get("/profile", AuthMiddleware, async(req: Request, res: Response) => {
  return new GetDonorProfileController().handle(req, res)
})

donorRoutes.get("/:id", AuthMiddleware, RoleMiddleware("admin", "finance"), async(req: Request, res: Response) => {
  return new GetDonorController().handle(req, res)
})

donorRoutes.put("/update/:id", AuthMiddleware, RoleMiddleware("admin", "finance"), async(req: Request, res: Response) => {
  return new UpdateDonorController().handle(req, res)
})

donorRoutes.patch("/anonymize/:id", AuthMiddleware, RoleMiddleware("admin"), async(req: Request, res: Response) => {
  return new AnonymizeDonorController().handle(req, res)
})
