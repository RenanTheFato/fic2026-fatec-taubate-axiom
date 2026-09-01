import { ArrowRight } from "lucide-react"
import { useUpcomingEvents } from "../../hooks/use-upcoming-events"
import { EventCard } from "../event/event-card"
import { Reveal } from "../motion/reveal"
import { ButtonLink } from "../ui/button"
import { Container } from "../ui/container"
import { SectionHeading } from "../ui/section"
import { CardSkeleton, StateMessage } from "../ui/states"

export function EventsAgenda() {
  const { data, isPending, isError, refetch } = useUpcomingEvents(3)

  return (
    <section aria-labelledby="agenda" className="bg-surface-muted py-16 sm:py-24">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="agenda"
            eyebrow="Agenda"
            title="Próximos eventos"
            description="Encontros, campanhas e jantares beneficentes que sustentam os programas da associação."
          />

          <ButtonLink to="/eventos" variant="outline" className="shrink-0">
            Ver todos
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
              title="A agenda não carregou"
              description="Não conseguimos buscar os próximos eventos agora."
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
              title="Nenhum evento marcado por enquanto"
              description="Assim que a próxima data for confirmada, ela aparece aqui."
              action={
                <ButtonLink to="/doe-agora" size="sm">
                  Apoiar mesmo assim
                </ButtonLink>
              }
            />
          </div>
        )}

        {data && data.length > 0 && (
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((event, index) => (
              <li key={event.id}>
                <Reveal delay={index * 0.08} className="h-full">
                  <EventCard event={event} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  )
}
