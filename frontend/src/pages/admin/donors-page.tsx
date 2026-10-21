import { Plus, ShieldAlert, Users } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { ConfirmDialog } from "../../components/admin/confirm-dialog"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { DonorEditor } from "../../components/admin/donor-editor"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useAdminDonors } from "../../hooks/use-admin-catalog"
import { useAnonymizeDonor } from "../../hooks/use-admin-donors"
import { useSession } from "../../hooks/use-session"
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

type Editing = { mode: "new" } | { mode: "edit"; donor: AdminDonor } | null

// Corrigir cadastro e cadastrar à mão são do Financeiro. Anonimizar é da
// administração: é o atendimento a um pedido de exclusão de dados, e não volta.
export default function DonorsPage() {
  const { user } = useSession()
  const [page, setPage] = useState(1)
  const { data, isPending, isError, refetch } = useAdminDonors(page)
  const anonymize = useAnonymizeDonor()
  const [editing, setEditing] = useState<Editing>(null)
  const [anonymizing, setAnonymizing] = useState<AdminDonor | null>(null)
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

  function closeAnonymize() {
    setAnonymizing(null)
    anonymize.reset()
  }

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
      action={
        editing === null && (
          <Button size="sm" onClick={() => open({ mode: "new" })}>
            <Plus className="size-4" aria-hidden="true" />
            Cadastrar doador
          </Button>
        )
      }
    >
      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile
            icon={Users}
            label="Cadastrados"
            value={String(data.total)}
            hint="Pessoas e empresas"
          />
          <StatTile
            icon={ShieldAlert}
            label="Documento"
            value="Mascarado"
            hint="Exibidos mascarados"
          />
        </div>
      )}

      {notice && <StateMessage title="Pronto" description={notice} />}

      {editing && (
        <DonorEditor
          key={editing.mode === "edit" ? editing.donor.id : "novo"}
          donor={editing.mode === "edit" ? editing.donor : undefined}
          onDone={finish}
          onCancel={() => setEditing(null)}
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
          description="Nenhum doador cadastrado."
        />
      )}

      {data && data.donors.length > 0 && (
        <div className="rounded-card border-line bg-surface lg:border lg:p-2">
          <DataList
            caption="Doadores cadastrados"
            columns={columns}
            rows={data.donors}
            rowKey={(row) => row.id}
            breakpoint="lg"
            actions={(row) =>
              row.anonymized_at ? null : (
                <>
                  <Button size="sm" variant="outline" tone="ink" onClick={() => open({ mode: "edit", donor: row })}>
                    Editar
                  </Button>

                  {isAdmin && (
                    <Button size="sm" variant="outline" tone="primary" onClick={() => setAnonymizing(row)}>
                      Anonimizar
                    </Button>
                  )}
                </>
              )
            }
          />
        </div>
      )}

      {anonymizing && (
        <ConfirmDialog
          title={`Anonimizar ${anonymizing.name}?`}
          consequence="Nome, e-mail, documento e telefone são apagados e não voltam. As doações continuam na contabilidade, sem ninguém atrás delas, e o nome sai do Mural do Bem."
          confirmLabel="Anonimizar"
          pending={anonymize.isPending}
          error={anonymize.isError ? (anonymize.error instanceof CheckoutError ? anonymize.error.message : "Não conseguimos falar com o servidor. Nada foi alterado.") : null}
          onClose={closeAnonymize}
          onConfirm={() =>
            anonymize.mutate(anonymizing.id, {
              onSuccess: () => {
                setNotice("Os dados pessoais foram apagados. O histórico de doações continua, anônimo.")
                closeAnonymize()
              },
            })
          }
        />
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
