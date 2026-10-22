import { NotFoundError } from "../../config/errors.js";
import { SocialPostInterface } from "../../interfaces/social-post-interface.js";
import { SocialPost } from "../../models/social-post-model.js";
import { youtubeThumbnail, youtubeVideoId } from "../../utils/social-url.js";

type UpdateSocialPostProps = Pick<SocialPostInterface, 'id' | 'network' | 'url' | 'caption' | 'image_url' | 'published_at'>

export class UpdateSocialPostService {
  async execute({ id, network, url, caption, image_url, published_at }: UpdateSocialPostProps) {

    const post = await SocialPost.findByPk(id)

    if (!post) {
      throw new NotFoundError("Social Post Not Found")
    }

    const video_id = network === "youtube" ? youtubeVideoId(url) : null

    await post.update({
      network,
      url,
      caption,
      image_url: image_url ?? (video_id ? youtubeThumbnail(video_id) : null),
      video_id,
      published_at,
    })

    return post.get({ plain: true })
  }
}
