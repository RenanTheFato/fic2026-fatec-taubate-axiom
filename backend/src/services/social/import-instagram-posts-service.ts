import { Op } from "sequelize";
import { BadRequestError } from "../../config/errors.js";
import { env } from "../../config/env.js";
import { SocialPost } from "../../models/social-post-model.js";
import { UploadPhotoService } from "../photo/upload-photo-service.js";

const GRAPH_URL = "https://graph.instagram.com/me/media"

const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"

type InstagramMedia = {
  id: string,
  caption?: string,
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM",
  media_url?: string,
  thumbnail_url?: string,
  permalink: string,
  timestamp: string,
}

type InstagramPage = { data?: InstagramMedia[], error?: { message?: string } }

// Traz as publicações mais recentes do Instagram da associação para o site, pela API oficial
// (Instagram API com login do Instagram), com o token da conta em INSTAGRAM_ACCESS_TOKEN.
//
// A imagem é copiada para a tabela de fotos em vez de apontar para o endereço do Instagram, porque
// esse endereço expira em poucos dias e a página do site ficaria com buracos. O id da mídia vai em
// `external_id`, então rodar a importação de novo só traz o que ainda não veio.
export class ImportInstagramPostsService {
  async execute({ created_by }: { created_by: string | null }) {

    const token = env.INSTAGRAM_ACCESS_TOKEN

    if (!token) {
      throw new BadRequestError("The Instagram integration is not configured")
    }

    const url = `${GRAPH_URL}?${new URLSearchParams({ fields: FIELDS, limit: "12", access_token: token })}`
    const response = await fetch(url)
    const page = await response.json().catch(() => ({})) as InstagramPage

    if (!response.ok || !page.data) {
      throw new BadRequestError(`Instagram refused the request: ${page.error?.message ?? response.statusText}`)
    }

    const known = await SocialPost.findAll({
      where: { external_id: { [Op.in]: page.data.map((media) => media.id) } },
      attributes: ["external_id"],
    })

    const imported = new Set(known.map((post) => post.external_id))
    let created = 0
    let failed = 0

    for (const media of page.data) {
      if (imported.has(media.id)) {
        continue
      }

      // O vídeo entra pela capa: o site mostra a imagem e leva ao Instagram para tocar.
      const source = media.media_type === "VIDEO" ? media.thumbnail_url : media.media_url

      try {
        const image = source ? await this.download(source) : null
        const photo = image
          ? await new UploadPhotoService().execute({ name: `instagram-${media.id}`, data: image, uploaded_by: created_by })
          : null

        await SocialPost.create({
          network: "instagram",
          url: media.permalink,
          external_id: media.id,
          caption: media.caption?.trim() || "Publicação no Instagram",
          image_url: photo?.url ?? null,
          video_id: null,
          published_at: new Date(media.timestamp),
          visible: true,
          created_by,
        })

        created += 1
      } catch (error: unknown) {
        // Uma mídia que não baixa não derruba as outras: ela fica para a próxima importação.
        console.error(error)
        failed += 1
      }
    }

    return { imported: created, skipped: page.data.length - created - failed, failed }
  }

  private async download(source: string) {
    const response = await fetch(source)

    if (!response.ok) {
      throw new BadRequestError(`The image of an Instagram post could not be downloaded (${response.status})`)
    }

    return Buffer.from(await response.arrayBuffer())
  }
}
