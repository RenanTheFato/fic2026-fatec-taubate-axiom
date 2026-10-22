import { Plus } from "lucide-react"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AdminPage } from "../../components/admin/admin-ui"
import { ConfirmDialog } from "../../components/admin/confirm-dialog"
import { PartnerReviewStatus } from "../../components/partner/partner-review-status"
import { PAYABLE_KINDS, PAYMENT_STATUS, PROPOSAL_KIND, PROPOSAL_STATUS } from "../../components/partner/partner-labels"
import { ProposalEditor } from "../../components/partner/proposal-editor"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useMyProposals, usePartnerProfile, usePayProposal, useWithdrawProposal } from "../../hooks/use-partner-panel"
import type { MyProposal } from "../../types/partner-types"
import { formatCurrency, formatDate } from "../../utils/format"
import { redirectTo } from "../../utils/redirect"

function target(proposal: MyProposal): string | null {
  if (proposal.event) return `Evento ${proposal.event.title}`
  if (proposal.campaign) return `Campanha ${proposal.campaign.title}`

  return null
}

function payable(proposal: MyProposal): boolean {
  return proposal.status === "accepted"
    && PAYABLE_KINDS.includes(proposal.kind)
    && (!proposal.payment || ["pending", "cancelled", "refused"].includes(proposal.payment.status))
}

type ProposalCardProps = {
  proposal: MyProposal
  busy: boolean
  onWithdraw: (proposal: MyProposal) => void
  onPay: (proposal: MyProposal) => void
}

function ProposalCard({ proposal, busy, onWithdraw, onPay }: ProposalCardProps) {
  const kind = PROPOSAL_KIND[proposal.kind]
  const status = PROPOSAL_STATUS[proposal.status]
  const destination = target(proposal)

  return (
    <li className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-partner-dark">
          <kind.icon className="size-4" aria-hidden="true" />
          {kind.label}
        </span>
        <Badge tone={status.tone}>{status.label}</Badge>
        {proposal.payment && <Badge tone={PAYMENT_STATUS[proposal.payment.status].tone}>{PAYMENT_STATUS[proposal.payment.status].label}</Badge>}
        <span className="text-xs text-ink-soft sm:ml-auto">Enviada em {formatDate(proposal.created_at)}</span>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-bold break-words">{proposal.title}</h2>
        <p className="text-sm text-ink-soft">
          {[proposal.amount ? formatCurrency(proposal.amount) : null, destination].filter(Boolean).join(" · ")}
        </p>
      </div>

      <p className="text-sm leading-relaxed break-words whitespace-pre-line">{proposal.description}</p>

      {proposal.response_note && (
        <div className="rounded-tile bg-surface-muted p-3 text-sm">
          <p className="font-display text-xs font-bold tracking-wide text-ink-soft uppercase">Resposta da associação</p>
          <p className="mt-1 leading-relaxed">{proposal.response_note}</p>
        </div>
      )}

      {(proposal.status === "pending" || payable(proposal)) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {payable(proposal) && (
            <Button size="sm" tone="partner" disabled={busy} onClick={() => onPay(proposal)}>
              Pagar agora
            </Button>
          )}
          {proposal.status === "pending" && (
            <Button size="sm" variant="outline" tone="ink" disabled={busy} onClick={() => onWithdraw(proposal)}>
              Retirar proposta
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

// As propostas da empresa: sugerir campanhas, aportes, patrocínios, doação de
// produtos e serviços e voluntariado da equipe, e acompanhar a resposta de cada
// uma. O aporte aceito é pago daqui, pelo mesmo checkout de qualquer doação.
export default function PartnerProposalsPage() {
  const [params, setParams] = useSearchParams()
  const profile = usePartnerProfile()
  const approved = profile.data?.status === "approved"
  const proposals = useMyProposals(approved)
  const withdraw = useWithdrawProposal()
  const pay = usePayProposal()
  const [withdrawing, setWithdrawing] = useState<MyProposal | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const editing = approved && params.get("nova") === "1"

  function openEditor(open: boolean) {
    setParams(open ? { nova: "1" } : {}, { replace: true })
  }

  async function startPayment(proposal: MyProposal) {
    const payment = await pay.mutateAsync(proposal.id).catch(() => null)

    if (payment?.checkout_url) redirectTo(payment.checkout_url)
  }

  function closeWithdraw() {
    setWithdrawing(null)
    withdraw.reset()
  }

  return (
    <AdminPage
      title="Propostas"
      action={
        approved && !editing && (
          <Button
            size="sm"
            tone="partner"
            onClick={() => {
              setNotice(null)
              openEditor(true)
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova proposta
          </Button>
        )
      }
    >
      {profile.isPending && <Skeleton className="h-40 w-full" />}

      {profile.isError && (
        <StateMessage
          tone="error"
          title="As propostas não carregaram"
          description="Não conseguimos buscar o cadastro da empresa agora."
          action={
            <button type="button" onClick={() => profile.refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {profile.data && !approved && <PartnerReviewStatus partner={profile.data} />}

      {notice && <StateMessage title="Pronto" description={notice} />}

      {editing && (
        <ProposalEditor
          onCancel={() => openEditor(false)}
          onDone={(message) => {
            openEditor(false)
            setNotice(message)
          }}
        />
      )}

      {pay.isError && (
        <StateMessage
          tone="error"
          title="O pagamento não abriu"
          description={pay.error instanceof CheckoutError ? pay.error.message : "Não conseguimos falar com o servidor. Nada foi cobrado."}
        />
      )}

      {approved && proposals.isPending && <Skeleton className="h-60 w-full" />}

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

      {proposals.data && proposals.data.length === 0 && <StateMessage title="Nenhuma proposta enviada" description="Use Nova proposta para sugerir uma campanha, um aporte ou um patrocínio." />}

      {proposals.data && proposals.data.length > 0 && (
        <ul className="flex flex-col gap-4">
          {proposals.data.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} busy={pay.isPending || withdraw.isPending} onWithdraw={setWithdrawing} onPay={startPayment} />
          ))}
        </ul>
      )}

      {withdrawing && (
        <ConfirmDialog
          title={`Retirar "${withdrawing.title}"?`}
          consequence="A proposta sai da fila da associação e não pode voltar. Para sugerir de novo, é preciso enviar outra."
          confirmLabel="Retirar proposta"
          pending={withdraw.isPending}
          error={withdraw.isError ? (withdraw.error instanceof CheckoutError ? withdraw.error.message : "Não conseguimos falar com o servidor. Nada foi alterado.") : null}
          onClose={closeWithdraw}
          onConfirm={() =>
            withdraw.mutate(withdrawing.id, {
              onSuccess: () => {
                setNotice(`"${withdrawing.title}" foi retirada.`)
                closeWithdraw()
              },
            })
          }
        />
      )}
    </AdminPage>
  )
}
