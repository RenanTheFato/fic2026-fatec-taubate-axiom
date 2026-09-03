import { campaignProgress } from "../../services/campaign/list-campaigns-service"
import type { Campaign } from "../../types/campaign-types"
import { formatCurrency } from "../../utils/format"

type CampaignProgressProps = {
  campaign: Campaign
  /** Em faixa escura o texto de apoio precisa clarear, senão some no fundo. */
  tone?: "light" | "dark"
}

// A barra é decorativa: o número já está escrito ao lado em texto. Por isso ela
// é `aria-hidden` e o dado é anunciado uma vez só, em vez de duas.
export function CampaignProgress({ campaign, tone = "light" }: CampaignProgressProps) {
  const percentage = campaignProgress(campaign)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className={tone === "dark" ? "text-sm text-white/80" : "text-sm text-ink-soft"}>
          <span className="font-display text-base font-extrabold text-primary">
            {formatCurrency(campaign.raised_amount)}
          </span>{" "}
          de {formatCurrency(campaign.goal_amount)}
        </p>
        <p className={tone === "dark" ? "text-sm font-bold text-reward" : "text-sm font-bold text-ink-soft"}>
          {percentage}%
        </p>
      </div>

      <div
        aria-hidden="true"
        className={tone === "dark" ? "h-2.5 w-full rounded-pill bg-white/20" : "h-2.5 w-full rounded-pill bg-line"}
      >
        <div
          className="h-full rounded-pill bg-primary transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
