import { CalendarDays, Clock, MapPin, Ticket, Users } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { CheckoutForm } from "../../components/checkout/checkout-form"
import { PageHero } from "../../components/layout/page-hero"
import { Reveal } from "../../components/motion/reveal"
import { Badge } from "../../components/ui/badge"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { ImageSlot } from "../../components/ui/image-slot"
import { Prose } from "../../components/ui/prose"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { NotFoundError } from "../../config/errors"
import { useEvent } from "../../hooks/use-event"
import { isUpcoming } from "../../services/event/list-events-service"
import type { Event } from "../../types/event-types"
import { formatCurrency, formatDate } from "../../utils/format"

function timeRange(event: Event): string {
  const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
  const starts = new Date(event.starts_at).toLocaleTimeString("pt-BR", options)

  if (!event.ends_at) return `a partir das ${starts}`

  const ends = new Date(event.ends_at)
  const sameDay = ends.toDateString() === new Date(event.starts_at).toDateString()

  if (!sameDay) return `de ${formatDate(event.starts_at)} a ${formatDate(event.ends_at)}`

  return `das ${starts} às ${ends.toLocaleTimeString("pt-BR", options)}`
}

function EventFacts({ event }: { event: Event }) {
  const seatsLeft = event.capacity === null ? null : event.capacity - event.taken_seats

  const facts: { icon: typeof CalendarDays; label: string; value: string }[] = [
    { icon: CalendarDays, label: "Data", value: formatDate(event.starts_at) },
    { icon: Clock, label: "Horário", value: timeRange(event) },
    ...(event.location ? [{ icon: MapPin, label: "Local", value: event.location }] : []),
    ...(seatsLeft !== null
      ? [{ icon: Users, label: "Vagas", value: seatsLeft > 0 ? `${seatsLeft} disponíveis` : "Esgotado" }]
      : []),
  ]

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="flex items-start gap-3 rounded-card border border-line p-4">
          <fact.icon className="mt-0.5 size-5 shrink-0 text-institutional-dark" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="font-display text-xs font-bold tracking-wide text-ink-soft uppercase">{fact.label}</dt>
            <dd className="mt-1 text-sm leading-snug">{fact.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

// O convite. Três coisas ficam travadas aqui de propósito:
//
// 1. Não existe seletor de quantidade. `ConfirmTransactionService` debita a vaga
//    em unidade (`backend/corrections.md`, item E), então comprar três convites
//    ocuparia uma vaga só, e a interface não expõe um defeito já mapeado.
// 2. Evento gratuito não vai para o checkout: o backend recusa uma cobrança de
//    zero, e cobrar zero não faria sentido de qualquer forma.
// 3. Evento lotado ou encerrado não abre formulário, porque a compra seria
//    recusada no fim e o doador teria preenchido tudo à toa.
function EventInvite({ event }: { event: Event }) {
  const free = Number(event.ticket_price) <= 0
  const soldOut = event.capacity !== null && event.capacity - event.taken_seats <= 0
  const open = isUpcoming(event)

  if (!open) {
    return (
      <StateMessage
        title="Este evento já aconteceu"
        description="A página fica no ar como registro do que a associação organizou. Veja o que ainda vai acontecer na agenda."
        action={
          <ButtonLink to="/eventos" size="sm" variant="outline">
            Ver a agenda
          </ButtonLink>
        }
      />
    )
  }

  if (free) {
    return (
      <StateMessage
        title="Entrada gratuita"
        description="Este encontro não tem convite pago. Fale com a associação para reservar seu lugar e ajudar a organizar os grupos."
        action={
          <ButtonLink to="/fale-conosco" size="sm">
            Reservar meu lugar
          </ButtonLink>
        }
      />
    )
  }

  if (soldOut) {
    return (
      <StateMessage
        title="Convites esgotados"
        description="Todas as vagas desta edição foram ocupadas. Você ainda pode apoiar a associação por uma doação direta."
        action={
          <ButtonLink to="/doe-agora" size="sm">
            Doar para a causa
          </ButtonLink>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Ticket className="size-6 text-primary" aria-hidden="true" />
        <h2 className="font-display text-2xl font-extrabold">Garanta seu convite</h2>
      </div>

      <p className="text-sm leading-relaxed text-ink-soft">
        Um convite por pedido. Para levar acompanhantes, repita a compra: é assim que a vaga é
        reservada corretamente para cada pessoa.
      </p>

      <CheckoutForm
        type="ticket"
        title={`Convite para ${event.title}`}
        fixedAmount={event.ticket_price}
        eventId={event.id}
        campaignId={event.campaign_id}
        submitLabel="Ir para o pagamento"
      />
    </div>
  )
}

export default function EventPage() {
  const { slug = "" } = useParams()
  const { data: event, isPending, isError, error, refetch } = useEvent(slug)

  if (isPending) {
    return (
      <Container className="py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-4 h-5 w-1/3" />
        <Skeleton className="mt-10 h-72 w-full" />
      </Container>
    )
  }

  if (isError) {
    const missing = error instanceof NotFoundError

    return (
      <Container className="py-16">
        <div className="max-w-lg">
          <StateMessage
            tone={missing ? "neutral" : "error"}
            title={missing ? "Evento não encontrado" : "O evento não carregou"}
            description={
              missing
                ? "Este endereço não corresponde a nenhum evento da associação. Ele pode ter sido removido, ou o link pode estar incompleto."
                : "Não conseguimos buscar este evento agora."
            }
            action={
              missing ? (
                <ButtonLink to="/eventos" size="sm">
                  Ver a agenda
                </ButtonLink>
              ) : (
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="font-display font-bold text-primary underline underline-offset-4"
                >
                  Tentar de novo
                </button>
              )
            }
          />
        </div>
      </Container>
    )
  }

  const free = Number(event.ticket_price) <= 0

  return (
    <>
      <PageHero
        eyebrow="Evento"
        title={event.title}
        tone="primary"
        breadcrumb={[{ label: "Eventos", to: "/eventos" }, { label: event.title }]}
        lead={<p>{formatDate(event.starts_at)}{event.location ? ` · ${event.location}` : ""}</p>}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {free ? <Badge tone="success">Entrada gratuita</Badge> : <Badge>{formatCurrency(event.ticket_price)}</Badge>}
          {event.status === "finished" && <Badge tone="institutional">Já realizado</Badge>}
        </div>
      </PageHero>

      <section className="py-14 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <Reveal from="left">
            <div className="overflow-hidden rounded-card border border-line">
              <ImageSlot
                src={event.image}
                ratio="16/9"
                alt={event.title}
                hint={`Foto do evento "${event.title}" acontecendo`}
                eager
              />
            </div>

            <div className="mt-8">
              <EventFacts event={event} />
            </div>

            {event.description && (
              <Prose className="mt-8">
                <p>{event.description}</p>
              </Prose>
            )}

            <p className="mt-8 text-sm text-ink-soft">
              Dúvidas sobre o evento?{" "}
              <Link to="/fale-conosco" className="font-bold text-primary underline underline-offset-4">
                Fale com a associação
              </Link>
              .
            </p>
          </Reveal>

          <Reveal from="right" delay={0.1}>
            <div className="rounded-card border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-8">
              <EventInvite event={event} />
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
