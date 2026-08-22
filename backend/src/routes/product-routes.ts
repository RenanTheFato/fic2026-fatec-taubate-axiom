import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateProductController } from "../controllers/product/create-product-controller.js";
import { ListProductsController } from "../controllers/product/list-products-controller.js";
import { ListAllProductsController } from "../controllers/product/list-all-products-controller.js";
import { GetProductByIdController } from "../controllers/product/get-product-by-id-controller.js";
import { UpdateProductController } from "../controllers/product/update-product-controller.js";
import { ActivateProductController } from "../controllers/product/activate-product-controller.js";
import { DeactivateProductController } from "../controllers/product/deactivate-product-controller.js";
import { UpdateProductStockController } from "../controllers/product/update-product-stock-controller.js";
import { DeleteProductController } from "../controllers/product/delete-product-controller.js";

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

productRoutes.put("/update/:id", AuthMiddleware, RoleMiddleware("admin", "staff"), async(req: Request, res: Response) => {
  return new UpdateProductController().handle(req, res)
})

productRoutes.patch("/activate/:id", AuthMiddleware, RoleMiddleware("admin", "staff"), async(req: Request, res: Response) => {
  return new ActivateProductController().handle(req, res)
})

productRoutes.patch("/deactivate/:id", AuthMiddleware, RoleMiddleware("admin", "staff"), async(req: Request, res: Response) => {
  return new DeactivateProductController().handle(req, res)
})

productRoutes.patch("/stock/:id", AuthMiddleware, RoleMiddleware("admin", "staff"), async(req: Request, res: Response) => {
  return new UpdateProductStockController().handle(req, res)
})

productRoutes.delete("/delete/:id", AuthMiddleware, RoleMiddleware("admin"), async(req: Request, res: Response) => {
  return new DeleteProductController().handle(req, res)
})