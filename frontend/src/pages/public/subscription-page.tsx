import { CalendarClock, CreditCard, Heart, Pause, PencilLine, Repeat, X } from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { PageHero } from "../../components/layout/page-hero"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Card, CardBody } from "../../components/ui/card"
import { Container } from "../../components/ui/container"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { NotFoundError } from "../../config/errors"
import { useSubscription } from "../../hooks/use-subscription"
import type { PaymentMethod } from "../../types/transaction-types"
import type { Subscription, SubscriptionStatus } from "../../types/subscription-types"
import { formatCurrency, formatDate } from "../../utils/format"

const MAIL_TO = "contato@somosdobem.org.br"

const METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  boleto: "Boleto",
  manual_pix: "Pix registrado pela equipe",
}

const STATUS: Record<SubscriptionStatus, { label: string; tone: "success" | "alert" | "primary" }> = {
  active: { label: "Ativa", tone: "success" },
  paused: { label: "Pausada", tone: "alert" },
  cancelled: { label: "Cancelada", tone: "primary" },
}

// Todo pedido de mudança sai por e-mail com o código da doação no corpo, que é
// o caminho que a equipe consegue atender hoje e que a pessoa consegue conferir
// na caixa de saída. A tela nunca diz que a alteração já aconteceu: ela diz que
// o pedido foi montado, o que é a verdade.
function requestLink(subject: string, subscription: Subscription, extra?: string): string {
  const body = [
    `Código da doação: ${subscription.token}`,
    `Valor atual: ${formatCurrency(subscription.amount)} por mês`,
    extra ?? null,
    "",
    "Escreva abaixo o que você precisa:",
  ]
    .filter((line) => line !== null)
    .join("\n")

  return `mailto:${MAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default function SubscriptionPage() {
  const { token } = useParams()
  const { data, isPending, error } = useSubscription(token)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  if (isPending) {
    return (
      <Container className="flex max-w-3xl flex-col gap-6 py-20">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </Container>
    )
  }

  // Link truncado pelo cliente de e-mail é o caso mais comum aqui, e por isso a
  // saída é o caminho de volta, e não uma tela de erro.
  if (error instanceof NotFoundError) {
    return (
      <Container className="max-w-xl py-20 sm:py-28">
        <StateMessage
          title="Não encontramos esta doação"
          description="O endereço pode ter sido cortado pelo programa de e-mail. Abra o link direto da mensagem que você recebeu ou fale com a associação, que a gente localiza pelo seu e-mail."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/fale-conosco" size="sm">
                Falar com a associação
              </ButtonLink>
              <ButtonLink to="/doe-agora" size="sm" variant="outline">
                Ver formas de doar
              </ButtonLink>
            </div>
          }
        />
      </Container>
    )
  }

  if (!data) {
    return (
      <Container className="max-w-xl py-20 sm:py-28">
        <StateMessage
          tone="error"
          title="A doação não carregou"
          description="Não conseguimos abrir os dados agora. Tente de novo em instantes."
          action={
            <ButtonLink to="/fale-conosco" size="sm">
              Falar com a associação
            </ButtonLink>
          }
        />
      </Container>
    )
  }

  const status = STATUS[data.status]

  return (
    <>
      <PageHero
        eyebrow="Doação mensal"
        title="Gerenciar sua doação"
        breadcrumb={[{ label: "Doe agora", to: "/doe-agora" }, { label: "Doação mensal" }]}
        lead={
          <p>
            Aqui você acompanha as cobranças da sua doação recorrente e pede qualquer mudança nela.
            Sem login: o endereço desta página é a sua credencial, então guarde o e-mail que a
            trouxe até aqui.
          </p>
        }
      />

      <section aria-labelledby="resumo" className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="resumo" className="font-display text-2xl font-extrabold">
              Sua doação
            </h2>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>

          <Card className="mt-6">
            <CardBody className="gap-5 sm:p-8">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold text-primary">
                  {formatCurrency(data.amount)}
                </span>
                <span className="text-ink-soft">por mês</span>
              </p>

              <dl className="grid gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden="true" />
                  <div>
                    <dt className="font-display text-sm font-bold">Forma de pagamento</dt>
                    <dd className="text-sm text-ink-soft">{METHOD_LABEL[data.payment_method]}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden="true" />
                  <div>
                    <dt className="font-display text-sm font-bold">Próxima cobrança</dt>
                    <dd className="text-sm text-ink-soft">
                      {data.next_charge_at ? formatDate(data.next_charge_at) : "Sem cobrança programada"}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Repeat className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden="true" />
                  <div>
                    <dt className="font-display text-sm font-bold">Doando desde</dt>
                    <dd className="text-sm text-ink-soft">{formatDate(data.started_at)}</dd>
                  </div>
                </div>

                {data.campaign && (
                  <div className="flex items-start gap-3">
                    <Heart className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden="true" />
                    <div>
                      <dt className="font-display text-sm font-bold">Destino</dt>
                      <dd className="text-sm text-ink-soft">{data.campaign}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>
        </Container>
      </section>

      <section aria-labelledby="historico" className="border-t border-line bg-surface-muted py-16">
        <Container className="max-w-3xl">
          <h2 id="historico" className="font-display text-2xl font-extrabold">
            Cobranças
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            O recibo de cada cobrança confirmada é enviado para o seu e-mail e pode ser conferido a
            qualquer momento na página de verificação de documento.
          </p>

          <ul className="mt-8 flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
            {data.charges.map((charge) => (
              <li key={charge.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span className="font-display font-bold">{formatDate(charge.charged_at)}</span>
                <span className="flex items-center gap-3">
                  <span className="text-sm text-ink-soft">{formatCurrency(charge.amount)}</span>
                  <Badge tone={charge.status === "paid" ? "success" : "alert"}>
                    {charge.status === "paid" ? "Paga" : "Em processamento"}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>

          <ButtonLink to="/recibo/verificar" variant="outline" size="sm" className="mt-6">
            Verificar um recibo
          </ButtonLink>
        </Container>
      </section>

      <section aria-labelledby="mudancas" className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h2 id="mudancas" className="font-display text-2xl font-extrabold">
            Precisa mudar alguma coisa?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Cada opção abre o seu programa de e-mail com o pedido pronto, já com o código da sua
            doação. A equipe responde confirmando a alteração.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <ActionCard
              icon={PencilLine}
              title="Alterar o valor"
              text="Aumentar ou diminuir quanto você doa por mês."
              href={requestLink("Alterar o valor da minha doação mensal", data, "Novo valor desejado:")}
            />
            <ActionCard
              icon={CreditCard}
              title="Trocar a forma de pagamento"
              text="Mudar o cartão ou passar para outro meio de pagamento."
              href={requestLink("Trocar a forma de pagamento da minha doação mensal", data)}
            />
            <ActionCard
              icon={Pause}
              title="Pausar por um tempo"
              text="Interromper as cobranças e voltar quando puder."
              href={requestLink("Pausar minha doação mensal", data, "Quero pausar a partir de:")}
            />

            <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
              <span className="flex size-11 items-center justify-center rounded-pill bg-primary-soft text-primary">
                <X className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg font-bold">Cancelar a doação</h3>

              {/* Encerrar uma doação recorrente não acontece em um clique, pela
                  mesma razão das ações de dinheiro do painel: a tela diz antes o
                  que para de acontecer. */}
              {confirmingCancel ? (
                <>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    Ao cancelar, as cobranças param na próxima data e o apoio mensal ao programa se
                    encerra. Os recibos já emitidos continuam válidos.
                  </p>
                  <div className="mt-1 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink
                      to={requestLink("Cancelar minha doação mensal", data)}
                      external
                      size="sm"
                    >
                      Confirmar cancelamento
                    </ButtonLink>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      tone="ink"
                      onClick={() => setConfirmingCancel(false)}
                    >
                      Manter minha doação
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    Encerrar as cobranças mensais a partir da próxima data.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    tone="ink"
                    className="mt-1 self-start"
                    onClick={() => setConfirmingCancel(true)}
                  >
                    Quero cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

type ActionCardProps = {
  icon: typeof PencilLine
  title: string
  text: string
  href: string
}

function ActionCard({ icon: Icon, title, text, href }: ActionCardProps) {
  return (
    <a
      href={href}
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 transition-colors hover:border-primary"
    >
      <span className="flex size-11 items-center justify-center rounded-pill bg-institutional-soft text-institutional-dark">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-soft">{text}</p>
    </a>
  )
}
