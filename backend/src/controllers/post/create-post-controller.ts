import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { POST_CATEGORIES } from "../../models/post-model.js";
import { CreatePostService } from "../../services/post/create-post-service.js";

export class CreatePostController {
  async handle(req: Request, res: Response) {
    const postValidate = z.object({
      title: z.string({ error: "The title must be a string" })
        .trim()
        .min(4, { error: "The title doesn't meet the minimum number of characters (4)." })
        .max(160, { error: "The title has exceeded the character limit (160)." }),
      excerpt: z.string({ error: "The excerpt must be a string" })
        .trim()
        .min(10, { error: "The excerpt doesn't meet the minimum number of characters (10)." })
        .max(320, { error: "The excerpt has exceeded the character limit (320)." }),
      body: z.string({ error: "The body must be a string" })
        .trim()
        .min(20, { error: "The body doesn't meet the minimum number of characters (20)." })
        .max(20000, { error: "The body has exceeded the character limit (20000)." }),
      category: z.enum(POST_CATEGORIES, { error: "The category must be educacao, inclusao, saude or eventos" }),
      image_url: z.string({ error: "The image url must be a string" })
        .trim()
        .max(512, { error: "The image url has exceeded the character limit (512)." })
        .regex(/^(\/\S*|https:\/\/\S+)$/, { error: "The image url must be a site path or an https address" })
        .nullish()
        .default(null),
    })

    const parsedPost = postValidate.safeParse(req.body)

    if (!parsedPost.success) {
      const errors = parsedPost.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { title, excerpt, body, category, image_url } = parsedPost.data

    try {
      const createPostService = new CreatePostService()
      const post = await createPostService.execute({ title, excerpt, body, category, image_url, author_id: req.user?.id ?? null })

      return res.status(201).json({ message: "Post Created Successfully", post })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
