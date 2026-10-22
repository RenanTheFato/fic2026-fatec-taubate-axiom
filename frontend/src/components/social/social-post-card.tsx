import { ExternalLink, Play } from "lucide-react"
import type { SocialPost } from "../../types/social-types"
import { formatDate } from "../../utils/format"
import { ImageSlot } from "../ui/image-slot"
import { NETWORKS } from "./social-labels"

type SocialPostCardProps = {
  post: SocialPost
  onOpen: (post: SocialPost) => void
}

// A publicação na grade. Forma fixa, como todo cartão repetido do site: a foto
// é quadrada pela caixa e não pelo arquivo, e a legenda tem três linhas
// reservadas, então um post de uma frase e um de um parágrafo ocupam o mesmo
// espaço. O cartão abre a publicação inteira no próprio site; o link do pé leva
// para a rede, para quem quiser comentar ou compartilhar por lá.
export function SocialPostCard({ post, onOpen }: SocialPostCardProps) {
  const network = NETWORKS[post.network]
  const video = post.video_id !== null

  return (
    <li className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
      <button
        type="button"
        onClick={() => onOpen(post)}
        className="group relative block text-left"
        aria-label={`${video ? "Assistir" : "Abrir"} a publicação de ${formatDate(post.published_at)} no ${network.label}`}
      >
        <ImageSlot src={post.image_url} alt="" hint={`Publicação do ${network.label}`} ratio="1/1" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-pill bg-surface/95 px-3 py-1 font-display text-xs font-bold text-ink shadow-sm">
          <network.icon className="size-3.5" aria-hidden="true" />
          {network.label}
        </span>
        {video && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-pill bg-ink/75 text-white transition-transform group-hover:scale-105">
              <Play className="ml-1 size-7" aria-hidden="true" />
            </span>
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-xs font-semibold text-ink-soft">{formatDate(post.published_at)}</p>
        <p className="line-clamp-3 min-h-[3lh] text-sm leading-relaxed break-words">{post.caption}</p>
        <a
          href={post.url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-auto inline-flex w-fit items-center gap-1.5 font-display text-sm font-bold text-primary underline underline-offset-4"
        >
          {network.action}
          <ExternalLink className="size-3.5" aria-hidden="true" />
          <span className="sr-only">(abre em outra aba)</span>
        </a>
      </div>
    </li>
  )
}
