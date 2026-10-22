import { CalendarDays, MapPin, Plus, Users } from "lucide-react"
import { useState } from "react"
import { AdminPage } from "../../components/admin/admin-ui"
import { AttendanceDialog } from "../../components/admin/attendance-dialog"
import { ConfirmDialog } from "../../components/admin/confirm-dialog"
import { ShiftEditor } from "../../components/admin/shift-editor"
import { AREA_LABEL, ASSIGNMENT_STATUS, formatHours } from "../../components/volunteer/volunteer-labels"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useCancelShift, useRecordAttendance, useReviewAssignment, useShifts } from "../../hooks/use-admin-volunteers"
import { hasStarted, shiftTime } from "../../services/volunteer/volunteer-service"
import type { CoordinatedShift } from "../../types/volunteer-types"
import { formatDate } from "../../utils/format"

type Person = CoordinatedShift["assignments"][number]

type Attending = { shift: CoordinatedShift; person: Person } | null

function failure(error: unknown, fallback: string): string {
  return error instanceof CheckoutError ? error.message : fallback
}

function durationOf(shift: CoordinatedShift): number {
  return (new Date(shift.ends_at).getTime() - new Date(shift.starts_at).getTime()) / 3_600_000
}

type ShiftCardProps = {
  shift: CoordinatedShift
  busy: boolean
  onConfirm: (person: Person) => void
  onDismiss: (person: Person) => void
  onAttended: (person: Person) => void
  onAbsent: (person: Person) => void
  onCancel: (shift: CoordinatedShift) => void
}

