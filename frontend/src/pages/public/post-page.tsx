import { ArrowLeft } from "lucide-react"
import { useParams } from "react-router-dom"
import { NewsCard } from "../../components/news/news-card"
import { CATEGORY_LABEL } from "../../components/news/news-labels"
import { PageHero } from "../../components/layout/page-hero"
import { Reveal } from "../../components/motion/reveal"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { ImageSlot } from "../../components/ui/image-slot"
import { Prose } from "../../components/ui/prose"
import { SectionHeading } from "../../components/ui/section"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { NotFoundError } from "../../config/errors"
import { useNews } from "../../hooks/use-news"
import { usePost } from "../../hooks/use-post"
import { relatedPosts } from "../../services/news/list-news-service"
import { formatDate } from "../../utils/format"

export default function PostPage() {
  const { slug } = useParams()
  const { data: post, isPending, error } = usePost(slug)
  const { data: all } = useNews()

  if (isPending) {
    return (
      <Container className="flex max-w-3xl flex-col gap-6 py-20">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="aspect-[16/9] w-full" />
        <Skeleton className="h-40 w-full" />
      </Container>
    )
  }

  // Código inexistente na URL é resposta, e não falha: a tela diz isso e devolve
  // o caminho de volta, em vez de deixar a pessoa numa página quebrada.
  if (error instanceof NotFoundError) {
    return (
      <Container className="max-w-xl py-20 sm:py-28">
        <StateMessage
          title="Publicação não encontrada"
          description="O endereço pode ter mudado desde que foi compartilhado. A lista completa continua aberta."
          action={
            <ButtonLink to="/noticias" size="sm">
              Ver todas as notícias
            </ButtonLink>
          }
        />
      </Container>
    )
  }

  if (!post) {
    return (
      <Container className="max-w-xl py-20 sm:py-28">
        <StateMessage
          tone="error"
          title="A publicação não carregou"
          description="Não conseguimos abrir esta notícia agora. Tente de novo em instantes."
          action={
            <ButtonLink to="/noticias" size="sm">
              Ver todas as notícias
            </ButtonLink>
          }
        />
      </Container>
    )
  }

  const category = CATEGORY_LABEL[post.category]
  const related = all ? relatedPosts(all, post) : []

  return (
    <>
      <PageHero
        eyebrow={category.label}
        title={post.title}
        tone="institutional"
        breadcrumb={[{ label: "Notícias", to: "/noticias" }, { label: post.title }]}
        lead={
          <p>
            <time dateTime={post.published_at} className="font-bold">
              {formatDate(post.published_at)}
            </time>
            . {post.excerpt}
          </p>
        }
      />

      <article className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <ImageSlot
            src={post.image}
            ratio="16/9"
            alt={post.title}
            hint={`Imagem da notícia "${post.title}"`}
            eager
            className="rounded-card"
          />

          <Prose className="mt-10">
            {post.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Prose>

          <div className="mt-12 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row">
            <ButtonLink to="/noticias" variant="outline">
              <ArrowLeft className="size-5" aria-hidden="true" />
              Todas as notícias
            </ButtonLink>
            <ButtonLink to="/doe-agora">Apoiar a associação</ButtonLink>
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="relacionadas" className="border-t border-line bg-surface-muted py-16">
          <Container>
            <SectionHeading id="relacionadas" eyebrow="Continue lendo" title="Outras publicações" />

            <ul className="mt-10 grid gap-6 md:grid-cols-2">
              {related.map((item, index) => (
                <li key={item.id}>
                  <Reveal delay={index * 0.06} className="h-full">
                    <NewsCard post={item} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  )
}
