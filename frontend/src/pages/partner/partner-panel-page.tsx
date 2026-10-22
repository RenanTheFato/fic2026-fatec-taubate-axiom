import { CircleCheck, FileText, HandCoins, Hourglass, Loader2, Plus, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { PartnerReviewStatus } from "../../components/partner/partner-review-status"
import { PAYABLE_KINDS, PAYMENT_STATUS, PROPOSAL_KIND } from "../../components/partner/partner-labels"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { env } from "../../config/env"
import { CheckoutError } from "../../config/errors"
import { useMyProposals, usePartnerProfile, usePayProposal } from "../../hooks/use-partner-panel"
import type { MyProposal, PartnerProfile } from "../../types/partner-types"
import { formatCurrency, formatDate } from "../../utils/format"
import { redirectTo } from "../../utils/redirect"

function target(proposal: MyProposal): string {
  if (proposal.event) return `Evento ${proposal.event.title}`
  if (proposal.campaign) return `Campanha ${proposal.campaign.title}`

  return "A associação como um todo"
}

// O que foi aceito e ainda não virou dinheiro: o aporte e o patrocínio que a
// empresa paga pelo mesmo checkout de qualquer doação.
function awaitingPayment(proposals: MyProposal[]): MyProposal[] {
  return proposals.filter((proposal) =>
    proposal.status === "accepted"
    && PAYABLE_KINDS.includes(proposal.kind)
    && (!proposal.payment || proposal.payment.status === "pending" || proposal.payment.status === "cancelled" || proposal.payment.status === "refused")
  )
}

function ApprovedPanel({ partner }: { partner: PartnerProfile }) {
  const proposals = useMyProposals(true)
  const pay = usePayProposal()
  const [paying, setPaying] = useState<string | null>(null)

  const toPay = proposals.data ? awaitingPayment(proposals.data) : []
  const paid = proposals.data ? proposals.data.filter((proposal) => proposal.payment?.receipt) : []
  const { summary } = partner

  async function startPayment(proposal: MyProposal) {
    setPaying(proposal.id)

    const payment = await pay.mutateAsync(proposal.id).catch(() => null)

    // O pagamento acontece no ambiente do gateway. A volta é a tela de status
    // do pedido, que só diz "confirmado" quando o webhook confirmar.
    if (payment?.checkout_url) {
      redirectTo(payment.checkout_url)
      return
    }

    setPaying(null)
  }

  return (
    <>
      <section aria-labelledby="retorno">
        <h2 id="retorno" className="sr-only">
          O retorno da parceria
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile icon={HandCoins} label="Já contribuído" value={formatCurrency(summary.contributed)} hint="Pagamentos confirmados" />
          <StatTile icon={CircleCheck} label="Propostas aceitas" value={String(summary.proposals.accepted)} />
          <StatTile icon={Hourglass} label="Em análise" value={String(summary.proposals.pending)} />
        </div>
      </section>

      {partner.review_note && (
        <aside aria-label="Recado da associação" className="rounded-card border border-partner/30 bg-partner/5 p-5">
          <p className="font-display text-xs font-bold tracking-wide text-partner-dark uppercase">Recado da associação</p>
          <p className="mt-2 text-sm leading-relaxed">{partner.review_note}</p>
        </aside>
      )}

      {pay.isError && (
        <StateMessage
          tone="error"
          title="O pagamento não abriu"
          description={pay.error instanceof CheckoutError ? pay.error.message : "Não conseguimos falar com o servidor. Nada foi cobrado."}
        />
      )}

      <section aria-labelledby="a-pagar" className="flex flex-col gap-5">
        <h2 id="a-pagar" className="font-display text-xl font-bold">
          Aceitas, aguardando pagamento
        </h2>

        {proposals.isPending && <Skeleton className="h-32 w-full" />}

        {proposals.isError && (
          <StateMessage
            tone="error"
            title="As propostas não carregaram"
            description="Não conseguimos buscar as propostas agora."
            action={
              <button type="button" onClick={() => proposals.refetch()} className="font-display font-bold text-primary underline underline-offset-4">
                Tentar de novo
              </button>
            }
          />
        )}

        {proposals.data && toPay.length === 0 && <StateMessage title="Nada a pagar" description="Aportes e patrocínios aceitos aparecem aqui para pagamento." />}

        {toPay.length > 0 && (
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
            {toPay.map((proposal) => (
              <li key={proposal.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display font-bold break-words">{proposal.title}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {PROPOSAL_KIND[proposal.kind].label} · {target(proposal)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <span className="font-display text-lg font-extrabold">{proposal.amount ? formatCurrency(proposal.amount) : ""}</span>
                  {proposal.payment && <Badge tone={PAYMENT_STATUS[proposal.payment.status].tone}>{PAYMENT_STATUS[proposal.payment.status].label}</Badge>}
                  <Button size="sm" tone="partner" disabled={pay.isPending} onClick={() => startPayment(proposal)}>
                    {paying === proposal.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                    Pagar agora
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recibos" className="flex flex-col gap-5">
        <h2 id="recibos" className="font-display text-xl font-bold">
          Recibos e certificados
        </h2>

        {proposals.data && paid.length === 0 && <StateMessage title="Nenhum recibo ainda" description="O recibo de cada aporte aparece aqui assim que o pagamento é confirmado." />}

        {paid.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2">
            {paid.map((proposal) => {
              const receipt = proposal.payment?.receipt

              if (!receipt) return null

              return (
                <li key={proposal.id} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-bold break-words">{proposal.title}</p>
                      <p className="mt-1 text-xs text-ink-soft">Recibo nº {receipt.number}</p>
                    </div>
                    <span className="shrink-0 font-display font-extrabold">{formatCurrency(proposal.payment?.amount ?? "0")}</span>
                  </div>
                  {receipt.status === "cancelled" && <Badge tone="institutional">Estornado</Badge>}
                  <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-3">
                    <ButtonLink to={`${env.apiUrl}/receipt/download/${receipt.hash}`} external size="sm" variant="outline" tone="ink">
                      <FileText className="size-4" aria-hidden="true" />
                      Recibo em PDF
                    </ButtonLink>
                    <ButtonLink to={`/certificado/${receipt.hash}`} size="sm" variant="outline" tone="ink">
                      Certificado
                    </ButtonLink>
                    <ButtonLink to={`/recibo/verificar?codigo=${receipt.hash}`} size="sm" variant="outline" tone="ink">
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      Conferir
                    </ButtonLink>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}

// O painel da empresa parceira. Antes da aprovação, mostra a situação do pedido;
// depois, o retorno da parceria: o que já entrou, o que foi aceito e espera
// pagamento, e os recibos de cada aporte, os mesmos documentos verificáveis que
// qualquer doador recebe.
export default function PartnerPanelPage() {
  const profile = usePartnerProfile()

  return (
    <AdminPage
      title={profile.data?.company_name ?? "Painel da parceria"}
      action={
        profile.data?.status === "approved" ? (
          <ButtonLink to="/parceiro/propostas?nova=1" size="sm" tone="partner">
            <Plus className="size-4" aria-hidden="true" />
            Nova proposta
          </ButtonLink>
        ) : (
          <ButtonLink to="/parceiros" variant="outline" tone="ink" size="sm">
            Ver a rede de parceiros
          </ButtonLink>
        )
      }
    >
      {profile.isPending && (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      )}

      {profile.isError && (
        <StateMessage
          tone="error"
          title="O painel não carregou"
          description="Não conseguimos buscar o cadastro da empresa agora."
          action={
            <button type="button" onClick={() => profile.refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {profile.data && profile.data.status !== "approved" && <PartnerReviewStatus partner={profile.data} />}

      {profile.data && profile.data.status === "approved" && (
        <>
          <p className="-mt-4 text-sm text-ink-soft">Parceira desde {formatDate(profile.data.reviewed_at ?? profile.data.created_at)}</p>
          <ApprovedPanel partner={profile.data} />
        </>
      )}
    </AdminPage>
  )
}
