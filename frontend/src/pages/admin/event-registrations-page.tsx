import { ArrowLeft, DoorOpen, Ticket, Users } from "lucide-react"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { CheckInForm } from "../../components/admin/check-in-form"
import { ConfirmDialog } from "../../components/admin/confirm-dialog"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Field, TextInput } from "../../components/ui/field"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useCancelRegistration, useCheckIn, useEventRegistrations, useUndoCheckIn } from "../../hooks/use-admin-registrations"
import type { Registration } from "../../types/registration-types"
import { formatDate } from "../../utils/format"

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function matches(registration: Registration, search: string): boolean {
  const wanted = search.trim().toLowerCase()

  if (!wanted) return true

  return [registration.participant_name, registration.participant_email, registration.ticket_code].some((value) =>
    value.toLowerCase().includes(wanted),
  )
}

// A lista de presença de um evento: quem garantiu lugar, por convite pago ou
// inscrição gratuita, e quem já passou pela porta. A busca é feita na tela,
// sobre a lista inteira, porque na porta não dá para esperar a rede a cada letra.
export default function EventRegistrationsPage() {
  const { id = "" } = useParams()
  const { data, isPending, isError, refetch } = useEventRegistrations(id)
  const checkIn = useCheckIn()
  const undo = useUndoCheckIn()
  const cancel = useCancelRegistration()
  const [search, setSearch] = useState("")
  const [cancelling, setCancelling] = useState<Registration | null>(null)

  const event = data?.event
  const takingEntries = event?.status === "published" || event?.status === "finished"
  const rowError = checkIn.error ?? undo.error

  function closeCancel() {
    setCancelling(null)
    cancel.reset()
  }

  const columns: Column<Registration>[] = [
    { key: "name", header: "Participante", primary: true, cell: (row) => row.participant_name },
    {
      key: "email",
      header: "E-mail",
      hideBelow: "xl",
      cell: (row) => <span className="min-w-0 break-all">{row.participant_email}</span>,
    },
    { key: "code", header: "Código", nowrap: true, cell: (row) => <span className="font-mono text-xs">{row.ticket_code}</span> },
    {
      key: "kind",
      header: "Tipo",
      hideBelow: "lg",
      nowrap: true,
      cell: (row) => (row.transaction_id ? "Convite pago" : "Gratuita"),
    },
    {
      key: "status",
      header: "Situação",
      nowrap: true,
      cell: (row) =>
        row.status === "cancelled" ? (
          <Badge tone="primary">Cancelada</Badge>
        ) : row.checked_in_at ? (
          <Badge tone="success">Entrou {time(row.checked_in_at)}</Badge>
        ) : (
          <Badge tone="institutional">Aguardando</Badge>
        ),
    },
  ]

  const visible = data ? data.registrations.filter((registration) => matches(registration, search)) : []

  return (
    <AdminPage
      title={event?.title ?? "Inscritos"}
      action={
        event && (event.status === "published" || event.status === "finished") ? (
          <ButtonLink to={`/eventos/${event.slug}`} size="sm" variant="outline" tone="ink">
            Ver no site
          </ButtonLink>
        ) : undefined
      }
    >
      <Link
        to="/admin/comunicacao/eventos"
        className="-mt-4 inline-flex w-fit items-center gap-2 text-sm font-bold text-ink-soft underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Eventos
      </Link>

      {data && event && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile icon={Users} label="Inscritos" value={String(data.summary.confirmed)} hint={formatDate(event.starts_at)} />
          <StatTile icon={DoorOpen} label="Presentes" value={`${data.summary.checked_in} de ${data.summary.confirmed}`} />
          <StatTile
            icon={Ticket}
            label="Vagas"
            value={event.capacity === null ? "Sem limite" : `${event.taken_seats} de ${event.capacity}`}
          />
        </div>
      )}

      {event?.status === "cancelled" && (
        <StateMessage title="Evento cancelado" description="A lista fica para consulta. Este evento não registra entrada." />
      )}

      {data && event && takingEntries && <CheckInForm eventId={event.id} registrations={data.registrations} disabled={false} />}

      {rowError && (
        <StateMessage
          tone="error"
          title="A operação não foi concluída"
          description={rowError instanceof CheckoutError ? rowError.message : "Não conseguimos falar com o servidor. Nada foi alterado."}
        />
      )}

      {isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <StateMessage
          tone="error"
          title="A lista não carregou"
          description="Não conseguimos buscar os inscritos agora."
          action={
            <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {data && data.registrations.length === 0 && <StateMessage title="Nenhuma inscrição" description="Ninguém se inscreveu ainda." />}

      {data && data.registrations.length > 0 && (
        <>
          <div className="w-full sm:max-w-sm">
            <Field id="inscritos-busca" label="Buscar por nome, e-mail ou código" hideLabel>
              {(control) => (
                <TextInput
                  {...control}
                  type="search"
                  value={search}
                  onChange={(change) => setSearch(change.target.value)}
                  placeholder="Buscar por nome, e-mail ou código"
                  className="min-h-10 py-2 text-sm"
                />
              )}
            </Field>
          </div>

          {visible.length === 0 ? (
            <StateMessage title="Ninguém com esse nome" description="Nenhuma inscrição corresponde à busca." />
          ) : (
            <div className="rounded-card border-line bg-surface lg:border lg:p-2">
              <DataList
                caption={`Inscritos em ${event?.title ?? "evento"}`}
                columns={columns}
                rows={visible}
                rowKey={(row) => row.id}
                breakpoint="lg"
                actions={(row) => {
                  if (row.status === "cancelled") return null

                  const free = row.transaction_id === null

                  return (
                    <>
                      {/* Em contorno: a leitura principal é a do campo de código, e
                          um botão cheio em cada linha transformaria a lista num
                          mar de vermelho. */}
                      {takingEntries && !row.checked_in_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          tone="ink"
                          disabled={checkIn.isPending}
                          onClick={() => {
                            undo.reset()
                            checkIn.mutate({ eventId: row.event_id, code: row.ticket_code })
                          }}
                        >
                          Registrar entrada
                        </Button>
                      )}

                      {row.checked_in_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          tone="ink"
                          disabled={undo.isPending}
                          onClick={() => {
                            checkIn.reset()
                            undo.mutate(row.id)
                          }}
                        >
                          Desfazer entrada
                        </Button>
                      )}

                      {free && !row.checked_in_at && (
                        <Button size="sm" variant="outline" tone="primary" onClick={() => setCancelling(row)}>
                          Cancelar
                        </Button>
                      )}
                    </>
                  )
                }}
              />
            </div>
          )}
        </>
      )}

      {cancelling && (
        <ConfirmDialog
          title={`Cancelar a inscrição de ${cancelling.participant_name}?`}
          consequence="A vaga volta para a agenda e o ingresso deixa de valer na porta. Avise a pessoa pelo e-mail da inscrição."
          confirmLabel="Cancelar inscrição"
          pending={cancel.isPending}
          error={cancel.isError ? (cancel.error instanceof CheckoutError ? cancel.error.message : "Não conseguimos falar com o servidor. Nada foi alterado.") : null}
          onClose={closeCancel}
          onConfirm={() => cancel.mutate(cancelling.id, { onSuccess: closeCancel })}
        />
      )}
    </AdminPage>
  )
}
