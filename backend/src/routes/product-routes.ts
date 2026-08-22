import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateProductController } from "../controllers/product/create-product-controller.js";
import { ListProductsController } from "../controllers/product/list-products-controller.js";
import { ListAllProductsController } from "../controllers/product/list-all-products-controller.js";
import { GetProductByIdController } from "../controllers/product/get-product-by-id-controller.js";

export const productRoutes = Router()

productRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "staff"), async (req: Request, res: Response) => {
  return new CreateProductController().handle(req, res)
})

productRoutes.get("/list", async(req: Request, res: Response) => {
  return new ListProductsController().handle(req, res)
})

productRoutes.get("/list-all", AuthMiddleware, RoleMiddleware("admin", "staff"), async(req: Request, res: Response) => {
  return new ListAllProductsController().handle(req, res)
})

productRoutes.get("/:id", async(req: Request, res: Response) => {
  return new GetProductByIdController().handle(req, res)
})