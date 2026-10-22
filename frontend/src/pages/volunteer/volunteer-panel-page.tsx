import { CalendarCheck, CalendarDays, Clock, Hourglass, MapPin, Send, Users } from "lucide-react"
import { useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { ConfirmDialog } from "../../components/admin/confirm-dialog"
import { AREA_LABEL, AREAS, ASSIGNMENT_STATUS, PERIOD_LABEL, PERIODS, formatHours } from "../../components/volunteer/volunteer-labels"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Checkbox, CheckboxGroup, Field, SelectInput, TextArea } from "../../components/ui/field"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError, NotFoundError } from "../../config/errors"
import { useSession } from "../../hooks/use-session"
import {
  useJoinShift,
  useLeaveShift,
  useMyShifts,
  useOpenShifts,
  useResubmitVolunteer,
  useVolunteerProfile,
} from "../../hooks/use-volunteer-panel"
import { hasStarted, pastAssignments, shiftTime, upcomingAssignments } from "../../services/volunteer/volunteer-service"
import type { MyAssignment, OpenShift, VolunteerArea, VolunteerPeriod, VolunteerProfile, VolunteerShift } from "../../types/volunteer-types"
import { formatDate } from "../../utils/format"

function ShiftFacts({ shift }: { shift: VolunteerShift }) {
  return (
    <>
      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          {formatDate(shift.starts_at)}, {shiftTime(shift)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {shift.place}
        </span>
      </p>
      <p className="mt-1 text-xs text-ink-soft">Coordenação: {shift.coordinator}</p>
    </>
  )
}

type AssignmentRowProps = {
  assignment: MyAssignment
  onLeave?: (assignment: MyAssignment) => void
}

function AssignmentRow({ assignment, onLeave }: AssignmentRowProps) {
  const cancelledByCoordination = assignment.shift.status === "cancelled"
  const status = cancelledByCoordination ? ASSIGNMENT_STATUS.cancelled : ASSIGNMENT_STATUS[assignment.status]
  const canLeave = onLeave && !cancelledByCoordination && (assignment.status === "pending" || assignment.status === "confirmed")
  const started = hasStarted(assignment.shift)
  const waitingRecord = started && (assignment.status === "pending" || assignment.status === "confirmed")

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-display font-bold">{assignment.shift.activity}</p>
        <ShiftFacts shift={assignment.shift} />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {assignment.status === "attended" && assignment.hours && <span className="text-sm font-semibold">{formatHours(assignment.hours)}</span>}
        {waitingRecord ? (
          <Badge tone="reward">Aguardando presença</Badge>
        ) : (
          <Badge tone={status.tone}>{cancelledByCoordination ? "Turno cancelado" : status.label}</Badge>
        )}
        {canLeave && !started && (
          <Button size="sm" variant="outline" tone="ink" onClick={() => onLeave(assignment)}>
            Sair do turno
          </Button>
        )}
      </div>
    </li>
  )
}

type OpenShiftCardProps = {
  shift: OpenShift
  pending: boolean
  onJoin: (shift: OpenShift) => void
}

// Forma fixa, como todo cartão em grade: o topo tem um selo só, a descrição tem
// linhas reservadas e o pé leva o botão ou a situação da pessoa no turno, então
// um turno sem descrição, ou um em que a pessoa já está, ocupa o mesmo espaço.
function OpenShiftCard({ shift, pending, onJoin }: OpenShiftCardProps) {
  return (
    <li className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
      <Badge tone="institutional">{AREA_LABEL[shift.area]}</Badge>
      <div className="min-w-0">
        <p className="line-clamp-2 min-h-[2lh] font-display font-bold">{shift.activity}</p>
        <ShiftFacts shift={shift} />
        <p className="mt-2 line-clamp-2 min-h-[2lh] text-sm text-ink-soft">{shift.description ?? ""}</p>
      </div>

      <div className="mt-auto flex min-h-14 items-center justify-between gap-3 border-t border-line pt-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          <Users className="size-3.5" aria-hidden="true" />
          {shift.free_slots === 1 ? "1 vaga livre" : `${shift.free_slots} vagas livres`}
        </span>
        {shift.my_status ? (
          <Badge tone={ASSIGNMENT_STATUS[shift.my_status].tone}>{ASSIGNMENT_STATUS[shift.my_status].label}</Badge>
        ) : (
          <Button size="sm" tone="success" disabled={pending || shift.free_slots === 0} onClick={() => onJoin(shift)}>
            {shift.free_slots === 0 ? "Turno completo" : "Quero participar"}
          </Button>
        )}
      </div>
    </li>
  )
}

