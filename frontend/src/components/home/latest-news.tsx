import { ArrowRight } from "lucide-react"
import { useLatestNews } from "../../hooks/use-latest-news"
import { Reveal } from "../motion/reveal"
import { NewsCard } from "../news/news-card"
import { ButtonLink } from "../ui/button"
import { Container } from "../ui/container"
import { SectionHeading } from "../ui/section"
import { CardSkeleton, StateMessage } from "../ui/states"

export function LatestNews() {
  const { data, isPending, isError, refetch } = useLatestNews(3)

  return (
    <section aria-labelledby="noticias" className="py-16 sm:py-24">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="noticias"
            eyebrow="Nosso blog"
            title="Últimas notícias"
            description="O que aconteceu de mais recente na associação e nas campanhas da cidade."
            tone="institutional"
          />

          <ButtonLink to="/noticias" variant="outline" className="shrink-0">
            Todas as notícias
            <ArrowRight className="size-5" aria-hidden="true" />
          </ButtonLink>
        </div>

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
              title="As notícias não carregaram"
              description="Não conseguimos buscar as publicações agora."
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

        {data && data.length === 0 && (
          <div className="mt-10 max-w-md">
            <StateMessage
              title="Ainda não há publicações"
              description="As próximas novidades da associação aparecem aqui."
            />
          </div>
        )}

        {data && data.length > 0 && (
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((post, index) => (
              <li key={post.id}>
                <Reveal delay={index * 0.08} className="h-full">
                  <NewsCard post={post} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  )
}
