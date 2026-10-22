import { NotFoundError } from "../../config/errors.js";
import { SocialPost } from "../../models/social-post-model.js";

// Apaga a publicação do site. A da rede continua lá: esta tabela é só a vitrine.
export class DeleteSocialPostService {
  async execute({ id }: { id: string }) {

    const post = await SocialPost.findByPk(id)

    if (!post) {
      throw new NotFoundError("Social Post Not Found")
    }

    await post.destroy()
  }
}
