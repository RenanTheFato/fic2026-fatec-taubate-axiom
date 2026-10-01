import { Post } from "../../models/post-model.js";
import type { PostCategory } from "../../models/post-model.js";

interface ListPostsProps {
  category: PostCategory | null,
  page: number,
  limit: number,
}

// O acervo público: só o que está publicado, da publicação mais recente para a mais antiga. O id
// no fim é o desempate que impede a paginação de repetir ou pular uma notícia com a mesma data.
export class ListPostsService {
  async execute({ category, page, limit }: ListPostsProps) {
    const { rows: posts, count: total } = await Post.findAndCountAll({
      where: {
        status: "published",
        ...(category ? { category } : {}),
      },
      attributes: { exclude: ["author_id"] },
      order: [
        ["published_at", "DESC"],
        ["id", "ASC"],
      ],
      limit,
      offset: (page - 1) * limit,
    })

    return { posts, total }
  }
}
