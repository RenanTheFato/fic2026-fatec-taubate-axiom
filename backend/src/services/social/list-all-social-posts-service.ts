import { env } from "../../config/env.js";
import { SocialPost } from "../../models/social-post-model.js";
import type { SocialNetwork } from "../../models/social-post-model.js";
import { User } from "../../models/user-model.js";

interface ListAllSocialPostsProps {
  network: SocialNetwork | null,
  page: number,
  limit: number,
}

// A lista do painel, com as escondidas. Diz também se a importação do Instagram está ligada, para a
// tela só oferecer o botão quando ele funciona.
export class ListAllSocialPostsService {
  async execute({ network, page, limit }: ListAllSocialPostsProps) {

    const { rows, count: total } = await SocialPost.findAndCountAll({
      where: network ? { network } : {},
      include: [{ model: User, as: "author", attributes: ["id", "name"] }],
      order: [["published_at", "DESC"], ["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    })

    return {
      posts: rows.map((row) => row.get({ plain: true })),
      total,
      instagram_import: Boolean(env.INSTAGRAM_ACCESS_TOKEN),
    }
  }
}
