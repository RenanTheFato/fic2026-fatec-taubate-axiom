import { Clock, Info, LinkIcon, TriangleAlert } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { TYPE_LABEL } from "../../components/admin/transaction-labels"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { TransactionActionDialog } from "../../components/admin/transaction-action-dialog"
import { Button } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useAdminTransactions } from "../../hooks/use-admin-transactions"
import type { AdminTransaction } from "../../services/admin/list-transactions-service"
import type { TransactionAction } from "../../services/admin/transaction-actions-service"
import { formatCurrency, formatDate } from "../../utils/format"

// Esta tela existe por causa de dois estados órfãos conhecidos e documentados
// em `backend/corrections.md`, item F:
//
// 1. A transação é gravada **antes** da chamada ao gateway, de propósito, porque
//    rede não pode segurar trava de linha. Se o Stripe falhar ali, sobra uma
//    transação `pending` sem `checkout_url`, para sempre, porque ninguém a
//    varre.
// 2. Uma devolução parcial devolve "requires manual reconciliation" no webhook,
//    e essa resposta não é lida por ninguém: fica só no log.
//
// Enquanto não houver rotina no backend, este é o lugar onde a equipe financeira
// ao menos os enxerga. A tela não inventa correção automática: ela mostra o
// problema e oferece as ações que já existem.

const STALE_DAYS = 3

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export default function ReconciliationPage() {
  const [dialog, setDialog] = useState<{ action: TransactionAction; transaction: AdminTransaction } | null>(null)

  const pending = useAdminTransactions({ status: "pending", page: 1 })
  const awaiting = useAdminTransactions({ status: "awaiting_confirmation", page: 1 })

  const orphans = pending.data
    ? pending.data.transactions.filter((transaction) => !transaction.checkout_url)
    : []

  const stale = pending.data
    ? pending.data.transactions.filter(
      (transaction) => transaction.checkout_url !== null && daysSince(transaction.created_at) >= STALE_DAYS,
    )
    : []

  const columns: Column<AdminTransaction>[] = [
    { key: "donor", header: "Doador", primary: true, cell: (row) => row.donor?.name ?? "não identificado" },
    { key: "type", header: "Tipo", nowrap: true, cell: (row) => TYPE_LABEL[row.type] },
    {
      key: "created",
      header: "Criada em",
      nowrap: true,
      cell: (row) => `${formatDate(row.created_at)} (${daysSince(row.created_at)} d)`,
    },
    {
      key: "amount",
      header: "Valor",
      align: "right",
      cell: (row) => <span className="font-display font-bold">{formatCurrency(row.amount)}</span>,
    },
  ]

  const actions = (row: AdminTransaction) => (
    <>
      <Button size="sm" variant="outline" tone="ink" onClick={() => setDialog({ action: "confirm", transaction: row })}>
        Confirmar
      </Button>
      <Button size="sm" variant="outline" tone="primary" onClick={() => setDialog({ action: "cancel", transaction: row })}>
        Cancelar
      </Button>
    </>
  )

  const loading = pending.isPending || awaiting.isPending
  const failed = pending.isError || awaiting.isError

  return (
    <AdminPage
      title="Reconciliação"
    >
      {loading && (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      )}

      {failed && (
        <StateMessage
          tone="error"
          title="A varredura não carregou"
          description="Não conseguimos buscar as transações pendentes agora."
          action={
            <button
              type="button"
              onClick={() => {
                pending.refetch()
                awaiting.refetch()
              }}
              className="font-display font-bold text-primary underline underline-offset-4"
            >
              Tentar de novo
            </button>
          }
        />
      )}

      {pending.data && awaiting.data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            icon={LinkIcon}
            label="Sem link de pagamento"
            value={String(orphans.length)}
            hint="Nada foi cobrado"
          />
          <StatTile
            icon={Clock}
            label={`Paradas há ${STALE_DAYS}+ dias`}
            value={String(stale.length)}
            hint="Com link, ainda pendentes"
          />
          <StatTile
            icon={TriangleAlert}
            label="Aguardando gateway"
            value={String(awaiting.data.total)}
            hint="O gateway ainda processa"
          />
        </div>
      )}

      <section aria-labelledby="orfaos" className="flex flex-col gap-4">
        <div>
          <h2 id="orfaos" className="font-display text-xl font-bold">
            Sem link de pagamento
          </h2>
        </div>

        {pending.data && orphans.length === 0 && (
          <StateMessage
            title="Nenhum pedido órfão"
            description="Todo pedido pendente tem link de pagamento."
          />
        )}

        {orphans.length > 0 && (
          <div className="rounded-card border-line bg-surface lg:border lg:p-2">
            <DataList
              caption="Transações pendentes sem link de pagamento"
              columns={columns}
              rows={orphans}
              rowKey={(row) => row.id}
              breakpoint="lg"
              actions={actions}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="paradas" className="flex flex-col gap-4">
        <div>
          <h2 id="paradas" className="font-display text-xl font-bold">
            Paradas há {STALE_DAYS} dias ou mais
          </h2>
        </div>

        {pending.data && stale.length === 0 && (
          <StateMessage
            title="Nada parado"
            description="Nenhum pedido passou do prazo."
          />
        )}

        {stale.length > 0 && (
          <div className="rounded-card border-line bg-surface lg:border lg:p-2">
            <DataList
              caption="Transações pendentes há três dias ou mais"
              columns={columns}
              rows={stale}
              rowKey={(row) => row.id}
              breakpoint="lg"
              actions={actions}
            />
          </div>
        )}
      </section>

      <p role="note" className="flex items-start gap-2 rounded-tile border border-alert/50 bg-alert/10 px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-alert-dark" aria-hidden="true" />
        Devolução parcial é conferida no painel do gateway.
      </p>

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
