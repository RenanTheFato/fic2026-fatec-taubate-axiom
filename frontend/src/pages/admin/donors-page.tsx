import { ShieldAlert, Users } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useAdminDonors } from "../../hooks/use-admin-catalog"
import type { AdminDonor } from "../../services/admin/list-donors-service"
import { formatDate } from "../../utils/format"

// Dado pessoal de doador não sai desta metade do sistema: nenhuma tela pública
// mostra nome, documento ou telefone de quem doou. Aqui eles aparecem porque é
// a equipe financeira que precisa emitir e conferir recibo.
//
// O documento é mascarado mesmo aqui. Quem precisa do número completo tem o
// recibo; uma listagem de tela aberta numa sala com outras pessoas não precisa.
function maskDocument(document: string | null): string {
  if (!document) return "não informado"
  if (document.length <= 4) return "•".repeat(document.length)

  return `${"•".repeat(document.length - 4)}${document.slice(-4)}`
}

export default function DonorsPage() {
  const [page, setPage] = useState(1)
  const { data, isPending, isError, refetch } = useAdminDonors(page)

  const columns: Column<AdminDonor>[] = [
    { key: "name", header: "Nome", primary: true, cell: (row) => row.name },
    { key: "email", header: "E-mail", cell: (row) => <span className="min-w-0 break-all">{row.email}</span> },
    {
      key: "document",
      header: "Documento",
      hideBelow: "lg",
      cell: (row) => (
        <span className="font-mono text-xs">
          {maskDocument(row.document)}
          {row.document_type && <span className="ml-2 text-ink-soft uppercase">{row.document_type}</span>}
        </span>
      ),
    },
    { key: "since", header: "Desde", hideBelow: "lg", nowrap: true, cell: (row) => formatDate(row.created_at) },
    {
      key: "status",
      header: "Situação",
      cell: (row) =>
        row.anonymized_at ? <Badge tone="institutional">Anonimizado</Badge> : <Badge tone="success">Ativo</Badge>,
    },
  ]

  const pages = data ? Math.max(Math.ceil(data.total / 20), 1) : 1

  return (
    <AdminPage
      title="Doadores"
      description="Quem já doou, comprou ou patrocinou. Estes dados existem para emitir e conferir recibo, e não saem desta metade do sistema."
    >
      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile
            icon={Users}
            label="Cadastrados"
            value={String(data.total)}
            hint="Um cadastro por pessoa ou empresa, reaproveitado a cada nova transação."
          />
          <StatTile
            icon={ShieldAlert}
            label="Documento"
            value="Mascarado"
            hint="A listagem nunca mostra o número inteiro. O documento completo fica no recibo emitido."
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
          description="Não conseguimos buscar os doadores agora."
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

      {data && data.donors.length === 0 && (
        <StateMessage
          title="Nenhum doador cadastrado"
          description="O cadastro nasce junto com a primeira doação: o formulário público coleta os dados antes do pagamento, porque o recibo sai no nome de quem declara."
        />
      )}

      {data && data.donors.length > 0 && (
        <div className="rounded-card border-line bg-surface md:border md:p-2">
          <DataList
            caption="Doadores cadastrados"
            columns={columns}
            rows={data.donors}
            rowKey={(row) => row.id}
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
