import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { PostInterface } from "../../interfaces/post-interface.js";
import { Post } from "../../models/post-model.js";

export class DeletePostService {
  async execute({ post_id }: { post_id: PostInterface['id'] }) {
    const post = await Post.findByPk(post_id)

    if (!post) {
      throw new NotFoundError("Post Not Found")
    }

    // O que já esteve no ar pode ter sido lido, citado e compartilhado: sai por arquivamento, e
    // não por exclusão. Apagar é só para o rascunho que nunca foi público.
    if (post.status !== "draft") {
      throw new BadRequestError("Only a draft post can be deleted. Archive it instead")
    }

    await post.destroy()
  }
}
