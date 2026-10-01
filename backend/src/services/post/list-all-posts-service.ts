import { Post } from "../../models/post-model.js";
import { User } from "../../models/user-model.js";

export class ListAllPostsService {
  async execute({ page, limit }: { page: number, limit: number }) {
    const { rows: posts, count: total } = await Post.findAndCountAll({
      include: [{ model: User, as: "author", attributes: ["id", "name"] }],
      order: [
        ["status", "ASC"],
        ["published_at", "DESC"],
        ["created_at", "DESC"],
        ["id", "ASC"],
      ],
      limit,
      offset: (page - 1) * limit,
    })

    return { posts, total }
  }
}
