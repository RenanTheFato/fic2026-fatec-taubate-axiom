import { Search, ShieldCheck } from "lucide-react"
import { useState } from "react"
import type { FormEvent } from "react"
import { ChainDemo } from "../../components/receipt/chain-demo"
import { VerificationResult } from "../../components/receipt/verification-result"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Button } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { Field, TextInput } from "../../components/ui/field"
import { SectionHeading } from "../../components/ui/section"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useVerifyReceipt } from "../../hooks/use-verify-receipt"
import { getErrorMessage } from "../../config/api"
import { NotFoundError } from "../../config/errors"

const STEPS = [
  {
    title: "Cada documento recebe um código único",
    text: "Quando um recibo ou certificado é emitido, ele ganha um código de 64 caracteres calculado a partir do próprio conteúdo — valor, nome, data e número.",
  },
  {
    title: "Cada documento aponta para o anterior",
    text: "O código de um documento inclui o código do documento emitido antes dele. Os documentos formam uma corrente.",
  },
  {
    title: "Alterar um documento rompe a corrente",
    text: "Se alguém mudasse um valor depois da emissão, o código deixaria de bater — e o documento seguinte, que aponta para o antigo, denunciaria a alteração.",
  },
]

export default function VerifyReceiptPage() {
  const [submittedHash, setSubmittedHash] = useState("")
  const [error, setError] = useState<string | undefined>(undefined)
  const verification = useVerifyReceipt(submittedHash)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = String(new FormData(event.currentTarget).get("hash") ?? "").trim()

    if (value.length < 16) {
      setError("Cole o código completo que aparece no documento.")
      setSubmittedHash("")
      return
    }

    setError(undefined)
    setSubmittedHash(value)
  }

  const notFound = verification.error instanceof NotFoundError

  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Verificar documento"
        breadcrumb={[{ label: "Institucional", to: "/institucional" }, { label: "Verificar documento" }]}
        scene="chain"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Recebeu um recibo da associação? Copie o código do documento e cole aqui. Vamos dizer
                se ele é verdadeiro.
              </p>
            }
          >
            <p>
              Todo recibo e todo certificado emitido pela associação carrega um código próprio. Cole
              esse código abaixo para conferir se o documento é autêntico e se continua valendo. Não
              é preciso login nem cadastro.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="conferir" className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <h2 id="conferir" className="sr-only">
            Conferir um documento
          </h2>

          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <Field
              id="hash"
              label="Código do documento"
              hint="São 64 caracteres, impressos no rodapé do recibo e dentro do QR Code."
              error={error}
              required
            >
              {(control) => (
                <TextInput
                  {...control}
                  name="hash"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-sm"
                  placeholder="a1b2c3d4…"
                />
              )}
            </Field>

            <div>
              <Button type="submit" size="lg">
                <Search className="size-5" aria-hidden="true" />
                Verificar
              </Button>
            </div>
          </form>

          <div className="mt-10">
            {verification.isFetching && (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            )}

            {!verification.isFetching && notFound && (
              <StateMessage
                tone="error"
                title="Não encontramos esse código"
                description="Confira se o código foi copiado por inteiro, sem espaços. Se o problema continuar, fale com a associação — pode ser um documento antigo, anterior a este sistema."
              />
            )}

            {!verification.isFetching && verification.isError && !notFound && (
              <StateMessage
                tone="error"
                title="Não conseguimos conferir agora"
                description={getErrorMessage(verification.error, "O serviço de verificação não respondeu.")}
                action={
                  <button
                    type="button"
                    onClick={() => verification.refetch()}
                    className="font-display font-bold text-primary underline underline-offset-4"
                  >
                    Tentar de novo
                  </button>
                }
              />
            )}

            {!verification.isFetching && verification.data && (
              <VerificationResult verification={verification.data} />
            )}
          </div>
        </Container>
      </section>

      <section aria-labelledby="demonstracao" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="demonstracao"
            eyebrow="Demonstração"
            title="Veja um documento ser adulterado"
            description="Toque em um dos recibos abaixo para alterar o valor dele e acompanhe o que acontece com os documentos emitidos depois. Os dados são fictícios; a conferência é a mesma que o servidor faz."
            tone="institutional"
          />

          <div className="mt-10">
            <ChainDemo />
          </div>
        </Container>
      </section>

      <section aria-labelledby="como-funciona" className="border-t border-line py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="como-funciona"
            eyebrow="Como funciona"
            title="Por que esse código não pode ser falsificado"
            description="Sem jargão: é o mesmo princípio que faz um livro-caixa numerado à mão ser difícil de adulterar — só que conferido por qualquer pessoa, a qualquer hora."
            tone="institutional"
          />

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-card border border-line bg-surface p-6">
                <span className="flex size-11 items-center justify-center rounded-pill bg-institutional-soft font-display text-lg font-extrabold text-institutional-dark">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-display text-lg leading-snug font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>

          <p className="mt-8 flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-institutional-dark" aria-hidden="true" />
            A conferência é feita no servidor da associação, que recalcula o código a partir do que
            está registrado e compara com o código apresentado.
          </p>
        </Container>
      </section>
    </>
  )
}
