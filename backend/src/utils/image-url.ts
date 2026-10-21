import { env } from "../config/env.js";

// Onde a foto de capa de campanha, evento, produto e notícia pode morar: um caminho do próprio site
// (`/imagens/...`), um endereço https, ou uma foto enviada pelo painel e servida por esta API.
// A terceira forma é conferida pelo endereço exato da API, e não por "qualquer http": em
// desenvolvimento a API responde em http, e recusar o próprio endereço deixaria o painel sem como
// trocar foto fora da produção, mas aceitar qualquer http abriria a porta para conteúdo misto.

const PHOTO_PATH = "/api/v1/photo/"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function photoBase() {
  return `${env.APP_URL.replace(/\/+$/, "")}${PHOTO_PATH}`
}

export function photoUrl(id: string) {
  return `${photoBase()}${id}`
}

export function isImageUrl(value: string) {
  if (/^(\/\S*|https:\/\/\S+)$/.test(value)) {
    return true
  }

  const base = photoBase()

  return value.startsWith(base) && UUID.test(value.slice(base.length))
}
