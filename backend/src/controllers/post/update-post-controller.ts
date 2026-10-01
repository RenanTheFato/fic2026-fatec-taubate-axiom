import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { POST_CATEGORIES } from "../../models/post-model.js";
import { UpdatePostService } from "../../services/post/update-post-service.js";

export class UpdatePostController {
  async handle(req: Request, res: Response) {
    const { id: post_id } = req.params as { id: string }

    const postValidate = z.object({
      title: z.string({ error: "The title must be a string" })
        .trim()
        .min(4, { error: "The title doesn't meet the minimum number of characters (4)." })
        .max(160, { error: "The title has exceeded the character limit (160)." })
        .optional(),
      excerpt: z.string({ error: "The excerpt must be a string" })
        .trim()
        .min(10, { error: "The excerpt doesn't meet the minimum number of characters (10)." })
        .max(320, { error: "The excerpt has exceeded the character limit (320)." })
        .optional(),
      body: z.string({ error: "The body must be a string" })
        .trim()
        .min(20, { error: "The body doesn't meet the minimum number of characters (20)." })
        .max(20000, { error: "The body has exceeded the character limit (20000)." })
        .optional(),
      category: z.enum(POST_CATEGORIES, { error: "The category must be educacao, inclusao, saude or eventos" })
        .optional(),
      image_url: z.string({ error: "The image url must be a string" })
        .trim()
        .max(512, { error: "The image url has exceeded the character limit (512)." })
        .regex(/^(\/\S*|https:\/\/\S+)$/, { error: "The image url must be a site path or an https address" })
        .nullish(),
    }).refine((post) => Object.keys(post).length > 0, {
      error: "At least one field must be provided to update the post.",
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
      const updatePostService = new UpdatePostService()
      const post = await updatePostService.execute({ post_id, title, excerpt, body, category, image_url })

      return res.status(200).json({ message: "Post Updated Successfully", post })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
