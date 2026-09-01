import { Link } from "react-router-dom"
import type { NewsCategory, NewsPost } from "../../types/news-types"
import { formatDate } from "../../utils/format"
import { Badge } from "../ui/badge"
import type { BadgeTone } from "../ui/badge"
import { Card, CardBody } from "../ui/card"
import { ImageSlot } from "../ui/image-slot"

type NewsCardProps = {
  post: NewsPost
}

const CATEGORY: Record<NewsCategory, { label: string; tone: BadgeTone }> = {
  educacao: { label: "Educação", tone: "institutional" },
  inclusao: { label: "Inclusão", tone: "partner" },
  saude: { label: "Saúde", tone: "success" },
  eventos: { label: "Eventos", tone: "primary" },
}

export function NewsCard({ post }: NewsCardProps) {
  const category = CATEGORY[post.category]

  return (
    <Card as="article" interactive className="h-full">
      <ImageSlot
        src={post.image}
        ratio="16/9"
        alt={post.title}
        hint={`Imagem da notícia "${post.title}"`}
      />

      <CardBody>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={category.tone}>{category.label}</Badge>
          <time dateTime={post.published_at} className="text-xs text-ink-soft">
            {formatDate(post.published_at)}
          </time>
        </div>

        <h3 className="font-display text-xl leading-snug font-bold">
          <Link to={`/noticias/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{post.excerpt}</p>
      </CardBody>
    </Card>
  )
}
