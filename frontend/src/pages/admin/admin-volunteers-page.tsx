import { Mail, MapPin, Phone } from "lucide-react"
import { useState } from "react"
import { AdminPage } from "../../components/admin/admin-ui"
import { DecisionDialog } from "../../components/admin/decision-dialog"
import { AREA_LABEL, PERIOD_LABEL, VOLUNTEER_STATUS, formatHours } from "../../components/volunteer/volunteer-labels"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useReviewVolunteer, useVolunteers } from "../../hooks/use-admin-volunteers"
import { VOLUNTEERS_PER_PAGE } from "../../services/admin/volunteers-service"
import type { VolunteerApplication, VolunteerStatus } from "../../types/volunteer-types"
import { formatDate } from "../../utils/format"

const TABS: { value: VolunteerStatus | null; label: string }[] = [
  { value: "pending", label: "Em análise" },
  { value: "approved", label: "Aprovados" },
  { value: "refused", label: "Recusados" },
  { value: null, label: "Todos" },
]

type Deciding = { volunteer: VolunteerApplication; decision: "approved" | "refused" } | null

// Os cadastros de voluntariado que chegam pelo site. Aprovar põe a pessoa na
// escala: ela passa a ver os turnos abertos no painel dela. Recusar deixa o
// motivo para ela ler e mandar de novo, se quiser.
export default function AdminVolunteersPage() {
  const [status, setStatus] = useState<VolunteerStatus | null>("pending")
  const [page, setPage] = useState(1)
  const [deciding, setDeciding] = useState<Deciding>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useVolunteers({ status, page })
  const review = useReviewVolunteer()
  const pages = data ? Math.max(Math.ceil(data.total / VOLUNTEERS_PER_PAGE), 1) : 1

  function closeDecision() {
    setDeciding(null)
    review.reset()
  }

  return (
    <AdminPage title="Cadastros de voluntariado">
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
            <Skeleton key={index} className="h-44 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <StateMessage
          tone="error"
          title="Os cadastros não carregaram"
          description="Não conseguimos buscar os cadastros agora."
          action={
            <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {data && data.volunteers.length === 0 && (
        <StateMessage title={status === "pending" ? "Nenhum cadastro em análise" : "Nenhum cadastro"} description={status === "pending" ? "Todos os cadastros foram respondidos." : "Nenhum cadastro neste filtro."} />
      )}

      {data && data.volunteers.length > 0 && (
        <ul className="grid gap-4 xl:grid-cols-2">
          {data.volunteers.map((volunteer) => (
            <li key={volunteer.id} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={VOLUNTEER_STATUS[volunteer.status].tone}>{VOLUNTEER_STATUS[volunteer.status].label}</Badge>
                <Badge tone="institutional">{AREA_LABEL[volunteer.area]}</Badge>
                <span className="text-xs text-ink-soft sm:ml-auto">Cadastro em {formatDate(volunteer.created_at)}</span>
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="font-display text-lg font-bold break-words">{volunteer.user.name}</h2>
                <p className="flex min-w-0 flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    <span className="break-all">{volunteer.user.email}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-4 shrink-0" aria-hidden="true" />
                    {volunteer.phone}
                  </span>
                  {volunteer.city && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      {volunteer.city}
                    </span>
                  )}
                </p>
              </div>

              <ul className="flex flex-wrap gap-2" aria-label="Disponibilidade">
                {volunteer.availability.map((period) => (
                  <li key={period} className="rounded-pill bg-surface-muted px-3 py-1 text-xs font-semibold">
                    {PERIOD_LABEL[period]}
                  </li>
                ))}
              </ul>

              <p className="text-sm leading-relaxed break-words whitespace-pre-line">{volunteer.about}</p>

              {volunteer.review_note && (
                <p className="rounded-tile bg-surface-muted p-3 text-sm">
                  <span className="font-semibold">Resposta enviada:</span> {volunteer.review_note}
                </p>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-4">
                {volunteer.status === "pending" && (
                  <>
                    <Button size="sm" tone="success" onClick={() => setDeciding({ volunteer, decision: "approved" })}>
                      Aprovar
                    </Button>
                    <Button size="sm" variant="outline" tone="ink" onClick={() => setDeciding({ volunteer, decision: "refused" })}>
                      Recusar
                    </Button>
                  </>
                )}
                {volunteer.status === "approved" && <span className="text-sm font-semibold">{formatHours(volunteer.hours_total)} validadas</span>}
                <ButtonLink to={`mailto:${volunteer.user.email}?subject=${encodeURIComponent("Somos do Bem: voluntariado")}`} external size="sm" variant="outline" tone="ink">
                  Escrever
                </ButtonLink>
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
          title={deciding.decision === "approved" ? "Aprovar o cadastro?" : "Recusar o cadastro?"}
          subject={`${deciding.volunteer.user.name} · ${AREA_LABEL[deciding.volunteer.area]}`}
          consequence={
            deciding.decision === "approved"
              ? "A pessoa entra na escala: os turnos abertos aparecem no painel dela, e ela escolhe de quais participar."
              : "A pessoa lê o motivo no painel e pode ajustar o cadastro e mandar de novo."
          }
          confirmLabel={deciding.decision === "approved" ? "Aprovar cadastro" : "Recusar cadastro"}
          tone={deciding.decision === "approved" ? "success" : "primary"}
          noteLabel={deciding.decision === "approved" ? "Recado para a pessoa" : "Motivo"}
          noteHint="Aparece no painel do voluntário."
          noteMinLength={deciding.decision === "approved" ? 0 : 10}
          pending={review.isPending}
          error={review.isError ? (review.error instanceof CheckoutError ? review.error.message : "Não conseguimos falar com o servidor. Nada foi alterado.") : null}
          onClose={closeDecision}
          onConfirm={(note) =>
            review.mutate(
              { id: deciding.volunteer.id, decision: deciding.decision, note },
              {
                onSuccess: () => {
                  setNotice(
                    deciding.decision === "approved"
                      ? `${deciding.volunteer.user.name} entrou na escala.`
                      : `O cadastro de ${deciding.volunteer.user.name} foi recusado.`,
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
