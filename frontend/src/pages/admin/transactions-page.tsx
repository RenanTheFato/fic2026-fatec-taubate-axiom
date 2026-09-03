import { Coins, ListFilter, Receipt } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile, TransactionStatusBadge } from "../../components/admin/admin-ui"
import { STATUS_LABEL, TYPE_LABEL } from "../../components/admin/transaction-labels"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { TransactionActionDialog } from "../../components/admin/transaction-action-dialog"
import { Button } from "../../components/ui/button"
import { Field, SelectInput } from "../../components/ui/field"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useAdminTransactions } from "../../hooks/use-admin-transactions"
import { useSession } from "../../hooks/use-session"
import { PAGE_SIZE, sumConfirmed } from "../../services/admin/list-transactions-service"
import type { AdminTransaction, TransactionFilters } from "../../services/admin/list-transactions-service"
import type { TransactionAction } from "../../services/admin/transaction-actions-service"
import type { TransactionStatus, TransactionType } from "../../types/transaction-types"
import { formatCurrency, formatDate } from "../../utils/format"

const STATUSES: TransactionStatus[] = [
  "pending",
  "awaiting_confirmation",
  "confirmed",
  "refused",
  "cancelled",
  "refunded",
]

const TYPES: TransactionType[] = ["donation", "sponsorship", "ticket", "product"]

// Que ações fazem sentido a partir de cada estado. É o mesmo que o backend
// aceita, porque oferecer um botão que a API vai recusar é fazer a pessoa descobrir a
// regra pelo erro.
function availableActions(status: TransactionStatus): TransactionAction[] {
  if (status === "pending" || status === "awaiting_confirmation") return ["confirm", "refuse", "cancel"]
  if (status === "confirmed") return ["refund"]

  return []
}

export default function TransactionsPage() {
  const { user } = useSession()
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1 })
  const [dialog, setDialog] = useState<{ action: TransactionAction; transaction: AdminTransaction } | null>(null)

  const { data, isPending, isError, refetch } = useAdminTransactions(filters)

  // O estorno vive na interface do papel `finance`. A separação é deliberada:
  // quem administra o sistema não é necessariamente quem responde pelo caixa.
  const canRefund = user?.role === "finance"

  const columns: Column<AdminTransaction>[] = [
    {
      key: "donor",
      header: "Doador",
      primary: true,
      cell: (row) => row.donor?.name ?? "não identificado",
    },
    {
      key: "type",
      header: "Tipo",
      cell: (row) => TYPE_LABEL[row.type],
    },
    {
      key: "destination",
      header: "Destino",
      hideBelow: "lg",
      cell: (row) => row.campaign?.title ?? row.event?.title ?? "Caixa geral",
    },
    {
      key: "date",
      header: "Data",
      hideBelow: "lg",
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "status",
      header: "Situação",
      cell: (row) => <TransactionStatusBadge status={row.status} />,
    },
    {
      key: "amount",
      header: "Valor",
      align: "right",
      cell: (row) => <span className="font-display font-bold">{formatCurrency(row.amount)}</span>,
    },
  ]

  const pages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1
  const page = filters.page ?? 1

  function update(patch: Partial<TransactionFilters>) {
    setFilters((current) => ({ ...current, ...patch, page: 1 }))
  }

  return (
    <AdminPage
      title="Transações"
      description="Todo movimento do caixa: doação, patrocínio, convite e venda. Confirmar ou estornar aqui altera arrecadação, vaga e estoque, além de emitir ou cancelar um recibo."
    >
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            icon={ListFilter}
            label="Resultado do filtro"
            value={String(data.total)}
            hint="Transações que atendem aos filtros aplicados, em todas as páginas."
          />
          <StatTile
            icon={Coins}
            label="Soma desta página"
            value={formatCurrency(sumConfirmed(data.transactions))}
            hint="Soma das confirmadas listadas nesta página. Não é o relatório do período, porque a API devolve linhas e não somas."
          />
          <StatTile
            icon={Receipt}
            label="Página"
            value={`${page} de ${pages}`}
            hint={`${PAGE_SIZE} transações por página, da mais recente para a mais antiga.`}
          />
        </div>
      )}

      <div className="grid gap-4 rounded-card border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="filtro-status" label="Situação">
          {(control) => (
            <SelectInput
              {...control}
              value={filters.status ?? ""}
              onChange={(event) => update({ status: (event.target.value || undefined) as TransactionStatus })}
            >
              <option value="">Todas</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field id="filtro-tipo" label="Tipo">
          {(control) => (
            <SelectInput
              {...control}
              value={filters.type ?? ""}
              onChange={(event) => update({ type: (event.target.value || undefined) as TransactionType })}
            >
              <option value="">Todos</option>
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field id="filtro-de" label="De">
          {(control) => (
            <input
              {...control}
              type="date"
              value={filters.from ?? ""}
              onChange={(event) => update({ from: event.target.value || undefined })}
              className="min-h-12 w-full rounded-tile border-2 border-line bg-surface px-4 py-3 text-base"
            />
          )}
        </Field>

        <Field id="filtro-ate" label="Até">
          {(control) => (
            <input
              {...control}
              type="date"
              value={filters.to ?? ""}
              onChange={(event) => update({ to: event.target.value || undefined })}
              className="min-h-12 w-full rounded-tile border-2 border-line bg-surface px-4 py-3 text-base"
            />
          )}
        </Field>
      </div>

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
          description="Não conseguimos buscar as transações agora."
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

      {data && data.transactions.length === 0 && (
        <StateMessage
          title="Nenhuma transação com esses filtros"
          description="Nada foi encontrado para a combinação escolhida. Limpe os filtros para ver o movimento completo."
          action={
            <Button size="sm" variant="outline" tone="ink" onClick={() => setFilters({ page: 1 })}>
              Limpar filtros
            </Button>
          }
        />
      )}

      {data && data.transactions.length > 0 && (
        <div className="rounded-card border-line bg-surface lg:border lg:p-2">
          <DataList
            caption="Transações da associação"
            columns={columns}
            rows={data.transactions}
            rowKey={(row) => row.id}
            breakpoint="lg"
            actions={(row) => {
              const actions = availableActions(row.status).filter(
                (action) => action !== "refund" || canRefund,
              )

              if (actions.length === 0) {
                return <span className="text-xs text-ink-soft">sem ação disponível</span>
              }

              return (
                <>
                  {actions.map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant="outline"
                      tone={action === "refund" || action === "refuse" ? "primary" : "ink"}
                      onClick={() => setDialog({ action, transaction: row })}
                    >
                      {action === "confirm" ? "Confirmar" : action === "refuse" ? "Recusar" : action === "cancel" ? "Cancelar" : "Estornar"}
                    </Button>
                  ))}
                </>
              )
            }}
          />
        </div>
      )}

      {data && pages > 1 && (
        <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="outline"
            tone="ink"
            disabled={page <= 1}
            onClick={() => setFilters((current) => ({ ...current, page: page - 1 }))}
          >
            Anterior
          </Button>
          <p className="text-sm text-ink-soft">
            Página {page} de {pages}
          </p>
          <Button
            size="sm"
            variant="outline"
            tone="ink"
            disabled={page >= pages}
            onClick={() => setFilters((current) => ({ ...current, page: page + 1 }))}
          >
            Próxima
          </Button>
        </nav>
      )}

      {dialog && (
        <TransactionActionDialog
          action={dialog.action}
          transaction={dialog.transaction}
          onClose={() => setDialog(null)}
        />
      )}
    </AdminPage>
  )
}
