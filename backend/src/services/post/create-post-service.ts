import { BadRequestError } from "../../config/errors.js";
import { PostInterface } from "../../interfaces/post-interface.js";
import { Post } from "../../models/post-model.js";
import { slugify } from "../../utils/slugify.js";

export class CreatePostService {
  async execute({ title, excerpt, body, category, image_url, author_id }: Pick<PostInterface, 'title' | 'excerpt' | 'body' | 'category' | 'image_url' | 'author_id'>) {
    const slug = slugify(title)

    if (!slug) {
      throw new BadRequestError("The title must contain at least one letter or number")
    }

    if (await Post.findOne({ where: { slug } })) {
      throw new BadRequestError("A post with this title already exists")
    }

    // Toda publicação nasce rascunho: escrever e pôr no ar são dois atos, e o segundo é o que a
    // equipe confere antes de o texto virar a voz da associação.
    const post = await Post.create({
      title,
      slug,
      excerpt,
      body,
      category,
      image_url,
      author_id,
      status: "draft",
    })

    return post.get({ plain: true })
  }
}
