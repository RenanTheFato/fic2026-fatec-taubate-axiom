import { ArrowRight } from "lucide-react"
import { useState } from "react"
import { useSocialPosts } from "../../hooks/use-social-posts"
import type { SocialPost } from "../../types/social-types"
import { SocialPostCard } from "../social/social-post-card"
import { SocialPostViewer } from "../social/social-post-viewer"
import { ButtonLink } from "../ui/button"
import { Container } from "../ui/container"
import { SectionHeading } from "../ui/section"

// As quatro publicações mais recentes das redes, na home. Sem publicação, a
// seção não aparece: uma faixa vazia na página de entrada não diz nada a quem
// chegou, e a página de redes sociais continua no menu.
export function SocialFeed() {
  const { data } = useSocialPosts({ network: null, page: 1, limit: 4 })
  const [open, setOpen] = useState<SocialPost | null>(null)

  if (!data || data.posts.length === 0) return null

  return (
    <section aria-labelledby="nas-redes" className="border-t border-line bg-surface-muted py-16 sm:py-24">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="nas-redes"
            eyebrow="Nas redes"
            title="O que a associação anda publicando"
            description="As publicações mais recentes do Instagram, do Facebook e do YouTube da Somos do Bem."
            tone="institutional"
          />

          <ButtonLink to="/redes-sociais" variant="outline" className="shrink-0">
            Ver todas as publicações
            <ArrowRight className="size-5" aria-hidden="true" />
          </ButtonLink>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.posts.map((post) => (
            <SocialPostCard key={post.id} post={post} onOpen={setOpen} />
          ))}
        </ul>
      </Container>

      {open && <SocialPostViewer post={open} onClose={() => setOpen(null)} />}
    </section>
  )
}
