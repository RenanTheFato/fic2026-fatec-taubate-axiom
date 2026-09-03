import { CalendarCheck, CalendarDays, Clock, FlaskConical, MapPin, Users } from "lucide-react"
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

// Painel do voluntariado em versão de protótipo. A agenda e as horas são dados
// de demonstração, porque a vertical de voluntariado ainda não existe na API; os
// eventos, por outro lado, são os de verdade, lidos da mesma rota pública que
// alimenta /eventos. A tela separa as duas coisas de forma explícita, para que
// ninguém confunda o que é sistema com o que é maquete.
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
      description="Suas escalas, suas horas e as atividades abertas da associação. É por aqui que o voluntariado acompanha o próprio compromisso com a casa."
      action={
        <ButtonLink to="/" variant="outline" tone="ink" size="sm">
          Ver o site público
        </ButtonLink>
      }
    >
      <div
        role="note"
        className="flex flex-col gap-3 rounded-card border border-reward bg-reward/15 p-5 sm:flex-row sm:items-start sm:gap-4"
      >
        <FlaskConical className="size-5 shrink-0 text-ink" aria-hidden="true" />
        <div>
          <p className="font-display font-bold">Módulo em construção</p>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink">
            A agenda e as horas abaixo são <strong>dados de demonstração</strong>. O cadastro de
            voluntários, a escala e o registro de presença ainda não existem na API, então nada nesta
            tela vale como comprovante. Os eventos, esses sim, vêm do banco de verdade.
          </p>
        </div>
      </div>

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
              hint="Somadas a partir dos turnos marcados como realizados. Número simulado."
            />
            <StatTile
              icon={CalendarCheck}
              label="Próximos turnos"
              value={formatNumber(summary.data.upcoming_shifts)}
              hint="Turnos já confirmados pela coordenação e que ainda vão acontecer."
            />
            <StatTile
              icon={Users}
              label="Total acumulado"
              value={`${formatNumber(summary.data.hours_total)} h`}
              hint={`Desde ${formatDate(summary.data.member_since)}, quando você entrou no programa.`}
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
            description="Quando a coordenação escalar você para uma atividade, ela aparece aqui com data, local e responsável."
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="eventos" className="font-display text-xl font-bold">
            Atividades abertas da associação
          </h2>
          <span className="text-xs font-bold tracking-wide text-success-dark uppercase">
            dados reais
          </span>
        </div>

        <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">
          São os eventos publicados no site. Para ajudar em um deles, fale com a coordenação: a
          inscrição de voluntário por atividade entra junto com o resto do módulo.
        </p>

        {events.isPending && <Skeleton className="h-32 w-full" />}

        {events.isError && (
          <StateMessage
            tone="error"
            title="Os eventos não carregaram"
            description="Não conseguimos falar com a API agora. Os eventos continuam no servidor."
          />
        )}

        {events.data && open.length === 0 && (
          <StateMessage
            title="Nenhum evento em cartaz"
            description="Assim que a associação publicar a próxima atividade, ela aparece aqui e no site."
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

      <section
        aria-labelledby="pendencias"
        className="flex flex-col gap-3 rounded-card border border-line bg-surface-muted p-6"
      >
        <h2 id="pendencias" className="font-display text-lg font-bold">
          O que falta para esta tela virar sistema
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          O backend precisa de três coisas, nesta ordem: um cadastro de voluntário ligado ao usuário,
          uma escala que case voluntário com atividade e turno, e um registro de presença que só a
          coordenação possa fechar. Com isso, as horas passam a ser somadas pelo banco, e não escritas
          à mão nesta tela.
        </p>
      </section>
    </AdminPage>
  )
}
