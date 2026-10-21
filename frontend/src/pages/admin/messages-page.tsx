import { CheckCheck, Mail, Phone } from "lucide-react"
import { useState } from "react"
import { AdminPage } from "../../components/admin/admin-ui"
import { ConfirmDialog } from "../../components/admin/confirm-dialog"
import { CHANNEL_LABEL, channelsFor, subjectLabel } from "../../components/contact/contact-labels"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Field, SelectInput } from "../../components/ui/field"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useMessages, useResolveMessage, useWithdrawFromWall } from "../../hooks/use-admin-messages"
import { useSession } from "../../hooks/use-session"
import { MESSAGES_PER_PAGE } from "../../services/admin/messages-service"
import type { ContactChannel, ContactMessage, ContactStatus } from "../../types/contact-types"
import { formatDate } from "../../utils/format"

const TABS: { value: ContactStatus | null; label: string }[] = [
  { value: "open", label: "Abertas" },
  { value: "resolved", label: "Resolvidas" },
  { value: null, label: "Todas" },
]

function receivedAt(iso: string): string {
  const date = new Date(iso)

  return `${formatDate(iso)}, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
}

function replyLink(message: ContactMessage): string {
  const topic = subjectLabel(message.channel, message.subject) ?? CHANNEL_LABEL[message.channel].label

  return `mailto:${message.email}?subject=${encodeURIComponent(`Somos do Bem: ${topic}`)}`
}

// A caixa de entrada da associação: o Fale Conosco, a Ouvidoria, o Trabalhe
// Conosco e os pedidos de retirada do Mural do Bem. A resposta sai pelo e-mail
// da equipe; aqui fica o registro de que a mensagem chegou e de quem a resolveu.
export default function MessagesPage() {
  const { user } = useSession()
  const [status, setStatus] = useState<ContactStatus | null>("open")
  const [channel, setChannel] = useState<ContactChannel | null>(null)
  const [page, setPage] = useState(1)
  const [withdrawing, setWithdrawing] = useState<ContactMessage | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useMessages({ status, channel, page })
  const resolve = useResolveMessage()
  const withdraw = useWithdrawFromWall()

  const channels = channelsFor(user?.role)
  const pages = data ? Math.max(Math.ceil(data.total / MESSAGES_PER_PAGE), 1) : 1

  function closeWithdraw() {
    setWithdrawing(null)
    withdraw.reset()
  }

  return (
    <AdminPage title="Mensagens">
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
              {tab.value === "open" && data ? ` (${data.open})` : ""}
            </Button>
          ))}
        </div>

        {channels.length > 1 && (
          <div className="w-full sm:w-64">
            <Field id="mensagens-canal" label="Canal" hideLabel>
              {(control) => (
                <SelectInput
                  {...control}
                  value={channel ?? ""}
                  onChange={(event) => {
                    setChannel((event.target.value || null) as ContactChannel | null)
                    setPage(1)
                  }}
                  className="min-h-10 py-2 text-sm"
                >
                  <option value="">Todos os canais</option>
                  {channels.map((item) => (
                    <option key={item} value={item}>
                      {CHANNEL_LABEL[item].label}
                    </option>
                  ))}
                </SelectInput>
              )}
            </Field>
          </div>
        )}
      </div>

      {notice && <StateMessage title="Pronto" description={notice} />}

      {resolve.isError && (
        <StateMessage
          tone="error"
          title="A operação não foi concluída"
          description={resolve.error instanceof CheckoutError ? resolve.error.message : "Não conseguimos falar com o servidor. Nada foi alterado."}
        />
      )}

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
          title="As mensagens não carregaram"
          description="Não conseguimos buscar a caixa de entrada agora."
          action={
            <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {data && data.contacts.length === 0 && (
        <StateMessage
          title={status === "open" ? "Nenhuma mensagem aberta" : "Nenhuma mensagem"}
          description={status === "open" ? "Todas as mensagens foram respondidas." : "Nenhuma mensagem neste filtro."}
        />
      )}

      {data && data.contacts.length > 0 && (
        <ul className="flex flex-col gap-4">
          {data.contacts.map((message) => {
            const topic = subjectLabel(message.channel, message.subject)

            return (
              <li key={message.id} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={CHANNEL_LABEL[message.channel].tone}>{CHANNEL_LABEL[message.channel].label}</Badge>
                  {topic && <span className="font-display text-sm font-bold">{topic}</span>}
                  <span className="text-xs text-ink-soft sm:ml-auto">{receivedAt(message.created_at)}</span>
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="font-display text-lg font-bold">{message.name}</h2>
                  <p className="flex min-w-0 flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <Mail className="size-4 shrink-0" aria-hidden="true" />
                      <span className="break-all">{message.email}</span>
                    </span>
                    {message.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="size-4 shrink-0" aria-hidden="true" />
                        {message.phone}
                      </span>
                    )}
                  </p>
                </div>

                {message.message && (
                  <p className="text-sm leading-relaxed break-words whitespace-pre-line">{message.message}</p>
                )}

                {message.channel === "wall_removal" && (
                  <p className="rounded-tile bg-surface-muted p-3 text-sm">
                    {message.wall_status === "listed" && "O nome deste e-mail aparece no Mural do Bem."}
                    {message.wall_status === "not_listed" && "Este e-mail é de um doador, mas nenhum nome dele aparece no mural."}
                    {message.wall_status === "no_donor" && "Nenhum doador usa este e-mail. Responda pedindo o e-mail da contribuição."}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  {message.status === "open" && message.wall_status === "listed" && (
                    <Button size="sm" tone="partner" onClick={() => setWithdrawing(message)}>
                      Retirar do mural
                    </Button>
                  )}

                  <ButtonLink to={replyLink(message)} external size="sm" variant="outline" tone="ink">
                    Responder por e-mail
                  </ButtonLink>

                  {message.status === "open" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      tone="ink"
                      disabled={resolve.isPending}
                      onClick={() => {
                        setNotice(null)
                        resolve.mutate(message.id)
                      }}
                    >
                      <CheckCheck className="size-4" aria-hidden="true" />
                      Marcar como resolvida
                    </Button>
                  ) : (
                    <span className="text-xs text-ink-soft">
                      Resolvida
                      {message.resolved_at ? ` em ${formatDate(message.resolved_at)}` : ""}
                      {message.resolver ? ` por ${message.resolver.name}` : ""}
                    </span>
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

      {withdrawing && (
        <ConfirmDialog
          title={`Retirar ${withdrawing.name} do mural?`}
          consequence="O nome sai do mural do site, das campanhas e dos eventos, em toda contribuição feita com este e-mail. A doação, o recibo e o certificado continuam valendo, e o pedido fica resolvido."
          confirmLabel="Retirar do mural"
          pending={withdraw.isPending}
          error={withdraw.isError ? (withdraw.error instanceof CheckoutError ? withdraw.error.message : "Não conseguimos falar com o servidor. Nada foi alterado.") : null}
          onClose={closeWithdraw}
          onConfirm={() =>
            withdraw.mutate(withdrawing.id, {
              onSuccess: () => {
                setNotice(`${withdrawing.name} saiu do Mural do Bem. Avise a pessoa pelo e-mail.`)
                closeWithdraw()
              },
            })
          }
        />
      )}
    </AdminPage>
  )
}
