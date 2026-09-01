import { MapPin } from "lucide-react"
import { Link } from "react-router-dom"
import type { Event } from "../../types/event-types"
import { formatCurrency, formatDayMonth } from "../../utils/format"
import { Badge } from "../ui/badge"
import { Card, CardBody } from "../ui/card"
import { ImageSlot } from "../ui/image-slot"

type EventCardProps = {
  event: Event
}

function seatsLabel(event: Event): string | null {
  if (event.capacity === null) return null

  const left = event.capacity - event.taken_seats

  if (left <= 0) return "Esgotado"
  if (left <= 20) return `Últimas ${left} vagas`

  return `${left} vagas`
}

export function EventCard({ event }: EventCardProps) {
  const { day, month } = formatDayMonth(event.starts_at)
  const seats = seatsLabel(event)
  const free = Number(event.ticket_price) === 0

  return (
    <Card as="article" interactive className="h-full">
      <ImageSlot
        src={event.image}
        ratio="16/9"
        alt={event.title}
        hint={`Foto do evento "${event.title}"`}
      />

      <div className="flex items-center gap-4 border-y border-line bg-surface-muted px-5 py-4">
        <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-white">
          <span className="font-display text-2xl leading-none font-extrabold">{day}</span>
          <span className="text-xs font-bold tracking-wide">{month}</span>
        </span>

        <div className="flex flex-col gap-1.5">
          {free ? <Badge tone="success">Entrada gratuita</Badge> : <Badge>{formatCurrency(event.ticket_price)}</Badge>}
          {seats && (
            <span className="text-xs font-semibold text-ink-soft">{seats}</span>
          )}
        </div>
      </div>

      <CardBody>
        <h3 className="font-display text-xl leading-snug font-bold">
          <Link to={`/eventos/${event.slug}`} className="hover:text-primary">
            {event.title}
          </Link>
        </h3>

        {event.description && <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{event.description}</p>}

        {event.location && (
          <p className="mt-auto flex items-center gap-2 pt-2 text-sm text-ink-soft">
            <MapPin className="size-4 text-institutional-dark" aria-hidden="true" />
            {event.location}
          </p>
        )}
      </CardBody>
    </Card>
  )
}