function ShiftCard({ shift, busy, onConfirm, onDismiss, onAttended, onAbsent, onCancel }: ShiftCardProps) {
  const started = hasStarted(shift)
  const cancelled = shift.status === "cancelled"
  const people = shift.assignments.filter((person) => person.status !== "cancelled")
  const left = shift.assignments.length - people.length
  const toRecord = started && !cancelled ? people.filter((person) => person.status === "pending" || person.status === "confirmed").length : 0

  return (
    <li className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="institutional">{AREA_LABEL[shift.area]}</Badge>
        {cancelled && <Badge tone="primary">Turno cancelado</Badge>}
        {toRecord > 0 && <Badge tone="reward">{toRecord === 1 ? "1 presença a registrar" : `${toRecord} presenças a registrar`}</Badge>}
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft sm:ml-auto">
          <Users className="size-3.5" aria-hidden="true" />
          {shift.taken_slots} de {shift.slots} vagas
        </span>
      </div>

      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold break-words">{shift.activity}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
            {formatDate(shift.starts_at)}, {shiftTime(shift)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {shift.place}
          </span>
          <span>Coordenação: {shift.coordinator}</span>
        </p>
        {shift.description && <p className="mt-2 text-sm leading-relaxed">{shift.description}</p>}
      </div>

      {people.length === 0 ? (
        <p className="rounded-tile bg-surface-muted p-3 text-sm text-ink-soft">Ninguém se ofereceu ainda.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-tile border border-line" aria-label={`Voluntários de ${shift.activity}`}>
          {people.map((person) => {
            const status = ASSIGNMENT_STATUS[person.status]

            return (
              <li key={person.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold break-words">{person.volunteer.user.name}</p>
                  <p className="text-xs text-ink-soft">{person.volunteer.phone}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {person.status === "attended" && person.hours && <span className="text-sm font-semibold">{formatHours(person.hours)}</span>}
                  <Badge tone={status.tone}>{status.label}</Badge>

                  {!cancelled && !started && person.status === "pending" && (
                    <Button size="sm" tone="success" disabled={busy} onClick={() => onConfirm(person)}>
                      Confirmar
                    </Button>
                  )}
                  {!cancelled && !started && (person.status === "pending" || person.status === "confirmed") && (
                    <Button size="sm" variant="outline" tone="ink" disabled={busy} onClick={() => onDismiss(person)}>
                      Dispensar
                    </Button>
                  )}
                  {!cancelled && started && person.status !== "attended" && (
                    <Button size="sm" tone="success" disabled={busy} onClick={() => onAttended(person)}>
                      Presente
                    </Button>
                  )}
                  {!cancelled && started && person.status !== "absent" && (
                    <Button size="sm" variant="outline" tone="ink" disabled={busy} onClick={() => onAbsent(person)}>
                      Faltou
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {(left > 0 || (!cancelled && !started)) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          {left > 0 && <span className="text-xs text-ink-soft">{left === 1 ? "1 pessoa saiu do turno" : `${left} pessoas saíram do turno`}</span>}
          {!cancelled && !started && (
            <Button size="sm" variant="outline" tone="ink" className="sm:ml-auto" onClick={() => onCancel(shift)}>
              Cancelar turno
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

// A escala do voluntariado. A coordenação abre os turnos, confirma quem se
// ofereceu e, depois que o turno acontece, registra presença ou falta: só a
// presença registrada vira hora no painel do voluntário.
export default function VolunteerScalePage() {
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming")
  const [creating, setCreating] = useState(false)
  const [cancelling, setCancelling] = useState<CoordinatedShift | null>(null)
  const [attending, setAttending] = useState<Attending>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useShifts(scope)
  const review = useReviewAssignment()
  const attendance = useRecordAttendance()
  const cancel = useCancelShift()

  const actionError = review.isError
    ? failure(review.error, "Não conseguimos falar com o servidor. Nada foi alterado.")
    : attendance.isError && !attending
      ? failure(attendance.error, "Não conseguimos falar com o servidor. Nada foi alterado.")
      : null

  function closeCancel() {
    setCancelling(null)
    cancel.reset()
  }

  function closeAttendance() {
    setAttending(null)
    attendance.reset()
  }

  return (
    <AdminPage
      title="Escala do voluntariado"
      action={
        !creating && (
          <Button
            size="sm"
            onClick={() => {
              setNotice(null)
              setCreating(true)
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Novo turno
          </Button>
        )
      }
    >
      {creating && (
        <ShiftEditor
          onCancel={() => setCreating(false)}
          onDone={(message) => {
            setCreating(false)
            setScope("upcoming")
            setNotice(message)
          }}
        />
      )}

      <div role="group" aria-label="Período" className="flex flex-wrap gap-2">
        {(["upcoming", "past"] as const).map((value) => (
          <Button key={value} size="sm" variant={scope === value ? "solid" : "outline"} tone="ink" aria-pressed={scope === value} onClick={() => setScope(value)}>
            {value === "upcoming" ? "Próximos turnos" : "Já aconteceram"}
          </Button>
        ))}
      </div>

      {notice && <StateMessage title="Pronto" description={notice} />}

      {actionError && <StateMessage tone="error" title="A operação não foi concluída" description={actionError} />}

      {isPending && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <StateMessage
          tone="error"
          title="A escala não carregou"
          description="Não conseguimos buscar os turnos agora."
          action={
            <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {data && data.length === 0 && (
        <StateMessage title={scope === "upcoming" ? "Nenhum turno marcado" : "Nenhum turno realizado"} description={scope === "upcoming" ? "Use Novo turno para abrir a escala." : "Os turnos aparecem aqui depois que acontecem."} />
      )}

      {data && data.length > 0 && (
        <ul className="grid gap-4 xl:grid-cols-2">
          {data.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              busy={review.isPending || attendance.isPending}
              onConfirm={(person) => {
                setNotice(null)
                review.mutate({ id: person.id, decision: "confirmed" }, { onSuccess: () => setNotice(`Participação de ${person.volunteer.user.name} confirmada em "${shift.activity}".`) })
              }}
              onDismiss={(person) => {
                setNotice(null)
                review.mutate({ id: person.id, decision: "cancelled" }, { onSuccess: () => setNotice(`${person.volunteer.user.name} saiu de "${shift.activity}", e a vaga voltou para a escala.`) })
              }}
              onAttended={(person) => setAttending({ shift, person })}
              onAbsent={(person) => {
                setNotice(null)
                attendance.mutate({ id: person.id, attended: false, hours: null }, { onSuccess: () => setNotice(`Falta registrada para ${person.volunteer.user.name}.`) })
              }}
              onCancel={setCancelling}
            />
          ))}
        </ul>
      )}

      {attending && (
        <AttendanceDialog
          name={attending.person.volunteer.user.name}
          activity={`${attending.shift.activity}, ${formatDate(attending.shift.starts_at)}`}
          duration={durationOf(attending.shift)}
          pending={attendance.isPending}
          error={attendance.isError ? failure(attendance.error, "Não conseguimos falar com o servidor. Nada foi alterado.") : null}
          onClose={closeAttendance}
          onConfirm={(hours) =>
            attendance.mutate(
              { id: attending.person.id, attended: true, hours },
              {
                onSuccess: () => {
                  setNotice(`Presença de ${attending.person.volunteer.user.name} registrada: ${formatHours(hours)}.`)
                  closeAttendance()
                },
              },
            )
          }
        />
      )}

      {cancelling && (
        <ConfirmDialog
          title={`Cancelar "${cancelling.activity}"?`}
          consequence={`O turno de ${formatDate(cancelling.starts_at)} sai da escala, e quem estava nele vê o turno como cancelado no painel. Avise as pessoas pelo telefone.`}
          confirmLabel="Cancelar turno"
          pending={cancel.isPending}
          error={cancel.isError ? failure(cancel.error, "Não conseguimos falar com o servidor. Nada foi alterado.") : null}
          onClose={closeCancel}
          onConfirm={() =>
            cancel.mutate(cancelling.id, {
              onSuccess: () => {
                setNotice(`"${cancelling.activity}" foi cancelado.`)
                closeCancel()
              },
            })
          }
        />
      )}
    </AdminPage>
  )
}
