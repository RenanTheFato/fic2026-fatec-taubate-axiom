import type { SocialNetwork } from "../models/social-post-model.js";

// Os endereços que cada rede usa para uma publicação. O cadastro confere a rede pelo endereço para
// o selo do site nunca dizer "Instagram" num link do Facebook.
const HOSTS: Record<SocialNetwork, readonly string[]> = {
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"],
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

function parse(value: string) {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export function isNetworkUrl(network: SocialNetwork, value: string) {
  const url = parse(value)

  return url !== null && url.protocol === "https:" && HOSTS[network].includes(url.hostname.toLowerCase())
}

// O id do vídeo nas formas de endereço que o YouTube entrega ao compartilhar: watch?v=, youtu.be/,
// shorts/, live/ e embed/. É ele que o site usa para tocar o vídeo na própria página.
export function youtubeVideoId(value: string) {
  const url = parse(value)

  if (!url || !HOSTS.youtube.includes(url.hostname.toLowerCase())) {
    return null
  }

  const candidate = url.hostname.toLowerCase() === "youtu.be"
    ? url.pathname.split("/")[1]
    : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1]

  return candidate && VIDEO_ID.test(candidate) ? candidate : null
}

// A capa que o próprio YouTube publica para todo vídeo. Evita pedir à equipe uma foto que já existe.
export function youtubeThumbnail(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
