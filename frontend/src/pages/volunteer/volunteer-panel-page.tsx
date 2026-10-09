import { CalendarCheck, CalendarDays, Clock, MapPin, Users } from "lucide-react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { Badge } from "../../components/ui/badge"
import type { BadgeTone } from "../../components/ui/badge"
import { ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useEvents } from "../../hooks/use-events"
import { useSession } from "../../hooks/use-session"
import { useVolunteerAgenda, useVolunteerSummary } from "../../hooks/use-volunteer-agenda"
import {
  pastShifts,
  upcomingShifts,
} from "../../services/volunteer/list-volunteer-agenda-service"
import { isUpcoming } from "../../services/event/list-events-service"
import { SHIFT_STATUS_LABEL } from "../../types/volunteer-types"
import type { ShiftStatus, VolunteerShift } from "../../types/volunteer-types"
import { formatDate, formatNumber } from "../../utils/format"

const STATUS_TONE: Record<ShiftStatus, BadgeTone> = {
  confirmed: "success",
  pending: "reward",
  done: "institutional",
}

function timeRange(shift: VolunteerShift): string {
  const start = new Date(shift.starts_at)
  const end = new Date(shift.ends_at)
  const format = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" })

  return `${format.format(start)} às ${format.format(end)}`
}

function ShiftRow({ shift }: { shift: VolunteerShift }) {
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-display font-bold">{shift.activity}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {formatDate(shift.starts_at)}, {timeRange(shift)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {shift.place}
          </span>
        </p>
        <p className="mt-1 text-xs text-ink-soft">Coordenação: {shift.coordinator}</p>
      </div>

      <Badge tone={STATUS_TONE[shift.status]} className="shrink-0">
        {SHIFT_STATUS_LABEL[shift.status]}
      </Badge>
    </li>
  )
}

// Painel de quem doa tempo: a escala da pessoa, as horas acumuladas e as
// atividades abertas da casa. A agenda vem de `services/volunteer`, que hoje
// resolve os turnos localmente, e os eventos vêm da mesma rota pública que
// alimenta /eventos. Quando a vertical de voluntariado existir na API, só a
// função do serviço muda: esta tela não sabe de onde o turno veio.
export default function VolunteerPanelPage() {
  const { user } = useSession()

  const agenda = useVolunteerAgenda()
  const summary = useVolunteerSummary()
  const events = useEvents()

  const next = agenda.data ? upcomingShifts(agenda.data) : []
  const done = agenda.data ? pastShifts(agenda.data) : []
  const open = events.data ? events.data.events.filter((event) => isUpcoming(event)) : []

  return (
    <AdminPage
      title={`Olá, ${user?.name.split(" ")[0] ?? "voluntário"}`}
      action={
        <ButtonLink to="/" variant="outline" tone="ink" size="sm">
          Ver o site público
        </ButtonLink>
      }
    >
      <section aria-labelledby="numeros">
        <h2 id="numeros" className="sr-only">
          Suas horas
        </h2>

        {summary.isPending && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        )}

        {summary.data && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile
              icon={Clock}
              label="Horas neste mês"
              value={formatNumber(summary.data.hours_this_month)}
              hint="Turnos realizados"
            />
            <StatTile
              icon={CalendarCheck}
              label="Próximos turnos"
              value={formatNumber(summary.data.upcoming_shifts)}
              hint="Confirmados pela coordenação"
            />
            <StatTile
              icon={Users}
              label="Total acumulado"
              value={`${formatNumber(summary.data.hours_total)} h`}
              hint={`Desde ${formatDate(summary.data.member_since)}`}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="proximos" className="flex flex-col gap-5">
        <h2 id="proximos" className="font-display text-xl font-bold">
          Seus próximos turnos
        </h2>

        {agenda.isPending && <Skeleton className="h-40 w-full" />}

        {agenda.isError && (
          <StateMessage
            tone="error"
            title="A agenda não carregou"
            description="Não conseguimos montar a sua escala agora. Tente abrir a tela de novo em instantes."
          />
        )}

        {agenda.data && next.length === 0 && (
          <StateMessage
            title="Nenhum turno marcado"
            description="Nenhuma escala marcada."
          />
        )}

        {next.length > 0 && (
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
            {next.map((shift) => (
              <ShiftRow key={shift.id} shift={shift} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="eventos" className="flex flex-col gap-5">
        <h2 id="eventos" className="font-display text-xl font-bold">
          Atividades abertas da associação
        </h2>

        {events.isPending && <Skeleton className="h-32 w-full" />}

        {events.isError && (
          <StateMessage
            tone="error"
            title="Os eventos não carregaram"
            description="Não conseguimos carregar os eventos agora."
          />
        )}

        {events.data && open.length === 0 && (
          <StateMessage
            title="Nenhum evento em cartaz"
            description="Nenhuma atividade publicada."
          />
        )}

        {open.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2">
            {open.slice(0, 4).map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5"
              >
                <div className="min-w-0">
                  <p className="font-display font-bold">{event.title}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {formatDate(event.starts_at)}
                    {event.location ? `, ${event.location}` : ""}
                  </p>
                </div>

                <ButtonLink to={`/eventos/${event.slug}`} size="sm" variant="outline" tone="ink">
                  Ver o evento
                </ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section aria-labelledby="historico" className="flex flex-col gap-5">
          <h2 id="historico" className="font-display text-xl font-bold">
            O que você já fez
          </h2>

          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
            {done.map((shift) => (
              <ShiftRow key={shift.id} shift={shift} />
            ))}
          </ul>
        </section>
      )}
    </AdminPage>
  )
}
