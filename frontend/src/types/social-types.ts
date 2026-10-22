// Espelha o domínio `social` do backend: as publicações da associação nas redes,
// trazidas para dentro do site.

export type SocialNetwork = "instagram" | "facebook" | "youtube"

export type SocialPost = {
  id: string
  network: SocialNetwork
  /** A publicação na rede, para quem quiser comentar ou compartilhar por lá. */
  url: string
  caption: string
  image_url: string | null
  /** O vídeo do YouTube que o site toca sem sair da página. */
  video_id: string | null
  published_at: string
}

export type SocialPage = {
  posts: SocialPost[]
  total: number
  /** Publicações visíveis por rede, qualquer que seja o filtro. */
  networks: Record<SocialNetwork, number>
}

export type AdminSocialPost = SocialPost & {
  external_id: string | null
  visible: boolean
  author: { id: string; name: string } | null
}

export type AdminSocialPage = {
  posts: AdminSocialPost[]
  total: number
  /** A importação do Instagram está ligada no servidor. */
  instagram_import: boolean
}

export type SocialPostInput = {
  network: SocialNetwork
  url: string
  caption: string
  image_url: string | null
  published_at: string
}
