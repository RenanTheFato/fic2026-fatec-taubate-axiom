import { Router, Request, Response } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreatePostController } from "../controllers/post/create-post-controller.js";
import { ListPostsController } from "../controllers/post/list-posts-controller.js";
import { ListAllPostsController } from "../controllers/post/list-all-posts-controller.js";
import { PublishPostController } from "../controllers/post/publish-post-controller.js";
import { ArchivePostController } from "../controllers/post/archive-post-controller.js";
import { UpdatePostController } from "../controllers/post/update-post-controller.js";
import { DeletePostController } from "../controllers/post/delete-post-controller.js";
import { GetPostBySlugController } from "../controllers/post/get-post-by-slug-controller.js";

export const postRoutes = Router()

// Notícia é divulgação, então responde à Comunicação como campanha e evento. Apagar é do admin.

postRoutes.post("/create", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new CreatePostController().handle(req, res)
})

postRoutes.get("/list", async (req: Request, res: Response) => {
  return new ListPostsController().handle(req, res)
})

postRoutes.get("/list-all", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ListAllPostsController().handle(req, res)
})

postRoutes.patch("/publish/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new PublishPostController().handle(req, res)
})

postRoutes.patch("/archive/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new ArchivePostController().handle(req, res)
})

postRoutes.put("/update/:id", AuthMiddleware, RoleMiddleware("admin", "communication"), async (req: Request, res: Response) => {
  return new UpdatePostController().handle(req, res)
})

postRoutes.delete("/delete/:id", AuthMiddleware, RoleMiddleware("admin"), async (req: Request, res: Response) => {
  return new DeletePostController().handle(req, res)
})

// O slug fica por último: declarado antes, `/:slug` engoliria `/list` e `/list-all`.
postRoutes.get("/:slug", async (req: Request, res: Response) => {
  return new GetPostBySlugController().handle(req, res)
})
