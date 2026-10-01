import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { PostInterface } from "../../interfaces/post-interface.js";
import { Post } from "../../models/post-model.js";

export class PublishPostService {
  async execute({ post_id }: { post_id: PostInterface['id'] }) {
    const post = await Post.findByPk(post_id)

    if (!post) {
      throw new NotFoundError("Post Not Found")
    }

    if (post.status === "published") {
      throw new BadRequestError("The post is already published")
    }

    // Republicar uma notícia arquivada mantém a data original: a data é de quando o fato foi
    // contado, e trocá-la a jogaria para o topo do acervo como se fosse novidade.
    await post.update({
      status: "published",
      published_at: post.published_at ?? new Date(),
    })

    return post.get({ plain: true })
  }
}
