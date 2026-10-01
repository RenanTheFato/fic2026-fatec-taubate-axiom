import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { PostInterface } from "../../interfaces/post-interface.js";
import { Post } from "../../models/post-model.js";

// Arquivar tira do ar sem apagar: o texto continua no painel, pronto para voltar, e nenhum dado
// de quem escreveu se perde.
export class ArchivePostService {
  async execute({ post_id }: { post_id: PostInterface['id'] }) {
    const post = await Post.findByPk(post_id)

    if (!post) {
      throw new NotFoundError("Post Not Found")
    }

    if (post.status !== "published") {
      throw new BadRequestError("Only a published post can be archived")
    }

    await post.update({ status: "archived" })

    return post.get({ plain: true })
  }
}
