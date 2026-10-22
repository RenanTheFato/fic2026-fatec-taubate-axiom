import { NotFoundError } from "../../config/errors.js";
import { SocialPost } from "../../models/social-post-model.js";

// Esconder tira a publicação do site sem apagar o registro: é o que a equipe faz com uma
// publicação importada que não combina com a página, e pode desfazer depois.
export class SetSocialPostVisibilityService {
  async execute({ id, visible }: { id: string, visible: boolean }) {

    const post = await SocialPost.findByPk(id)

    if (!post) {
      throw new NotFoundError("Social Post Not Found")
    }

    await post.update({ visible })

    return post.get({ plain: true })
  }
}
