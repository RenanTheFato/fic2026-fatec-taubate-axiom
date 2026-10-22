import { SocialPostInterface } from "../../interfaces/social-post-interface.js";
import { SocialPost } from "../../models/social-post-model.js";
import { youtubeThumbnail, youtubeVideoId } from "../../utils/social-url.js";

type CreateSocialPostProps = Pick<SocialPostInterface, 'network' | 'url' | 'caption' | 'image_url' | 'published_at' | 'created_by'>

// A Comunicação traz para o site uma publicação feita nas redes. O vídeo do YouTube dispensa foto:
// o id sai do endereço, e a capa é a que o próprio YouTube publica.
export class CreateSocialPostService {
  async execute({ network, url, caption, image_url, published_at, created_by }: CreateSocialPostProps) {

    const video_id = network === "youtube" ? youtubeVideoId(url) : null

    const post = await SocialPost.create({
      network,
      url,
      caption,
      image_url: image_url ?? (video_id ? youtubeThumbnail(video_id) : null),
      video_id,
      published_at,
      visible: true,
      created_by,
    })

    return post.get({ plain: true })
  }
}
