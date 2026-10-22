import { Mail } from "lucide-react"
import { useState } from "react"
import { AdminPage } from "../../components/admin/admin-ui"
import { DecisionDialog } from "../../components/admin/decision-dialog"
import { PAYABLE_KINDS, PAYMENT_STATUS, PROPOSAL_KIND, PROPOSAL_STATUS } from "../../components/partner/partner-labels"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Field, SelectInput } from "../../components/ui/field"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { usePartnerProposals, useReviewProposal } from "../../hooks/use-admin-partners"
import { PARTNERS_PER_PAGE } from "../../services/admin/partners-service"
import type { AdminProposal, ProposalKind, ProposalStatus } from "../../types/partner-types"
import { formatCurrency, formatDate } from "../../utils/format"

const TABS: { value: ProposalStatus | null; label: string }[] = [
  { value: "pending", label: "Em análise" },
  { value: "accepted", label: "Aceitas" },
  { value: "refused", label: "Recusadas" },
  { value: null, label: "Todas" },
]

const KINDS = Object.keys(PROPOSAL_KIND) as ProposalKind[]

type Deciding = { proposal: AdminProposal; decision: "accepted" | "refused" } | null

function target(proposal: AdminProposal): string | null {
  if (proposal.event) return `Evento ${proposal.event.title}`
  if (proposal.campaign) return `Campanha ${proposal.campaign.title}`

  return null
}

// O que aceitar faz de verdade, dito antes do clique: o aporte e o patrocínio
// liberam o pagamento no painel da empresa; o resto segue pelo contato da equipe.
function acceptConsequence(proposal: AdminProposal): string {
  if (PAYABLE_KINDS.includes(proposal.kind)) {
    return `O pagamento de ${proposal.amount ? formatCurrency(proposal.amount) : "o valor proposto"} fica liberado no painel da empresa. O valor só entra na campanha quando o pagamento for confirmado, como qualquer doação.`
  }

  return "A empresa vê a proposta como aceita, com a sua nota. A combinação segue pelo contato da equipe, então diga na nota quem vai procurar a empresa."
}

