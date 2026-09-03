import { CalendarDays } from "lucide-react"
import { EventCard } from "../../components/event/event-card"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"
import { CardSkeleton, StateMessage } from "../../components/ui/states"
import { useEvents } from "../../hooks/use-events"
import { byStartDate, isUpcoming } from "../../services/event/list-events-service"

export default function EventsPage() {
  const { data, isPending, isError, refetch } = useEvents()

  const upcoming = data ? data.events.filter((event) => isUpcoming(event)).sort(byStartDate("asc")) : []
  const past = data ? data.events.filter((event) => !isUpcoming(event)).sort(byStartDate("desc")) : []

  return (
    <>
      <PageHero
        eyebrow="Agenda"
        title="Eventos"
        breadcrumb={[{ label: "Eventos" }]}
        tone="primary"
        scene="drift"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Aqui estão os eventos da associação. Você pode comprar convite pela internet. O
                dinheiro vai para os programas.
              </p>
            }
          >
            <p>
              Jantares, bazares, corridas e visitas abertas. Cada encontro sustenta uma frente da
              associação, e o convite pode ser comprado direto por aqui.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="proximos" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="proximos"
            eyebrow="Próximos"
            title="O que ainda vai acontecer"
            description="As datas já confirmadas, da mais próxima para a mais distante."
          />

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
                title="A agenda não carregou"
                description="Não conseguimos buscar os eventos agora."
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

          {data && upcoming.length === 0 && (
            <div className="mt-10 max-w-md">
              <StateMessage
                title="Nenhuma data marcada por enquanto"
                description="A próxima edição ainda está sendo organizada. Assim que for confirmada, aparece aqui."
                action={
                  <ButtonLink to="/doe-agora" size="sm">
                    Apoiar mesmo assim
                  </ButtonLink>
                }
              />
            </div>
          )}

          {upcoming.length > 0 && (
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, index) => (
                <li key={event.id}>
                  <Reveal delay={index * 0.06} className="h-full">
                    <EventCard event={event} />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {past.length > 0 && (
        <section aria-labelledby="realizados" className="bg-surface-muted py-16 sm:py-20">
          <Container>
            <SectionHeading
              id="realizados"
              eyebrow="Histórico"
              title="Edições já realizadas"
              description="O que já aconteceu continua listado: é parte da prestação de contas do que a associação organiza."
              tone="institutional"
            />

            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {past.map((event, index) => (
                <li key={event.id}>
                  <Reveal delay={index * 0.06} className="h-full">
                    <EventCard event={event} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col items-start gap-5 rounded-card border border-line bg-institutional-soft p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <CalendarDays className="mt-1 size-8 shrink-0 text-institutional-dark" aria-hidden="true" />
            <div>
              <h2 className="font-display text-xl font-bold">Quer levar um evento para a sua empresa?</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
                Empresas parceiras patrocinam edições inteiras e recebem prestação de contas do que o
                apoio sustentou.
              </p>
            </div>
          </div>

          <ButtonLink to="/fale-conosco" tone="ink" variant="outline" className="shrink-0">
            Falar com a associação
          </ButtonLink>
        </Container>
      </section>
    </>
  )
}