// Quem teve o cadastro recusado ajusta e manda de novo, com a mesma conta.
function ResubmitForm({ volunteer }: { volunteer: VolunteerProfile }) {
  const resubmit = useResubmitVolunteer()
  const [errors, setErrors] = useState<Partial<Record<"area" | "availability" | "about", string>>>({})

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const area = String(form.get("area") ?? "") as VolunteerArea
    const availability = form.getAll("availability").map(String) as VolunteerPeriod[]
    const about = String(form.get("about") ?? "").trim()
    const found: typeof errors = {}

    if (availability.length === 0) found.availability = "Marque pelo menos um período."
    if (about.length < 20) found.about = "Conte um pouco mais: pelo menos 20 caracteres."

    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      document.getElementById(`reenvio-${first}`)?.focus()
      return
    }

    resubmit.mutate({ area, availability, about })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold">Ajustar e enviar de novo</h2>

      <Field id="reenvio-area" label="Onde você quer ajudar" required>
        {(control) => (
          <SelectInput {...control} name="area" defaultValue={volunteer.area}>
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {AREA_LABEL[area]}
              </option>
            ))}
          </SelectInput>
        )}
      </Field>

      <CheckboxGroup id="reenvio-availability" legend="Quando você tem disponibilidade" error={errors.availability} required columns={2}>
        {PERIODS.map((period) => (
          <Checkbox key={period} name="availability" value={period} label={PERIOD_LABEL[period]} defaultChecked={volunteer.availability.includes(period)} />
        ))}
      </CheckboxGroup>

      <Field id="reenvio-about" label="Conte um pouco sobre você" error={errors.about} required>
        {(control) => <TextArea {...control} name="about" defaultValue={volunteer.about} maxLength={2000} />}
      </Field>

      {resubmit.isError && (
        <StateMessage
          tone="error"
          title="O cadastro não foi reenviado"
          description={resubmit.error instanceof CheckoutError ? resubmit.error.message : "Não conseguimos falar com o servidor. Tente de novo."}
        />
      )}

      <Button type="submit" tone="success" disabled={resubmit.isPending} className="w-full sm:w-fit">
        <Send className="size-4" aria-hidden="true" />
        Enviar de novo
      </Button>
    </form>
  )
}

