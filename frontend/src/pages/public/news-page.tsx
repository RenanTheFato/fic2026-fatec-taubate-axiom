import { useState } from "react"
import { NewsCard } from "../../components/news/news-card"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { Container } from "../../components/ui/container"
import { CardSkeleton, StateMessage } from "../../components/ui/states"
import { useNews } from "../../hooks/use-news"
import { categoriesInUse } from "../../services/news/list-news-service"
import { CATEGORY_LABEL } from "../../components/news/news-labels"
import type { NewsCategory } from "../../types/news-types"
import { cn } from "../../utils/cn"

// O filtro é estado de interface, e não de servidor: a lista inteira já veio, e
// refazer a pergunta a cada clique só acrescentaria espera. Por isso as abas
// filtram o que está em mãos, e a chave da consulta continua sendo uma só.
export default function NewsPage() {
  const [category, setCategory] = useState<NewsCategory | null>(null)
  const { data, isPending, isError, refetch } = useNews()

  const posts = data ?? []
  const shown = category ? posts.filter((post) => post.category === category) : posts
  const tabs = categoriesInUse(posts)

  return (
    <>
      <PageHero
        eyebrow="Comunicação"
        title="Notícias"
        breadcrumb={[{ label: "Notícias" }]}
        tone="institutional"
        scene="drift"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Aqui a associação conta o que aconteceu: campanhas, eventos e novidades da casa.
              </p>
            }
          >
            <p>
              O que a associação realizou, o que está por vir e as decisões que mudam o dia a dia de
              quem é atendido aqui. Tudo publicado pela própria equipe.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="publicacoes" className="py-16 sm:py-20">
        <Container>
          <h2 id="publicacoes" className="sr-only">
            Publicações
          </h2>

          {tabs.length > 1 && (
            <div role="group" aria-label="Filtrar por assunto" className="flex flex-wrap gap-2">
              <FilterChip active={category === null} onClick={() => setCategory(null)}>
                Todas
              </FilterChip>

              {tabs.map((item) => (
                <FilterChip
                  key={item}
                  active={category === item}
                  onClick={() => setCategory(item)}
                >
                  {CATEGORY_LABEL[item].label}
                </FilterChip>
              ))}
            </div>
          )}

          {isPending && (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && (
            <div className="mt-10 max-w-md">
              <StateMessage
                tone="error"
                title="As publicações não carregaram"
                description="Não conseguimos buscar as notícias agora."
                action={
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="font-display font-bold text-primary underline underline-offset-4"
                  >
                    Tentar de novo
                  </button>
                }
              />
            </div>
          )}

          {data && shown.length === 0 && (
            <div className="mt-10 max-w-md">
              <StateMessage
                title="Nada publicado neste assunto"
                description="Escolha outro assunto acima para ver o que a associação já contou por aqui."
              />
            </div>
          )}

          {shown.length > 0 && (
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shown.map((post, index) => (
                <li key={post.id}>
                  <Reveal delay={index * 0.06} className="h-full">
                    <NewsCard post={post} />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  )
}

type FilterChipProps = {
  active: boolean
  onClick: () => void
  children: string
}

function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-pill border px-4 py-2 font-display text-sm font-bold transition-colors",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-line text-ink-soft hover:border-ink-soft/40 hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}
