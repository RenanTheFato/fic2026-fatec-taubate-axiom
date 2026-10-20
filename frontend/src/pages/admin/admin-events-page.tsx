import { CalendarDays, Plus, Ticket } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { ConfirmDialog } from "../../components/admin/confirm-dialog"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { EventEditor } from "../../components/admin/event-editor"
import { Badge } from "../../components/ui/badge"
import type { BadgeTone } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useAllEvents, useCatalogAction } from "../../hooks/use-admin-catalog"
import { useDeleteFromCatalog } from "../../hooks/use-catalog-editor"
import { useSession } from "../../hooks/use-session"
import type { ApiEvent, EventStatus } from "../../types/event-types"
import { formatCurrency, formatDate } from "../../utils/format"

const STATUS: Record<EventStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Rascunho", tone: "alert" },
  published: { label: "Publicado", tone: "success" },
  finished: { label: "Realizado", tone: "institutional" },
  cancelled: { label: "Cancelado", tone: "primary" },
}

type Editing = { mode: "new" } | { mode: "edit"; event: ApiEvent } | null

// Só evento `published` vende convite ou recebe inscrição. A vaga é debitada
// na confirmação do pagamento ou na inscrição gratuita, por isso `taken_seats`
// conta lugares garantidos, não pedidos abertos.
//
// A linha carrega no máximo quatro botões. "Ver no site" do evento no ar fica
// na lista de inscritos, que é para onde a equipe vai quando o evento já está
// vendendo.
export default function AdminEventsPage() {
  const { user } = useSession()
  const { data, isPending, isError, refetch } = useAllEvents()
  const action = useCatalogAction()
  const removal = useDeleteFromCatalog()
  const [editing, setEditing] = useState<Editing>(null)
  const [removing, setRemoving] = useState<ApiEvent | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const isAdmin = user?.role === "admin"

  function open(next: Editing) {
    setNotice(null)
    setEditing(next)
  }

  function finish(message: string) {
    setEditing(null)
    setNotice(message)
  }

  function closeRemoval() {
    setRemoving(null)
    removal.reset()
  }

  const columns: Column<ApiEvent>[] = [
    { key: "title", header: "Evento", primary: true, cell: (row) => row.title },
    { key: "date", header: "Data", nowrap: true, cell: (row) => formatDate(row.starts_at) },
    {
      key: "seats",
      header: "Ocupação",
      hideBelow: "lg",
      cell: (row) =>
        row.capacity === null ? `${row.taken_seats}, sem limite` : `${row.taken_seats} de ${row.capacity}`,
    },
    {
      key: "price",
      header: "Convite",
      hideBelow: "lg",
      cell: (row) => (Number(row.ticket_price) > 0 ? formatCurrency(row.ticket_price) : "gratuito"),
    },
    {
      key: "status",
      header: "Situação",
      cell: (row) => <Badge tone={STATUS[row.status].tone}>{STATUS[row.status].label}</Badge>,
    },
  ]

  const published = data ? data.filter((event) => event.status === "published").length : 0
  const seats = data ? data.reduce((total, event) => total + event.taken_seats, 0) : 0

  return (
    <AdminPage
      title="Eventos"
      action={
        editing === null && (
          <Button size="sm" onClick={() => open({ mode: "new" })}>
            <Plus className="size-4" aria-hidden="true" />
            Novo evento
          </Button>
        )
      }
    >
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            icon={CalendarDays}
            label="Cadastrados"
            value={String(data.length)}
            hint="Inclui rascunhos e cancelados"
          />
          <StatTile
            icon={CalendarDays}
            label="Publicados"
            value={String(published)}
            hint="Na agenda do site"
          />
          <StatTile
            icon={Ticket}
            label="Vagas ocupadas"
            value={String(seats)}
            hint="Convites e inscrições"
          />
        </div>
      )}

      {notice && <StateMessage title="Pronto" description={notice} />}

      {editing && (
        <EventEditor
          key={editing.mode === "edit" ? editing.event.id : "novo"}
          event={editing.mode === "edit" ? editing.event : undefined}
          onDone={finish}
          onCancel={() => setEditing(null)}
        />
      )}

      {action.isError && (
        <StateMessage
          tone="error"
          title="A operação não foi concluída"
          description={
            action.error instanceof CheckoutError
              ? action.error.message
              : "Não conseguimos falar com o servidor. Nada foi alterado."
          }
        />
      )}

      {isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <StateMessage
          tone="error"
          title="Os eventos não carregaram"
          description="Não conseguimos buscar a agenda agora."
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
      )}

      {data && data.length === 0 && (
        <StateMessage
          title="Nenhum evento cadastrado"
          description="Nenhum evento cadastrado."
          action={
            <Button size="sm" onClick={() => open({ mode: "new" })}>
              Novo evento
            </Button>
          }
        />
      )}

      {data && data.length > 0 && (
        <div className="rounded-card border-line bg-surface lg:border lg:p-2">
          <DataList
            caption="Eventos da associação"
            columns={columns}
            rows={data}
            rowKey={(row) => row.id}
            breakpoint="xl"
            actions={(row) => (
              <>
                {(row.status === "draft" || row.status === "published") && (
                  <Button size="sm" variant="outline" tone="ink" onClick={() => open({ mode: "edit", event: row })}>
                    Editar
                  </Button>
                )}

                {row.status === "draft" && (
                  <Button
                    size="sm"
                    disabled={action.isPending}
                    onClick={() => action.mutate({ domain: "event", action: "publish", id: row.id })}
                  >
                    Publicar
                  </Button>
                )}

                {row.status !== "draft" && (
                  <ButtonLink to={`/admin/comunicacao/eventos/${row.id}/inscritos`} size="sm" variant="outline" tone="ink">
                    Inscritos
                  </ButtonLink>
                )}

                {row.status === "published" && (
                  <Button
                    size="sm"
                    variant="outline"
                    tone="ink"
                    disabled={action.isPending}
                    onClick={() => action.mutate({ domain: "event", action: "finish", id: row.id })}
                  >
                    Encerrar
                  </Button>
                )}

                {row.status === "finished" && (
                  <ButtonLink to={`/eventos/${row.slug}`} size="sm" variant="outline" tone="ink">
                    Ver no site
                  </ButtonLink>
                )}

                {isAdmin && row.status === "draft" && (
                  <Button size="sm" variant="outline" tone="primary" onClick={() => setRemoving(row)}>
                    Excluir
                  </Button>
                )}

                {isAdmin && row.status === "published" && (
                  <Button
                    size="sm"
                    variant="outline"
                    tone="primary"
                    disabled={action.isPending}
                    onClick={() => action.mutate({ domain: "event", action: "cancel", id: row.id })}
                  >
                    Cancelar
                  </Button>
                )}
              </>
            )}
          />
        </div>
      )}

      {removing && (
        <ConfirmDialog
          title={`Excluir "${removing.title}"?`}
          consequence="O rascunho é apagado de vez. Ele nunca esteve na agenda, então ninguém comprou convite nem se inscreveu."
          confirmLabel="Excluir rascunho"
          pending={removal.isPending}
          error={removal.isError ? (removal.error instanceof CheckoutError ? removal.error.message : "Não conseguimos falar com o servidor. Nada foi apagado.") : null}
          onClose={closeRemoval}
          onConfirm={() =>
            removal.mutate(
              { domain: "event", id: removing.id },
              {
                onSuccess: () => {
                  setNotice(`"${removing.title}" foi excluído.`)
                  closeRemoval()
                },
              },
            )
          }
        />
      )}
    </AdminPage>
  )
}
