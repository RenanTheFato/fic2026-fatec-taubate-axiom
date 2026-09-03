import { Download, FileCheck2, Link2Off, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { TYPE_LABEL } from "../../components/admin/transaction-labels"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { env } from "../../config/env"
import { useAdminReceipts } from "../../hooks/use-admin-catalog"
import type { AdminReceipt } from "../../services/admin/list-receipts-service"
import { formatCurrency, formatDate } from "../../utils/format"

// A corrente vista de dentro. Cada recibo carrega o hash do anterior, e a
// listagem vem da maior sequence para a menor, que é a ordem em que a corrente
// cresceu, de trás para a frente.
//
// Recibo cancelado continua na lista: ele não é apagado, porque apagar um elo
// romperia todos os que vieram depois. Ele fica autêntico e sem valor, que é um
// desfecho próprio e é assim que a conferência pública o classifica.
export default function ReceiptsPage() {
  const [page, setPage] = useState(1)
  const { data, isPending, isError, refetch } = useAdminReceipts(page)

  const columns: Column<AdminReceipt>[] = [
    { key: "number", header: "Número", primary: true, nowrap: true, cell: (row) => row.number },
    { key: "donor", header: "Doador", cell: (row) => row.donor_name },
    { key: "type", header: "Tipo", hideBelow: "xl", nowrap: true, cell: (row) => TYPE_LABEL[row.transaction_type] },
    { key: "issued", header: "Emitido em", hideBelow: "xl", nowrap: true, cell: (row) => formatDate(row.issued_at) },
    {
      key: "status",
      header: "Situação",
      cell: (row) =>
        row.status === "issued" ? (
          <Badge tone="success">Válido</Badge>
        ) : (
          <Badge tone="institutional">Cancelado</Badge>
        ),
    },
    {
      key: "amount",
      header: "Valor",
      align: "right",
      cell: (row) => <span className="font-display font-bold">{formatCurrency(row.amount)}</span>,
    },
  ]

  const pages = data ? Math.max(Math.ceil(data.total / 20), 1) : 1
  const cancelled = data ? data.receipts.filter((receipt) => receipt.status === "cancelled").length : 0

  return (
    <AdminPage
      title="Recibos"
      description="Os documentos emitidos pela associação, na ordem da corrente. Nenhum recibo é apagado: cancelar mantém o elo e tira a validade."
    >
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            icon={FileCheck2}
            label="Emitidos"
            value={String(data.total)}
            hint="Total de documentos na corrente, desde o primeiro."
          />
          <StatTile
            icon={ShieldCheck}
            label="Último número"
            value={data.receipts[0]?.number ?? "nenhum ainda"}
            hint="A numeração não reinicia a cada ano: a corrente só admite uma sequência."
          />
          <StatTile
            icon={Link2Off}
            label="Cancelados nesta página"
            value={String(cancelled)}
            hint="Continuam autênticos e deixaram de valer. Vêm de um estorno."
          />
        </div>
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
          description="Não conseguimos buscar os recibos agora."
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

      {data && data.receipts.length === 0 && (
        <StateMessage
          title="Nenhum recibo emitido ainda"
          description="O recibo nasce dentro da confirmação de um pagamento, nunca por fora. É isso que impede um documento existir sem cobrança confirmada."
        />
      )}

      {data && data.receipts.length > 0 && (
        <div className="rounded-card border-line bg-surface lg:border lg:p-2">
          <DataList
            caption="Recibos emitidos pela associação"
            columns={columns}
            rows={data.receipts}
            rowKey={(row) => row.id}
            breakpoint="lg"
            actions={(row) => (
              <>
                <ButtonLink to={`/recibo/verificar?codigo=${row.hash}`} size="sm" variant="outline" tone="ink">
                  Conferir
                </ButtonLink>
                <ButtonLink
                  to={`${env.apiUrl}/receipt/download/${row.hash}`}
                  external
                  size="sm"
                  variant="outline"
                  tone="ink"
                >
                  <Download className="size-4" aria-hidden="true" />
                  PDF
                </ButtonLink>
              </>
            )}
          />
        </div>
      )}

      {data && pages > 1 && (
        <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
          <Button size="sm" variant="outline" tone="ink" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <p className="text-sm text-ink-soft">
            Página {page} de {pages}
          </p>
          <Button size="sm" variant="outline" tone="ink" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </nav>
      )}
    </AdminPage>
  )
}
