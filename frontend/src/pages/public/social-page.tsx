import { ExternalLink } from "lucide-react"
import { useState } from "react"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { NETWORK_ORDER, NETWORKS } from "../../components/social/social-labels"
import { SocialPostCard } from "../../components/social/social-post-card"
import { SocialPostViewer } from "../../components/social/social-post-viewer"
import { Button } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useSocialPosts } from "../../hooks/use-social-posts"
import { SOCIAL_PER_PAGE } from "../../services/social/list-social-posts-service"
import type { SocialNetwork, SocialPost } from "../../types/social-types"
import { cn } from "../../utils/cn"

// O que a associação publica nas redes, dentro do site: a foto e o texto de
// cada publicação, e o vídeo do YouTube tocando na própria página. Quem não usa
// Instagram nem Facebook acompanha a associação do mesmo jeito, e quem usa
// encontra o link para comentar e compartilhar por lá.
export default function SocialPage() {
  const [network, setNetwork] = useState<SocialNetwork | null>(null)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<SocialPost | null>(null)

  const { data, isPending, isError, refetch } = useSocialPosts({ network, page })
  const pages = data ? Math.max(Math.ceil(data.total / SOCIAL_PER_PAGE), 1) : 1
  const filters = data ? NETWORK_ORDER.filter((item) => data.networks[item] > 0) : []

  function choose(next: SocialNetwork | null) {
    setNetwork(next)
    setPage(1)
  }

  return (
    <>
      <PageHero
        eyebrow="Comunicação"
        title="Redes sociais"
        tone="institutional"
        breadcrumb={[{ label: "Notícias", to: "/noticias" }, { label: "Redes sociais" }]}
        scene="network"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch simple={<p>Aqui estão as fotos e os vídeos que a associação publica no Instagram, no Facebook e no YouTube.</p>}>
            <p>
              As publicações da associação no Instagram, no Facebook e no YouTube, reunidas aqui. Dá para ver a foto,
              ler o texto inteiro e assistir aos vídeos sem sair do site.
            </p>
          </ReadingSwitch>
        }
      >
        <ul className="flex flex-wrap gap-3" aria-label="Perfis da associação">
          {NETWORK_ORDER.map((item) => {
            const profile = NETWORKS[item]

            return (
              <li key={item}>
                <a
                  href={profile.profile}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center gap-2 rounded-pill border-2 border-ink/15 bg-surface px-4 font-display text-sm font-bold text-ink transition-colors hover:border-ink/40"
                >
                  <profile.icon className="size-4" aria-hidden="true" />
                  {profile.label}
                  <span className="sr-only">(abre em outra aba)</span>
                </a>
              </li>
            )
          })}
        </ul>
      </PageHero>

      <section aria-labelledby="publicacoes" className="py-16 sm:py-20">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading id="publicacoes" eyebrow="Nas redes" title="Publicações recentes" tone="institutional" />

            {filters.length > 1 && (
              <div role="group" aria-label="Rede" className="flex flex-wrap gap-2">
                <Button size="sm" variant={network === null ? "solid" : "outline"} tone="ink" aria-pressed={network === null} onClick={() => choose(null)}>
                  Todas
                </Button>
                {filters.map((item) => {
                  const option = NETWORKS[item]

                  return (
                    <Button key={item} size="sm" variant={network === item ? "solid" : "outline"} tone="ink" aria-pressed={network === item} onClick={() => choose(item)}>
                      <option.icon className="size-4" aria-hidden="true" />
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>

          {isPending && (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <li key={index}>
                  <Skeleton className="aspect-[3/4] w-full" />
                </li>
              ))}
            </ul>
          )}

          {isError && (
            <div className="mt-10 max-w-md">
              <StateMessage
                tone="error"
                title="As publicações não carregaram"
                description="Não conseguimos buscar as redes sociais agora."
                action={
                  <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
                    Tentar de novo
                  </button>
                }
              />
            </div>
          )}

          {data && data.posts.length === 0 && (
            <div className="mt-10 max-w-md">
              <StateMessage
                title="Nenhuma publicação por aqui ainda"
                description="Enquanto isso, acompanhe a associação direto nos perfis acima."
              />
            </div>
          )}

          {data && data.posts.length > 0 && (
            <ul className={cn("mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", isPending && "opacity-60")}>
              {data.posts.map((post) => (
                <SocialPostCard key={post.id} post={post} onOpen={setOpen} />
              ))}
            </ul>
          )}

          {data && pages > 1 && (
            <nav aria-label="Paginação das publicações" className="mt-10 flex items-center justify-between gap-3">
              <Button size="sm" variant="outline" tone="ink" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Mais recentes
              </Button>
              <p className="text-sm text-ink-soft">
                Página {page} de {pages}
              </p>
              <Button size="sm" variant="outline" tone="ink" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                Mais antigas
              </Button>
            </nav>
          )}
        </Container>
      </section>

      <section aria-labelledby="siga" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <SectionHeading id="siga" eyebrow="Siga a associação" title="Onde a Somos do Bem publica" tone="institutional" />

          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {NETWORK_ORDER.map((item) => {
              const profile = NETWORKS[item]

              return (
                <li key={item}>
                  <a
                    href={profile.profile}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex h-full items-center gap-4 rounded-card border border-line bg-surface p-5 transition-colors hover:border-institutional"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-ink text-white">
                      <profile.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display font-bold">{profile.label}</span>
                      <span className="block text-sm break-all text-ink-soft">{profile.handle}</span>
                    </span>
                    <ExternalLink className="ml-auto size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                    <span className="sr-only">(abre em outra aba)</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </Container>
      </section>

      {open && <SocialPostViewer post={open} onClose={() => setOpen(null)} />}
    </>
  )
}
