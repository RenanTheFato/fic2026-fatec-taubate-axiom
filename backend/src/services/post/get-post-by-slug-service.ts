import { NotFoundError } from "../../config/errors.js";
import { PostInterface } from "../../interfaces/post-interface.js";
import { Post } from "../../models/post-model.js";

export class GetPostBySlugService {
  async execute({ slug }: Pick<PostInterface, 'slug'>) {
    // Rascunho e arquivada respondem 404, como se não existissem: "não existe" e "existe mas está
    // fora do ar" precisam ser indistinguíveis para quem está do lado de fora.
    const post = await Post.findOne({
      where: { slug, status: "published" },
      attributes: { exclude: ["author_id"] },
    })

    if (!post) {
      throw new NotFoundError("Post Not Found")
    }

    return post.get({ plain: true })
  }
}
