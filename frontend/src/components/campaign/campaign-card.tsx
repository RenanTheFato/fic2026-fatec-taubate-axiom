import { Link } from "react-router-dom"
import type { Campaign } from "../../types/campaign-types"
import { formatDate } from "../../utils/format"
import { Badge } from "../ui/badge"
import { Card, CardBody, CardText, CardTitle } from "../ui/card"
import { ImageSlot } from "../ui/image-slot"
import { CampaignProgress } from "./campaign-progress"

type CampaignCardProps = {
  campaign: Campaign
}

// O card da vitrine de campanhas. Mesmo esqueleto do card de evento: foto com
// proporção declarada, título e resumo com linhas reservadas, e a barra de meta
// sempre no pé, para que dois cards vizinhos terminem na mesma altura.
export function CampaignCard({ campaign }: CampaignCardProps) {
  const finished = campaign.status === "finished"

  return (
    <Card as="article" interactive className="h-full">
      <ImageSlot src={campaign.image_url} ratio="16/9" alt={campaign.title} hint={`Foto da campanha "${campaign.title}"`} />

      <CardBody>
        <div className="flex items-center justify-between gap-3">
          {finished ? <Badge tone="institutional">Encerrada</Badge> : <Badge tone="success">Aberta</Badge>}
          <span className="text-right text-xs text-ink-soft">
            {finished && campaign.ends_at ? `até ${formatDate(campaign.ends_at)}` : `desde ${formatDate(campaign.starts_at)}`}
          </span>
        </div>

        <CardTitle>
          <Link to={`/campanhas/${campaign.slug}`} className="hover:text-primary">
            {campaign.title}
          </Link>
        </CardTitle>

        <CardText>{campaign.description ?? "Uma frente da associação que depende de quem apoia."}</CardText>

        <div className="mt-auto pt-2">
          <CampaignProgress campaign={campaign} />
        </div>
      </CardBody>
    </Card>
  )
}
