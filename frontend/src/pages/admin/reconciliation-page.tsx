import { Clock, LinkIcon, TriangleAlert } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { TYPE_LABEL } from "../../components/admin/transaction-labels"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { TransactionActionDialog } from "../../components/admin/transaction-action-dialog"
import { Button } from "../../components/ui/button"
import { Prose } from "../../components/ui/prose"
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
      description="Pagamentos que ficaram no meio do caminho. Nada aqui é corrigido sozinho: a tela mostra o que travou e deixa a decisão com você."
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
            hint="A transação foi gravada, mas o checkout nunca chegou a existir. Nada foi cobrado."
          />
          <StatTile
            icon={Clock}
            label={`Paradas há ${STALE_DAYS}+ dias`}
            value={String(stale.length)}
            hint="Têm link de pagamento e continuam pendentes. Podem ser boletos ainda não compensados."
          />
          <StatTile
            icon={TriangleAlert}
            label="Aguardando gateway"
            value={String(awaiting.data.total)}
            hint="O gateway avisou que está processando e ainda não deu a palavra final."
          />
        </div>
      )}

      <section aria-labelledby="orfaos" className="flex flex-col gap-4">
        <div>
          <h2 id="orfaos" className="font-display text-xl font-bold">
            Sem link de pagamento
          </h2>
          <Prose className="mt-2 text-sm sm:text-base">
            <p>
              A transação é gravada antes da chamada ao gateway, de propósito, porque uma chamada de
              rede não pode segurar uma trava de linha no banco. Quando o gateway falha exatamente
              nesse intervalo, sobra este registro: um pedido sem cobrança nenhuma associada.
            </p>
          </Prose>
        </div>

        {pending.data && orphans.length === 0 && (
          <StateMessage
            title="Nenhum pedido órfão"
            description="Todo pedido pendente tem um link de pagamento associado. É o estado saudável desta lista."
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
          <Prose className="mt-2 text-sm sm:text-base">
            <p>
              Estas têm link de pagamento e continuam pendentes. Boleto demora a compensar, então
              idade sozinha não é defeito, mas passar de uma semana costuma significar que o
              pagamento não vai acontecer.
            </p>
          </Prose>
        </div>

        {pending.data && stale.length === 0 && (
          <StateMessage
            title="Nada parado"
            description="Nenhum pedido pendente passou do prazo. Não há o que reconciliar por aqui hoje."
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

      <section aria-labelledby="parcial" className="rounded-card border border-alert/50 bg-alert/10 p-6">
        <h2 id="parcial" className="font-display text-lg font-bold">
          Devolução parcial ainda não aparece aqui
        </h2>
        <Prose className="mt-2 text-sm sm:text-base">
          <p>
            Quando o gateway informa um estorno parcial, o webhook responde que aquilo precisa de
            reconciliação manual, e ninguém lê essa resposta: ela fica no log do servidor. Tratar
            devolução parcial como estorno total seria pior, porque devolveria à campanha um valor
            que não voltou ao doador.
          </p>
          <p>
            Até o backend registrar esse caso numa tabela, a conferência é feita no painel do Stripe.
            É a única lacuna desta tela, e ela está declarada de propósito em vez de disfarçada.
          </p>
        </Prose>
      </section>

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