// As propostas das empresas parceiras: campanhas sugeridas, aportes,
// patrocínios, doações de produtos e serviços e voluntariado de equipe. Toda
// resposta leva uma nota, que a empresa lê no painel dela.
export default function AdminPartnerProposalsPage() {
  const [status, setStatus] = useState<ProposalStatus | null>("pending")
  const [kind, setKind] = useState<ProposalKind | null>(null)
  const [page, setPage] = useState(1)
  const [deciding, setDeciding] = useState<Deciding>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = usePartnerProposals({ status, kind, page })
  const review = useReviewProposal()
  const pages = data ? Math.max(Math.ceil(data.total / PARTNERS_PER_PAGE), 1) : 1

  function closeDecision() {
    setDeciding(null)
    review.reset()
  }

  return (
    <AdminPage title="Propostas de parceiros">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div role="group" aria-label="Situação" className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Button
              key={tab.label}
              size="sm"
              variant={status === tab.value ? "solid" : "outline"}
              tone="ink"
              aria-pressed={status === tab.value}
              onClick={() => {
                setStatus(tab.value)
                setPage(1)
              }}
            >
              {tab.label}
              {tab.value === "pending" && data ? ` (${data.pending})` : ""}
            </Button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Field id="propostas-tipo" label="Tipo" hideLabel>
            {(control) => (
              <SelectInput
                {...control}
                value={kind ?? ""}
                onChange={(event) => {
                  setKind((event.target.value || null) as ProposalKind | null)
                  setPage(1)
                }}
                className="min-h-10 py-2 text-sm"
              >
                <option value="">Todos os tipos</option>
                {KINDS.map((item) => (
                  <option key={item} value={item}>
                    {PROPOSAL_KIND[item].label}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>
        </div>
      </div>

      {notice && <StateMessage title="Pronto" description={notice} />}

      {isPending && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <StateMessage
          tone="error"
          title="As propostas não carregaram"
          description="Não conseguimos buscar as propostas agora."
          action={
            <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {data && data.proposals.length === 0 && (
        <StateMessage title={status === "pending" ? "Nenhuma proposta em análise" : "Nenhuma proposta"} description={status === "pending" ? "Todas as propostas foram respondidas." : "Nenhuma proposta neste filtro."} />
      )}

      {data && data.proposals.length > 0 && (
        <ul className="flex flex-col gap-4">
          {data.proposals.map((proposal) => {
            const proposalKind = PROPOSAL_KIND[proposal.kind]
            const destination = target(proposal)

            return (
              <li key={proposal.id} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-partner-dark">
                    <proposalKind.icon className="size-4" aria-hidden="true" />
                    {proposalKind.label}
                  </span>
                  <Badge tone={PROPOSAL_STATUS[proposal.status].tone}>{PROPOSAL_STATUS[proposal.status].label}</Badge>
                  {proposal.transaction && <Badge tone={PAYMENT_STATUS[proposal.transaction.status].tone}>{PAYMENT_STATUS[proposal.transaction.status].label}</Badge>}
                  <span className="text-xs text-ink-soft sm:ml-auto">{formatDate(proposal.created_at)}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-lg font-bold break-words">{proposal.title}</h2>
                  <p className="text-sm text-ink-soft">
                    {[proposal.partner.company_name, proposal.amount ? formatCurrency(proposal.amount) : null, destination].filter(Boolean).join(" · ")}
                  </p>
                </div>

                <p className="text-sm leading-relaxed break-words whitespace-pre-line">{proposal.description}</p>

                {proposal.response_note && (
                  <p className="rounded-tile bg-surface-muted p-3 text-sm">
                    <span className="font-semibold">Resposta enviada:</span> {proposal.response_note}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  {proposal.status === "pending" ? (
                    <>
                      <Button size="sm" tone="success" onClick={() => setDeciding({ proposal, decision: "accepted" })}>
                        Aceitar
                      </Button>
                      <Button size="sm" variant="outline" tone="ink" onClick={() => setDeciding({ proposal, decision: "refused" })}>
                        Recusar
                      </Button>
                    </>
                  ) : (
                    proposal.reviewed_at && (
                      <span className="text-xs text-ink-soft">
                        Respondida em {formatDate(proposal.reviewed_at)}
                        {proposal.reviewer ? ` por ${proposal.reviewer.name}` : ""}
                      </span>
                    )
                  )}
                  {proposal.partner.user && (
                    <ButtonLink
                      to={`mailto:${proposal.partner.user.email}?subject=${encodeURIComponent(`Somos do Bem: ${proposal.title}`)}`}
                      external
                      size="sm"
                      variant="outline"
                      tone="ink"
                    >
                      <Mail className="size-4" aria-hidden="true" />
                      Escrever para a empresa
                    </ButtonLink>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
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

      {deciding && (
        <DecisionDialog
          title={deciding.decision === "accepted" ? "Aceitar a proposta?" : "Recusar a proposta?"}
          subject={`${deciding.proposal.title} · ${deciding.proposal.partner.company_name}`}
          consequence={deciding.decision === "accepted" ? acceptConsequence(deciding.proposal) : "A empresa lê o motivo no painel. A proposta não volta para a fila."}
          confirmLabel={deciding.decision === "accepted" ? "Aceitar proposta" : "Recusar proposta"}
          tone={deciding.decision === "accepted" ? "success" : "primary"}
          noteLabel={deciding.decision === "accepted" ? "Como a proposta segue" : "Motivo"}
          noteHint="A empresa lê este texto no painel."
          noteMinLength={10}
          pending={review.isPending}
          error={review.isError ? (review.error instanceof CheckoutError ? review.error.message : "Não conseguimos falar com o servidor. Nada foi alterado.") : null}
          onClose={closeDecision}
          onConfirm={(note) =>
            review.mutate(
              { id: deciding.proposal.id, decision: deciding.decision, note: note ?? "" },
              {
                onSuccess: () => {
                  setNotice(`"${deciding.proposal.title}" foi ${deciding.decision === "accepted" ? "aceita" : "recusada"}.`)
                  closeDecision()
                },
              },
            )
          }
        />
      )}
    </AdminPage>
  )
}
