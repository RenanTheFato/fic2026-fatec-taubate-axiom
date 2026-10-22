import { ExternalLink, X } from "lucide-react"
import { useEffect, useRef } from "react"
import type { SocialPost } from "../../types/social-types"
import { formatDate } from "../../utils/format"
import { NETWORKS, youtubeEmbedUrl } from "./social-labels"

type SocialPostViewerProps = {
  post: SocialPost
  onClose: () => void
}

// A publicação inteira dentro do site: a foto em tamanho cheio e a legenda
// completa, ou o vídeo do YouTube tocando na própria página. O player só é
// carregado aqui, quando a pessoa pediu para assistir, e pelo domínio sem
// cookie de rastreamento: abrir a página de redes sociais não fala com o YouTube.
export function SocialPostViewer({ post, onClose }: SocialPostViewerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const network = NETWORKS[post.network]

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)

    // O foco volta para o cartão que abriu o visualizador, e não para o topo
    // da página, que é onde quem navega por teclado se perderia.
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      previous?.focus()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publicacao-titulo"
        className="flex max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-card bg-surface shadow-xl sm:rounded-card lg:flex-row"
      >
        <div className="flex shrink-0 items-center justify-center bg-ink lg:w-3/5">
          {post.video_id ? (
            <div className="relative aspect-video w-full">
              <iframe
                src={youtubeEmbedUrl(post.video_id)}
                title={`Vídeo do YouTube publicado em ${formatDate(post.published_at)}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 size-full border-0"
              />
            </div>
          ) : (
            post.image_url && <img src={post.image_url} alt="" className="max-h-[50dvh] w-full object-contain lg:max-h-[85dvh]" />
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p id="publicacao-titulo" className="inline-flex items-center gap-2 font-display font-bold">
                <network.icon className="size-4" aria-hidden="true" />
                {network.label}
              </p>
              <p className="text-xs text-ink-soft">
                {network.handle} · {formatDate(post.published_at)}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-tile border border-line hover:bg-surface-muted"
            >
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">Fechar a publicação</span>
            </button>
          </div>

          <p className="text-sm leading-relaxed break-words whitespace-pre-line">{post.caption}</p>

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
      </div>
    </div>
  )
}
