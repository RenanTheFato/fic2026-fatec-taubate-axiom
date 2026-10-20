import { Megaphone, Plus, Target } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { CampaignEditor } from "../../components/admin/campaign-editor"
import { ConfirmDialog } from "../../components/admin/confirm-dialog"
import { CampaignProgress } from "../../components/campaign/campaign-progress"
import { Badge } from "../../components/ui/badge"
import type { BadgeTone } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useAllCampaigns, useCatalogAction } from "../../hooks/use-admin-catalog"
import { useDeleteFromCatalog } from "../../hooks/use-catalog-editor"
import { useSession } from "../../hooks/use-session"
import type { Campaign, CampaignStatus } from "../../types/campaign-types"
import { formatDate } from "../../utils/format"

const STATUS: Record<CampaignStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Rascunho", tone: "alert" },
  active: { label: "Ativa", tone: "success" },
  finished: { label: "Encerrada", tone: "institutional" },
  cancelled: { label: "Cancelada", tone: "primary" },
}

type Editing = { mode: "new" } | { mode: "edit"; campaign: Campaign } | null

// Só campanha `active` recebe transação nova, porque o backend recusa as outras. Por
// isso publicar não é detalhe de exibição: é o que liga a campanha ao caixa.
//
// Editar vale para rascunho e campanha no ar. Excluir é só da administração e
// só do rascunho, que nunca esteve no site; o que já esteve sai por
// encerramento ou cancelamento, que guardam o histórico.
export default function CampaignsPage() {
  const { user } = useSession()
  const { data, isPending, isError, refetch } = useAllCampaigns()
  const action = useCatalogAction()
  const removal = useDeleteFromCatalog()
  const [editing, setEditing] = useState<Editing>(null)
  const [removing, setRemoving] = useState<Campaign | null>(null)
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

  return (
    <AdminPage
      title="Campanhas"
      action={
        editing === null && (
          <Button size="sm" onClick={() => open({ mode: "new" })}>
            <Plus className="size-4" aria-hidden="true" />
            Nova campanha
          </Button>
        )
      }
    >
      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile
            icon={Megaphone}
            label="Cadastradas"
            value={String(data.length)}
            hint="Inclui rascunhos e encerradas"
          />
          <StatTile
            icon={Target}
            label="Ativas"
            value={String(data.filter((campaign) => campaign.status === "active").length)}
            hint="Recebendo doações"
          />
        </div>
      )}

      {notice && <StateMessage title="Pronto" description={notice} />}

      {editing && (
        <CampaignEditor
          key={editing.mode === "edit" ? editing.campaign.id : "nova"}
          campaign={editing.mode === "edit" ? editing.campaign : undefined}
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
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <StateMessage
          tone="error"
          title="As campanhas não carregaram"
          description="Não conseguimos buscar as campanhas agora."
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
          title="Nenhuma campanha cadastrada"
          description="Nenhuma campanha cadastrada."
          action={
            <Button size="sm" onClick={() => open({ mode: "new" })}>
              Nova campanha
            </Button>
          }
        />
      )}

      {data && data.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.map((campaign) => (
            <li key={campaign.id} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold">{campaign.title}</h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    {formatDate(campaign.starts_at)}
                    {campaign.ends_at ? `, até ${formatDate(campaign.ends_at)}` : ""}
                  </p>
                </div>
                <Badge tone={STATUS[campaign.status].tone}>{STATUS[campaign.status].label}</Badge>
              </div>

              {/* Duas linhas reservadas, com ou sem texto: é o que deixa a barra de
                  meta de dois cartões vizinhos na mesma altura. */}
              <p className="line-clamp-2 min-h-[2lh] text-sm leading-relaxed text-ink-soft">
                {campaign.description ?? "Sem descrição cadastrada."}
              </p>

              <CampaignProgress campaign={campaign} />

              <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
                {(campaign.status === "draft" || campaign.status === "active") && (
                  <Button size="sm" variant="outline" tone="ink" onClick={() => open({ mode: "edit", campaign })}>
                    Editar
                  </Button>
                )}

                {campaign.status === "draft" && (
                  <Button
                    size="sm"
                    disabled={action.isPending}
                    onClick={() => action.mutate({ domain: "campaign", action: "publish", id: campaign.id })}
                  >
                    Publicar
                  </Button>
                )}

                {campaign.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    tone="ink"
                    disabled={action.isPending}
                    onClick={() => action.mutate({ domain: "campaign", action: "finish", id: campaign.id })}
                  >
                    Encerrar
                  </Button>
                )}

                {/* Rascunho não se cancela: ele nunca esteve no ar, então sai
                    por exclusão e não deixa registro de algo que não houve. */}
                {isAdmin && campaign.status === "draft" && (
                  <Button size="sm" variant="outline" tone="primary" onClick={() => setRemoving(campaign)}>
                    Excluir
                  </Button>
                )}

                {isAdmin && campaign.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    tone="primary"
                    disabled={action.isPending}
                    onClick={() => action.mutate({ domain: "campaign", action: "cancel", id: campaign.id })}
                  >
                    Cancelar
                  </Button>
                )}

                {(campaign.status === "active" || campaign.status === "finished") && (
                  <ButtonLink to={`/campanhas/${campaign.slug}`} size="sm" variant="outline" tone="ink">
                    Ver no site
                  </ButtonLink>
                )}

                {/* A pasta de certificados da campanha: é por aqui que a equipe dá a
                    cara do Natal ao certificado do Natal. */}
                <ButtonLink
                  to={`/admin/comunicacao/certificados?pasta=${encodeURIComponent(`campaign:${campaign.id}`)}`}
                  size="sm"
                  variant="outline"
                  tone="ink"
                >
                  Certificado
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      )}

      {removing && (
        <ConfirmDialog
          title={`Excluir "${removing.title}"?`}
          consequence="O rascunho é apagado de vez. Ele nunca esteve no site, então nenhum link deixa de funcionar."
          confirmLabel="Excluir rascunho"
          pending={removal.isPending}
          error={removal.isError ? (removal.error instanceof CheckoutError ? removal.error.message : "Não conseguimos falar com o servidor. Nada foi apagado.") : null}
          onClose={closeRemoval}
          onConfirm={() =>
            removal.mutate(
              { domain: "campaign", id: removing.id },
              {
                onSuccess: () => {
                  setNotice(`"${removing.title}" foi excluída.`)
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