function ReviewStatus({ volunteer }: { volunteer: VolunteerProfile }) {
  if (volunteer.status === "pending") {
    return (
      <StateMessage
        title="Seu cadastro está em análise"
        description={`A coordenação recebeu seu cadastro em ${formatDate(volunteer.created_at)} para ${AREA_LABEL[volunteer.area]}. Assim que ele for aprovado, os turnos abertos aparecem aqui.`}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <StateMessage
        tone="error"
        title="Seu cadastro não foi aprovado desta vez"
        description={volunteer.review_note ?? "A coordenação não deixou o motivo. Fale com a associação."}
      />
      <ResubmitForm volunteer={volunteer} />
    </div>
  )
}

function ApprovedPanel({ volunteer }: { volunteer: VolunteerProfile }) {
  const mine = useMyShifts(true)
  const open = useOpenShifts(true)
  const join = useJoinShift()
  const leave = useLeaveShift()
  const [leaving, setLeaving] = useState<MyAssignment | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const next = mine.data ? upcomingAssignments(mine.data) : []
  const done = mine.data ? pastAssignments(mine.data) : []
  const { summary } = volunteer

  function closeLeave() {
    setLeaving(null)
    leave.reset()
  }

  return (
    <>
      <section aria-labelledby="numeros">
        <h2 id="numeros" className="sr-only">
          Suas horas
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile icon={Clock} label="Horas neste mês" value={formatHours(summary.hours_this_month)} hint="Validadas pela coordenação" />
          <StatTile icon={CalendarCheck} label="Próximos turnos" value={String(summary.upcoming_shifts)} />
          <StatTile
            icon={Hourglass}
            label="Total acumulado"
            value={formatHours(summary.hours_total)}
            hint={summary.member_since ? `Desde ${formatDate(summary.member_since)}` : undefined}
          />
        </div>
      </section>

      {notice && <StateMessage title="Pronto" description={notice} />}

      {join.isError && (
        <StateMessage
          tone="error"
          title="Não deu para entrar no turno"
          description={join.error instanceof CheckoutError ? join.error.message : "Não conseguimos falar com o servidor. Tente de novo."}
        />
      )}

      <section aria-labelledby="proximos" className="flex flex-col gap-5">
        <h2 id="proximos" className="font-display text-xl font-bold">
          Seus próximos turnos
        </h2>

        {mine.isPending && <Skeleton className="h-40 w-full" />}

        {mine.isError && (
          <StateMessage
            tone="error"
            title="A escala não carregou"
            description="Não conseguimos montar a sua escala agora."
            action={
              <button type="button" onClick={() => mine.refetch()} className="font-display font-bold text-primary underline underline-offset-4">
                Tentar de novo
              </button>
            }
          />
        )}

        {mine.data && next.length === 0 && <StateMessage title="Nenhum turno marcado" description="Escolha um dos turnos abertos abaixo." />}

        {next.length > 0 && (
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
            {next.map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} onLeave={setLeaving} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="abertos" className="flex flex-col gap-5">
        <h2 id="abertos" className="font-display text-xl font-bold">
          Turnos abertos
        </h2>

        {open.isPending && <Skeleton className="h-40 w-full" />}

        {open.isError && (
          <StateMessage
            tone="error"
            title="Os turnos abertos não carregaram"
            description="Não conseguimos buscar a escala da casa agora."
            action={
              <button type="button" onClick={() => open.refetch()} className="font-display font-bold text-primary underline underline-offset-4">
                Tentar de novo
              </button>
            }
          />
        )}

        {open.data && open.data.length === 0 && <StateMessage title="Nenhum turno aberto" description="Novos turnos aparecem aqui assim que a coordenação abre a escala." />}

        {open.data && open.data.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {open.data.map((shift) => (
              <OpenShiftCard
                key={shift.id}
                shift={shift}
                pending={join.isPending}
                onJoin={(chosen) => {
                  setNotice(null)
                  join.mutate(chosen.id, {
                    onSuccess: () => setNotice(`Você entrou em "${chosen.activity}". A coordenação confirma a sua participação.`),
                  })
                }}
              />
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
            {done.map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} />
            ))}
          </ul>
        </section>
      )}

      {leaving && (
        <ConfirmDialog
          title={`Sair de "${leaving.shift.activity}"?`}
          consequence={`A vaga de ${formatDate(leaving.shift.starts_at)}, ${shiftTime(leaving.shift)}, volta para a escala e outra pessoa pode ocupá-la.`}
          confirmLabel="Sair do turno"
          pending={leave.isPending}
          error={leave.isError ? (leave.error instanceof CheckoutError ? leave.error.message : "Não conseguimos falar com o servidor. Nada foi alterado.") : null}
          onClose={closeLeave}
          onConfirm={() =>
            leave.mutate(leaving.shift.id, {
              onSuccess: () => {
                setNotice(`Você saiu de "${leaving.shift.activity}".`)
                closeLeave()
              },
            })
          }
        />
      )}
    </>
  )
}

// O painel de quem doa tempo: a situação do cadastro, as horas validadas pela
// coordenação, a própria escala, os turnos abertos da casa e o histórico. Tudo
// vem da vertical de voluntariado da API.
export default function VolunteerPanelPage() {
  const { user } = useSession()
  const profile = useVolunteerProfile()

  return (
    <AdminPage
      title={`Olá, ${user?.name.split(" ")[0] ?? "voluntário"}`}
      action={
        <ButtonLink to="/" variant="outline" tone="ink" size="sm">
          Ver o site público
        </ButtonLink>
      }
    >
      {profile.isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      )}

      {profile.error instanceof NotFoundError && (
        <StateMessage
          title="Este acesso não tem cadastro de voluntariado"
          description="Fale com a coordenação para ligar o seu acesso a um cadastro."
          action={
            <ButtonLink to="/fale-conosco" size="sm" variant="outline" tone="ink">
              Fale conosco
            </ButtonLink>
          }
        />
      )}

      {profile.isError && !(profile.error instanceof NotFoundError) && (
        <StateMessage
          tone="error"
          title="O painel não carregou"
          description="Não conseguimos buscar o seu cadastro agora."
          action={
            <button type="button" onClick={() => profile.refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {profile.data && profile.data.status !== "approved" && <ReviewStatus volunteer={profile.data} />}

      {profile.data && profile.data.status === "approved" && <ApprovedPanel volunteer={profile.data} />}
    </AdminPage>
  )
}
