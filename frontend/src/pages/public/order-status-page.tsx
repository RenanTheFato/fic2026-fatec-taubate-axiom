import { BadgeCheck, CircleSlash, Clock, Download, Loader2, RotateCcw, ShieldCheck, XCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { PageHero } from "../../components/layout/page-hero"
import { Reveal } from "../../components/motion/reveal"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { Prose } from "../../components/ui/prose"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { env } from "../../config/env"
import { NotFoundError } from "../../config/errors"
import { isSettled } from "../../services/transaction/get-transaction-status-service"
import { MAX_ATTEMPTS, POLL_INTERVAL, useTransactionStatus } from "../../hooks/use-transaction-status"
import type { TransactionStatusView } from "../../types/transaction-types"
import { formatCurrency, formatDate } from "../../utils/format"

// A regra mais importante desta tela: **voltar do Stripe não é prova de
// pagamento**. Quem confirma é o webhook, então enquanto o backend não disser
// `confirmed` a tela diz "confirmando", nunca "obrigado, deu certo".
//
// O link do recibo também só existe depois de confirmado, porque antes disso
// não há documento nenhum para conferir.

type Presentation = {
  icon: LucideIcon
  eyebrow: string
  title: string
  tone: "primary" | "success" | "institutional"
  body: string
}

function present(status: TransactionStatusView["status"], exhausted: boolean): Presentation {
  switch (status) {
    case "confirmed":
      return {
        icon: BadgeCheck,
        eyebrow: "Pagamento confirmado",
        title: "Obrigado. Sua contribuição chegou.",
        tone: "success",
        body:
          "O pagamento foi confirmado pelo nosso sistema, e não apenas pelo navegador. O recibo já foi emitido e entrou na corrente de documentos da associação.",
      }
    case "refused":
      return {
        icon: XCircle,
        eyebrow: "Pagamento recusado",
        title: "O pagamento não foi aprovado",
        tone: "primary",
        body:
          "O emissor do cartão recusou a cobrança. Nada foi debitado. Você pode tentar de novo com outro meio de pagamento, porque nenhum dado seu ficou preso no caminho.",
      }
    case "cancelled":
      return {
        icon: CircleSlash,
        eyebrow: "Pedido cancelado",
        title: "O pedido foi cancelado",
        tone: "primary",
        body: "Nada foi cobrado. Se o cancelamento não foi você quem fez, fale com a associação com o número do pedido em mãos.",
      }
    case "refunded":
      return {
        icon: RotateCcw,
        eyebrow: "Valor estornado",
        title: "Este pedido foi estornado",
        tone: "institutional",
        body:
          "O valor voltou para o meio de pagamento de origem. O recibo emitido continua sendo um documento autêntico, mas deixou de valer, e é assim que a conferência pública o classifica.",
      }
    default:
      return exhausted
        ? {
          icon: Clock,
          eyebrow: "Em processamento",
          title: "Seu pagamento segue em processamento",
          tone: "institutional",
          body:
            "Alguns meios de pagamento levam mais tempo para serem compensados. Não é preciso pagar de novo: assim que a confirmação chegar, o recibo vai para o seu e-mail. Guarde o número do pedido.",
        }
        : {
          icon: Loader2,
          eyebrow: "Confirmando",
          title: "Estamos confirmando seu pagamento",
          tone: "institutional",
          body:
            "Voltar do ambiente de pagamento ainda não quer dizer que a cobrança foi aprovada: quem confirma é o nosso sistema, e é ele que estamos consultando agora. Não feche esta página.",
        }
  }
}

const ACCENT = {
  primary: "text-primary",
  success: "text-success-dark",
  institutional: "text-institutional-dark",
}

export default function OrderStatusPage() {
  const { transacaoId = "" } = useParams()
  const [params] = useSearchParams()
  const { data, isPending, isError, error, dataUpdatedAt, refetch } = useTransactionStatus(transacaoId)

  // Quando a tela abriu, fixado na inicialização do estado, porque ler o relógio no
  // corpo do componente daria um valor novo a cada renderização. A janela é
  // medida a partir daqui, e não da criação do pedido: quem reabre o link uma
  // hora depois merece uma nova rodada de consultas, não a mensagem de esgotado
  // já na primeira tela.
  const [openedAt] = useState(() => Date.now())

  // O Stripe devolve por aqui quando a pessoa desiste no checkout. A transação
  // continua `pending` no banco (o cancelamento é do navegador, não do
  // pagamento), então a tela avisa sem alterar o que o backend registrou.
  const abandoned = params.get("cancelado") === "1"

  if (isPending) {
    return (
      <Container className="py-20">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-6 h-32 w-full" />
      </Container>
    )
  }

  if (isError) {
    const missing = error instanceof NotFoundError

    return (
      <Container className="py-20">
        <div className="max-w-lg">
          <StateMessage
            tone={missing ? "neutral" : "error"}
            title={missing ? "Pedido não encontrado" : "Não conseguimos consultar o pedido"}
            description={
              missing
                ? "Este endereço não corresponde a nenhum pedido. Confira se o link veio completo, porque o código do pedido tem 36 caracteres."
                : "A consulta falhou. Isso não afeta o seu pagamento: se ele foi aprovado, o recibo chega por e-mail de qualquer forma."
            }
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
        </div>
      </Container>
    )
  }

  const settled = isSettled(data.status)
  const exhausted = !settled && dataUpdatedAt - openedAt >= MAX_ATTEMPTS * POLL_INTERVAL
  const view = present(data.status, exhausted)

  return (
    <>
      <PageHero
        eyebrow={view.eyebrow}
        title={view.title}
        tone={view.tone === "success" ? "success" : view.tone === "primary" ? "primary" : "institutional"}
        breadcrumb={[{ label: "Doe agora", to: "/doe-agora" }, { label: "Status do pedido" }]}
        lead={<p>{view.body}</p>}
      />

      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <Reveal from="left">
            <div className="flex items-center gap-3">
              <view.icon
                className={`size-8 ${ACCENT[view.tone]} ${!settled && !exhausted ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              <h2 className="font-display text-2xl font-extrabold">Resumo do pedido</h2>
            </div>

            <dl className="mt-6 flex flex-col divide-y divide-line rounded-card border border-line">
              <div className="flex flex-wrap items-baseline justify-between gap-2 p-5">
                <dt className="text-sm text-ink-soft">Valor</dt>
                <dd className="font-display text-xl font-extrabold text-primary">
                  {formatCurrency(data.amount)}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 p-5">
                <dt className="text-sm text-ink-soft">Feito em</dt>
                <dd className="text-sm font-semibold">{formatDate(data.created_at)}</dd>
              </div>
              <div className="flex flex-col gap-1 p-5">
                <dt className="text-sm text-ink-soft">Número do pedido</dt>
                <dd className="min-w-0 font-mono text-sm break-all">{data.id}</dd>
              </div>
            </dl>

            {abandoned && !settled && (
              <div className="mt-6">
                <StateMessage
                  title="Você saiu do pagamento antes de concluir"
                  description="O pedido continua registrado e nada foi cobrado. Se quiser retomar, basta doar de novo: este pedido não fica pendurado no seu nome."
                  action={
                    <ButtonLink to="/doe-agora" size="sm">
                      Tentar de novo
                    </ButtonLink>
                  }
                />
              </div>
            )}

            {!settled && !abandoned && (
              <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Consultando o sistema da associação…
              </p>
            )}

            <p aria-live="polite" className="sr-only">
              {view.title}
            </p>
          </Reveal>

          <Reveal from="right" delay={0.1}>
            <div className="rounded-card border border-line bg-surface-muted p-6 sm:p-8">
              {data.status === "confirmed" && data.receipt_hash ? (
                <>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-6 text-institutional-dark" aria-hidden="true" />
                    <h2 className="font-display text-xl font-bold">Seu recibo</h2>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    Recibo {data.receipt_number}. O código abaixo prova que o documento é autêntico, e
                    qualquer pessoa pode conferi-lo sem login.
                  </p>

                  <p className="mt-4 min-w-0 rounded-tile border border-line bg-surface p-3 font-mono text-xs break-all">
                    {data.receipt_hash}
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink to={`/recibo/verificar?codigo=${data.receipt_hash}`} size="sm">
                      Conferir o recibo
                    </ButtonLink>
                    <ButtonLink
                      to={`${env.apiUrl}/receipt/download/${data.receipt_hash}`}
                      external
                      variant="outline"
                      tone="ink"
                      size="sm"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Baixar em PDF
                    </ButtonLink>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-display text-xl font-bold">O que acontece agora</h2>

                  <Prose className="mt-3 text-sm sm:text-base">
                    <p>
                      A confirmação do pagamento é feita pelo nosso sistema quando o gateway avisa que
                      a cobrança foi compensada, e não no momento em que você volta para esta página.
                    </p>
                    <p>
                      Assim que isso acontecer, o recibo é emitido automaticamente, entra na corrente
                      de documentos e o link de conferência aparece aqui.
                    </p>
                  </Prose>
                </>
              )}
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="bg-surface-muted py-14">
        <Container className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-ink-soft">
            Qualquer dúvida sobre este pedido, fale com a associação e informe o número acima.
          </p>
          <ButtonLink to="/fale-conosco" variant="outline" tone="ink" size="sm" className="shrink-0">
            Falar com a associação
          </ButtonLink>
        </Container>
      </section>
    </>
  )
}
