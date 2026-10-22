import { fn, col } from "sequelize";
import { SocialPost, SOCIAL_NETWORKS } from "../../models/social-post-model.js";
import type { SocialNetwork } from "../../models/social-post-model.js";

interface ListSocialPostsProps {
  network: SocialNetwork | null,
  page: number,
  limit: number,
}

// A página de redes sociais do site: as publicações visíveis, da mais nova para a mais antiga.
// Quem cadastrou e quando não é assunto do visitante.
export class ListSocialPostsService {
  async execute({ network, page, limit }: ListSocialPostsProps) {

    const { rows, count: total } = await SocialPost.findAndCountAll({
      where: { visible: true, ...(network ? { network } : {}) },
      attributes: ["id", "network", "url", "caption", "image_url", "video_id", "published_at"],
      order: [["published_at", "DESC"], ["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    })

    // Quantas publicações visíveis cada rede tem, qualquer que seja o filtro: a página só oferece o
    // filtro de uma rede que tem o que mostrar.
    const counts = await SocialPost.findAll({
      where: { visible: true },
      attributes: ["network", [fn("COUNT", col("id")), "total"]],
      group: ["network"],
      raw: true,
    }) as unknown as { network: SocialNetwork, total: number }[]

    const networks = Object.fromEntries(SOCIAL_NETWORKS.map((item) => [
      item,
      Number(counts.find((row) => row.network === item)?.total ?? 0),
    ])) as Record<SocialNetwork, number>

    return { posts: rows.map((row) => row.get({ plain: true })), total, networks }
  }
}
