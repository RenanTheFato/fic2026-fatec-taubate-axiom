import { BadgeCheck, CalendarDays, CircleX, Clock, DoorOpen, Loader2, MapPin, Printer } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { PageHero } from "../../components/layout/page-hero"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError, NotFoundError } from "../../config/errors"
import { useCheckIn } from "../../hooks/use-admin-registrations"
import { useTicket } from "../../hooks/use-registration"
import { useSession } from "../../hooks/use-session"
import type { Ticket } from "../../types/registration-types"
import { formatDate } from "../../utils/format"

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function TicketStatus({ ticket }: { ticket: Ticket }) {
  if (ticket.status === "cancelled") {
    return (
      <p role="status" className="flex items-center gap-2 font-display font-bold text-primary">
        <CircleX className="size-5 shrink-0" aria-hidden="true" />
        {ticket.paid ? "Convite cancelado pelo estorno do pagamento" : "Inscrição cancelada"}
      </p>
    )
  }

  if (ticket.checked_in_at) {
    return (
      <p role="status" className="flex items-center gap-2 font-display font-bold text-success-dark">
        <DoorOpen className="size-5 shrink-0" aria-hidden="true" />
        Entrada registrada às {time(ticket.checked_in_at)} de {formatDate(ticket.checked_in_at)}
      </p>
    )
  }

  return (
    <p role="status" className="flex items-center gap-2 font-display font-bold text-success-dark">
      <BadgeCheck className="size-5 shrink-0" aria-hidden="true" />
      {ticket.paid ? "Convite confirmado" : "Inscrição confirmada"}
    </p>
  )
}

// A porta, vista do celular da equipe. O QR do ingresso abre esta mesma página,
// e quem está logado como Comunicação ou Administração registra a entrada daqui,
// sem precisar procurar o nome na lista. Para o público o botão não existe.
function DoorAction({ ticket }: { ticket: Ticket }) {
  const { user } = useSession()
  const checkIn = useCheckIn()

  const staff = user?.role === "admin" || user?.role === "communication"
  const takingEntries = ticket.event.status === "published" || ticket.event.status === "finished"

  if (!staff || ticket.status !== "confirmed" || ticket.checked_in_at || !takingEntries) return null

  return (
    <div className="flex flex-col gap-3 rounded-card border-2 border-ink p-5 print:hidden">
      <p className="font-display text-sm font-bold">Portaria</p>
      <Button
        disabled={checkIn.isPending}
        onClick={() => checkIn.mutate({ eventId: ticket.event.id, code: ticket.ticket_code })}
      >
        {checkIn.isPending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <DoorOpen className="size-5" aria-hidden="true" />}
        Registrar entrada de {ticket.participant_name}
      </Button>
      {checkIn.isError && (
        <p className="text-sm font-semibold text-primary">
          {checkIn.error instanceof CheckoutError ? checkIn.error.message : "Não conseguimos falar com o servidor. Tente de novo."}
        </p>
      )}
    </div>
  )
}

// O ingresso: do convite pago e da inscrição gratuita, o mesmo documento. O
// código no endereço é a credencial, então a página mostra o nome, que a
// portaria confere, e nunca o e-mail nem o telefone de quem se inscreveu.
export default function TicketPage() {
  const { codigo = "" } = useParams()
  const { data: ticket, isPending, isError, error, refetch } = useTicket(codigo)

  if (isPending) {
    return (
      <Container className="py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-4 h-5 w-1/3" />
        <Skeleton className="mt-10 h-80 w-full max-w-md" />
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
            title={missing ? "Ingresso não encontrado" : "O ingresso não carregou"}
            description={
              missing
                ? "Nenhuma inscrição tem este código. Confira o endereço completo, ou fale com a associação informando o seu nome e o evento."
                : "Não conseguimos buscar o ingresso agora."
            }
            action={
              missing ? (
                <ButtonLink to="/eventos" size="sm">
                  Ver a agenda
                </ButtonLink>
              ) : (
                <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
                  Tentar de novo
                </button>
              )
            }
          />
        </div>
      </Container>
    )
  }

  const { event } = ticket

  return (
    <>
      <PageHero
        eyebrow={ticket.paid ? "Convite" : "Inscrição"}
        title={event.title}
        tone="success"
        breadcrumb={[{ label: "Eventos", to: "/eventos" }, { label: event.title, to: `/eventos/${event.slug}` }, { label: "Ingresso" }]}
        lead={<p>Mostre o QR na entrada do evento. A equipe confere o seu nome e registra a chegada.</p>}
      />

      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
          <div className="flex flex-col items-center gap-5 rounded-card border border-line bg-surface p-6 text-center sm:p-8">
            <Badge tone={ticket.status === "cancelled" ? "primary" : "success"}>{ticket.paid ? "Convite" : "Entrada gratuita"}</Badge>

            <p className="font-display text-2xl font-extrabold break-words">{ticket.participant_name}</p>

            <img
              src={ticket.qr}
              alt={`QR do ingresso ${ticket.ticket_code}`}
              width={240}
              height={240}
              className={ticket.status === "cancelled" ? "size-60 opacity-30" : "size-60"}
            />

            <div>
              <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">Código</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest">{ticket.ticket_code}</p>
            </div>

            <TicketStatus ticket={ticket} />
          </div>

          <div className="flex flex-col gap-6">
            {event.status === "cancelled" && (
              <StateMessage
                tone="error"
                title="Este evento foi cancelado"
                description="Este ingresso não vale mais na entrada. Fale com a associação para saber o que acontece com a sua inscrição."
              />
            )}

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-card border border-line p-4">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-success-dark" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="font-display text-xs font-bold tracking-wide text-ink-soft uppercase">Data</dt>
                  <dd className="mt-1 text-sm">{formatDate(event.starts_at)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-card border border-line p-4">
                <Clock className="mt-0.5 size-5 shrink-0 text-success-dark" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="font-display text-xs font-bold tracking-wide text-ink-soft uppercase">Horário</dt>
                  <dd className="mt-1 text-sm">a partir das {time(event.starts_at)}</dd>
                </div>
              </div>
              {event.location && (
                <div className="flex items-start gap-3 rounded-card border border-line p-4 sm:col-span-2">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-success-dark" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="font-display text-xs font-bold tracking-wide text-ink-soft uppercase">Local</dt>
                    <dd className="mt-1 text-sm">{event.location}</dd>
                  </div>
                </div>
              )}
            </dl>

            <DoorAction ticket={ticket} />

            <p className="text-sm leading-relaxed text-ink-soft">
              Guarde o endereço desta página ou o código acima: eles são o seu ingresso. Se perder os
              dois, fale com a associação informando o seu nome e o evento.
            </p>

            <div className="flex flex-wrap gap-3 print:hidden">
              <Button variant="outline" tone="ink" size="sm" onClick={() => window.print()}>
                <Printer className="size-4" aria-hidden="true" />
                Imprimir ingresso
              </Button>
              <ButtonLink to={`/eventos/${event.slug}`} variant="outline" tone="ink" size="sm">
                Ver o evento
              </ButtonLink>
            </div>

            <p className="text-sm text-ink-soft print:hidden">
              Dúvidas?{" "}
              <Link to="/fale-conosco" className="font-bold text-primary underline underline-offset-4">
                Fale com a associação
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>
    </>
  )
}
