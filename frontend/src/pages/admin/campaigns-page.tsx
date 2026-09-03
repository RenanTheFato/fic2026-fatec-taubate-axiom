import { Megaphone, Target } from "lucide-react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { CampaignProgress } from "../../components/campaign/campaign-progress"
import { Badge } from "../../components/ui/badge"
import type { BadgeTone } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useAllCampaigns, useCatalogAction } from "../../hooks/use-admin-catalog"
import { useSession } from "../../hooks/use-session"
import type { CampaignStatus } from "../../types/campaign-types"
import { formatCurrency, formatDate } from "../../utils/format"

const STATUS: Record<CampaignStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Rascunho", tone: "alert" },
  active: { label: "Ativa", tone: "success" },
  finished: { label: "Encerrada", tone: "institutional" },
  cancelled: { label: "Cancelada", tone: "primary" },
}

// Só campanha `active` recebe transação nova, porque o backend recusa as outras. Por
// isso publicar não é detalhe de exibição: é o que liga a campanha ao caixa.
export default function CampaignsPage() {
  const { user } = useSession()
  const { data, isPending, isError, refetch } = useAllCampaigns()
  const action = useCatalogAction()

  const canCancel = user?.role === "admin"

  return (
    <AdminPage
      title="Campanhas"
      description="Uma campanha dá destino à doação e mostra a meta subindo no site. Só campanha ativa recebe transação nova, então publicar é o que abre o caixa dela."
    >
      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile
            icon={Megaphone}
            label="Cadastradas"
            value={String(data.length)}
            hint="Inclui rascunho e encerrada, que o site público não mostra."
          />
          <StatTile
            icon={Target}
            label="Ativas"
            value={String(data.filter((campaign) => campaign.status === "active").length)}
            hint="As únicas que aparecem em /doe-agora e aceitam doação destinada."
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
          description="A criação de campanha ainda acontece pela API. Assim que a primeira existir, ela aparece aqui com meta, arrecadação e os controles de publicação."
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

              {campaign.description && (
                <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{campaign.description}</p>
              )}

              <CampaignProgress campaign={campaign} />

              <p className="text-xs text-ink-soft">
                Meta de {formatCurrency(campaign.goal_amount)}
              </p>

              <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-4">
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

                {canCancel && campaign.status !== "cancelled" && campaign.status !== "finished" && (
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

                {campaign.status === "active" && (
                  <ButtonLink to={`/doe-agora?campanha=${campaign.id}`} size="sm" variant="outline" tone="ink">
                    Ver no site
                  </ButtonLink>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  )
}
