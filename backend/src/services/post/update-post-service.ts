import { NotFoundError } from "../../config/errors.js";
import { PostInterface } from "../../interfaces/post-interface.js";
import { Post } from "../../models/post-model.js";

interface UpdatePostProps {
  post_id: PostInterface['id'],
  title?: PostInterface['title'],
  excerpt?: PostInterface['excerpt'],
  body?: PostInterface['body'],
  category?: PostInterface['category'],
  image_url?: PostInterface['image_url'],
}

export class UpdatePostService {
  async execute({ post_id, title, excerpt, body, category, image_url }: UpdatePostProps) {
    const post = await Post.findByPk(post_id)

    if (!post) {
      throw new NotFoundError("Post Not Found")
    }

    // O slug nunca é regerado: link compartilhado em rede social não pode quebrar por causa de um
    // ajuste de título.
    await post.update({
      ...(title !== undefined ? { title } : {}),
      ...(excerpt !== undefined ? { excerpt } : {}),
      ...(body !== undefined ? { body } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(image_url !== undefined ? { image_url } : {}),
    })

    return post.get({ plain: true })
  }
}
