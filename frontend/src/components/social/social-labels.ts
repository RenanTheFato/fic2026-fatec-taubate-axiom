import { SiFacebook, SiInstagram, SiYoutube } from "@icons-pack/react-simple-icons"
import type { ComponentType } from "react"
import type { SocialNetwork } from "../../types/social-types"

// As três redes da associação, com o nome, a marca e o perfil oficial. As marcas
// vêm do Simple Icons pela mesma razão do rodapé: o lucide não publica marca de
// terceiro, e desenhar à mão seria pior.

type BrandIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>

export const NETWORKS: Record<SocialNetwork, { label: string; icon: BrandIcon; profile: string; handle: string; action: string }> = {
  instagram: {
    label: "Instagram",
    icon: SiInstagram,
    profile: "https://www.instagram.com/somosdobem.indaiatuba/",
    handle: "@somosdobem.indaiatuba",
    action: "Ver no Instagram",
  },
  facebook: {
    label: "Facebook",
    icon: SiFacebook,
    profile: "https://www.facebook.com/somosdobem.indaiatuba",
    handle: "somosdobem.indaiatuba",
    action: "Ver no Facebook",
  },
  youtube: {
    label: "YouTube",
    icon: SiYoutube,
    profile: "https://www.youtube.com/@somosdobem.indaiatuba",
    handle: "@somosdobem.indaiatuba",
    action: "Ver no YouTube",
  },
}

export const NETWORK_ORDER: SocialNetwork[] = ["instagram", "facebook", "youtube"]

// O player sem cookie de rastreamento, carregado só quando a pessoa pede para
// tocar: até lá, a página não fala com o YouTube.
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`
}
