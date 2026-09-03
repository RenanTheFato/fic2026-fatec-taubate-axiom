import { CalendarDays, Ticket } from "lucide-react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { Badge } from "../../components/ui/badge"
import type { BadgeTone } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useAllEvents, useCatalogAction } from "../../hooks/use-admin-catalog"
import { useSession } from "../../hooks/use-session"
import type { ApiEvent, EventStatus } from "../../types/event-types"
import { formatCurrency, formatDate } from "../../utils/format"

const STATUS: Record<EventStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Rascunho", tone: "alert" },
  published: { label: "Publicado", tone: "success" },
  finished: { label: "Realizado", tone: "institutional" },
  cancelled: { label: "Cancelado", tone: "primary" },
}

// Só evento `published` vende convite. E a vaga é debitada uma a uma na
// confirmação (`backend/corrections.md`, item E), por isso `taken_seats` conta
// convites confirmados, não pedidos abertos.
export default function AdminEventsPage() {
  const { user } = useSession()
  const { data, isPending, isError, refetch } = useAllEvents()
  const action = useCatalogAction()

  const canCancel = user?.role === "admin"

  const columns: Column<ApiEvent>[] = [
    { key: "title", header: "Evento", primary: true, cell: (row) => row.title },
    { key: "date", header: "Data", nowrap: true, cell: (row) => formatDate(row.starts_at) },
    {
      key: "seats",
      header: "Ocupação",
      hideBelow: "lg",
      cell: (row) =>
        row.capacity === null ? "sem limite" : `${row.taken_seats} de ${row.capacity}`,
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
      description="A agenda que o site publica. Só evento publicado vende convite, e cada convite confirmado ocupa exatamente uma vaga."
    >
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            icon={CalendarDays}
            label="Cadastrados"
            value={String(data.length)}
            hint="Inclui rascunho e cancelado, que não aparecem na agenda pública."
          />
          <StatTile
            icon={CalendarDays}
            label="Publicados"
            value={String(published)}
            hint="Os que aparecem em /eventos e aceitam compra de convite."
          />
          <StatTile
            icon={Ticket}
            label="Vagas ocupadas"
            value={String(seats)}
            hint="Soma dos convites confirmados de todos os eventos cadastrados."
          />
        </div>
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
          description="A criação de evento ainda acontece pela API. Assim que o primeiro existir, ele aparece aqui com ocupação e os controles de publicação."
        />
      )}

      {data && data.length > 0 && (
        <div className="rounded-card border-line bg-surface lg:border lg:p-2">
          <DataList
            caption="Eventos da associação"
            columns={columns}
            rows={data}
            rowKey={(row) => row.id}
            breakpoint="lg"
            actions={(row) => (
              <>
                {row.status === "draft" && (
                  <Button
                    size="sm"
                    disabled={action.isPending}
                    onClick={() => action.mutate({ domain: "event", action: "publish", id: row.id })}
                  >
                    Publicar
                  </Button>
                )}

                {row.status === "published" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      tone="ink"
                      disabled={action.isPending}
                      onClick={() => action.mutate({ domain: "event", action: "finish", id: row.id })}
                    >
                      Encerrar
                    </Button>
                    <ButtonLink to={`/eventos/${row.slug}`} size="sm" variant="outline" tone="ink">
                      Ver no site
                    </ButtonLink>
                  </>
                )}

                {canCancel && row.status !== "cancelled" && row.status !== "finished" && (
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
    </AdminPage>
  )
}
