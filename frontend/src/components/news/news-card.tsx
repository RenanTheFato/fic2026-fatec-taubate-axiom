import { Link } from "react-router-dom"
import type { NewsPost } from "../../types/news-types"
import { formatDate } from "../../utils/format"
import { Badge } from "../ui/badge"
import { Card, CardBody, CardText, CardTitle } from "../ui/card"
import { ImageSlot } from "../ui/image-slot"
import { CATEGORY_LABEL } from "./news-labels"

type NewsCardProps = {
  post: NewsPost
}

export function NewsCard({ post }: NewsCardProps) {
  const category = CATEGORY_LABEL[post.category]

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

        <CardTitle>
          <Link to={`/noticias/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </CardTitle>

        <CardText lines={3}>{post.excerpt}</CardText>
      </CardBody>
    </Card>
  )
}
