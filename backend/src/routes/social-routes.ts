import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { ListSocialPostsController } from "../controllers/social/list-social-posts-controller.js";
import { ListAllSocialPostsController } from "../controllers/social/list-all-social-posts-controller.js";
import { CreateSocialPostController } from "../controllers/social/create-social-post-controller.js";
import { UpdateSocialPostController } from "../controllers/social/update-social-post-controller.js";
import { SetSocialPostVisibilityController } from "../controllers/social/set-social-post-visibility-controller.js";
import { DeleteSocialPostController } from "../controllers/social/delete-social-post-controller.js";
import { ImportInstagramPostsController } from "../controllers/social/import-instagram-posts-controller.js";

export const socialRoutes = Router()

// A página de redes sociais do site.
socialRoutes.get("/list", async (req: Request, res: Response) => {
  return new ListSocialPostsController().handle(req, res)
})

// A vitrine é peça de divulgação: quem cuida é a Comunicação, como nas notícias.
socialRoutes.get("/list-all", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListAllSocialPostsController().handle(req, res)
})

socialRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new CreateSocialPostController().handle(req, res)
})

socialRoutes.post("/import-instagram", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ImportInstagramPostsController().handle(req, res)
})

socialRoutes.put("/update/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new UpdateSocialPostController().handle(req, res)
})

socialRoutes.patch("/visibility/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new SetSocialPostVisibilityController().handle(req, res)
})

// Apagar é da administração, como em todo o painel. Esconder resolve o dia a dia da Comunicação.
socialRoutes.delete("/delete/:id", AuthMiddleware, RoleMiddleware("admin"), async (req: Request, res: Response) => {
  return new DeleteSocialPostController().handle(req, res)
})
