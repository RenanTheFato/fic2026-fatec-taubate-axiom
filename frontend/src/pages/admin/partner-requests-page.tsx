import { Building2, Globe, Mail, Phone } from "lucide-react"
import { useState } from "react"
import { AdminPage } from "../../components/admin/admin-ui"
import { DecisionDialog } from "../../components/admin/decision-dialog"
import { INTEREST_LABEL, PARTNER_STATUS, formatCnpj } from "../../components/partner/partner-labels"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { usePartnerApplications, useReviewPartner } from "../../hooks/use-admin-partners"
import { PARTNERS_PER_PAGE } from "../../services/admin/partners-service"
import type { PartnerApplication, PartnerStatus } from "../../types/partner-types"
import { formatDate } from "../../utils/format"

const TABS: { value: PartnerStatus | null; label: string }[] = [
  { value: "pending", label: "Em análise" },
  { value: "approved", label: "Aprovadas" },
  { value: "refused", label: "Recusadas" },
  { value: null, label: "Todas" },
]

type Deciding = { partner: PartnerApplication; decision: "approved" | "refused" } | null

// Os pedidos de parceria que chegam pelo site. Aprovar libera o painel da
// empresa, onde ela sugere campanhas, aportes e patrocínios; recusar deixa o
// motivo para ela ler no painel e mandar de novo, se quiser.
export default function PartnerRequestsPage() {
  const [status, setStatus] = useState<PartnerStatus | null>("pending")
  const [page, setPage] = useState(1)
  const [deciding, setDeciding] = useState<Deciding>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = usePartnerApplications({ status, page })
  const review = useReviewPartner()
  const pages = data ? Math.max(Math.ceil(data.total / PARTNERS_PER_PAGE), 1) : 1

  function closeDecision() {
    setDeciding(null)
    review.reset()
  }

  return (
    <AdminPage title="Pedidos de parceria">
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
          title="Os pedidos não carregaram"
          description="Não conseguimos buscar os pedidos de parceria agora."
          action={
            <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {data && data.partners.length === 0 && (
        <StateMessage title={status === "pending" ? "Nenhum pedido em análise" : "Nenhum pedido"} description={status === "pending" ? "Todos os pedidos foram respondidos." : "Nenhum pedido neste filtro."} />
      )}

      {data && data.partners.length > 0 && (
        <ul className="flex flex-col gap-4">
          {data.partners.map((partner) => (
            <li key={partner.id} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={PARTNER_STATUS[partner.status].tone}>{PARTNER_STATUS[partner.status].label}</Badge>
                {partner.public_listing && <Badge tone="partner">Marca no site autorizada</Badge>}
                <span className="text-xs text-ink-soft sm:ml-auto">
                  {partner.user ? `Pedido em ${formatDate(partner.created_at)}` : "Na rede antes da plataforma"}
                </span>
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold break-words">
                  <Building2 className="size-5 shrink-0 text-partner-dark" aria-hidden="true" />
                  {partner.company_name}
                </h2>
                {partner.document && <p className="text-sm text-ink-soft">CNPJ {formatCnpj(partner.document)}</p>}
              </div>

              {partner.user && (
                <p className="flex min-w-0 flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                  <span className="font-semibold text-ink">{partner.user.name}</span>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    <span className="break-all">{partner.user.email}</span>
                  </span>
                  {partner.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-4 shrink-0" aria-hidden="true" />
                      {partner.phone}
                    </span>
                  )}
                  {partner.website && (
                    <a href={partner.website} target="_blank" rel="noreferrer noopener" className="inline-flex min-w-0 items-center gap-1.5 text-primary underline underline-offset-4">
                      <Globe className="size-4 shrink-0" aria-hidden="true" />
                      <span className="break-all">{partner.website}</span>
                    </a>
                  )}
                </p>
              )}

              {partner.interests.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Formas de apoio">
                  {partner.interests.map((interest) => (
                    <li key={interest} className="rounded-pill bg-surface-muted px-3 py-1 text-xs font-semibold">
                      {INTEREST_LABEL[interest]}
                    </li>
                  ))}
                </ul>
              )}

              {partner.message && <p className="text-sm leading-relaxed break-words whitespace-pre-line">{partner.message}</p>}

              {partner.review_note && (
                <p className="rounded-tile bg-surface-muted p-3 text-sm">
                  <span className="font-semibold">Resposta enviada:</span> {partner.review_note}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                {partner.status === "pending" ? (
                  <>
                    <Button size="sm" tone="success" onClick={() => setDeciding({ partner, decision: "approved" })}>
                      Aprovar
                    </Button>
                    <Button size="sm" variant="outline" tone="ink" onClick={() => setDeciding({ partner, decision: "refused" })}>
                      Recusar
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-ink-soft">
                    {partner.reviewed_at ? `${PARTNER_STATUS[partner.status].label} em ${formatDate(partner.reviewed_at)}` : PARTNER_STATUS[partner.status].label}
                    {partner.reviewer ? ` por ${partner.reviewer.name}` : ""}
                  </span>
                )}
                {partner.user && (
                  <ButtonLink to={`mailto:${partner.user.email}?subject=${encodeURIComponent("Somos do Bem: parceria")}`} external size="sm" variant="outline" tone="ink">
                    Escrever para a empresa
                  </ButtonLink>
                )}
              </div>
            </li>
          ))}
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
          title={deciding.decision === "approved" ? "Aprovar a parceria?" : "Recusar o pedido?"}
          subject={deciding.partner.company_name}
          consequence={
            deciding.decision === "approved"
              ? `A empresa passa a sugerir campanhas, aportes e patrocínios pelo painel dela.${deciding.partner.public_listing ? " A marca entra na rede de parceiros do site, como ela autorizou." : ""}`
              : "A empresa lê o motivo no painel e pode revisar o pedido e mandar de novo."
          }
          confirmLabel={deciding.decision === "approved" ? "Aprovar parceria" : "Recusar pedido"}
          tone={deciding.decision === "approved" ? "success" : "primary"}
          noteLabel={deciding.decision === "approved" ? "Recado para a empresa" : "Motivo"}
          noteHint={deciding.decision === "approved" ? "Aparece no painel da empresa." : "A empresa lê este texto no painel."}
          noteMinLength={deciding.decision === "approved" ? 0 : 10}
          pending={review.isPending}
          error={review.isError ? (review.error instanceof CheckoutError ? review.error.message : "Não conseguimos falar com o servidor. Nada foi alterado.") : null}
          onClose={closeDecision}
          onConfirm={(note) =>
            review.mutate(
              { id: deciding.partner.id, decision: deciding.decision, note },
              {
                onSuccess: () => {
                  setNotice(
                    deciding.decision === "approved"
                      ? `${deciding.partner.company_name} entrou na rede de parceiros.`
                      : `O pedido de ${deciding.partner.company_name} foi recusado.`,
                  )
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
