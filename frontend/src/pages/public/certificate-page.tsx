import { BadgeCheck, CircleAlert, CircleX, Download, Loader2, Printer, Search, ShieldCheck } from "lucide-react"
import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { CertificateArtboard } from "../../components/certificate/certificate-artboard"
import type { CanvasAsset } from "../../components/certificate/certificate-artboard"
import { PageHero } from "../../components/layout/page-hero"
import { Button, ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { Field, TextInput } from "../../components/ui/field"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { getErrorMessage } from "../../config/api"
import { NotFoundError } from "../../config/errors"
import { useCertificateView } from "../../hooks/use-certificate-view"
import { assetUrl } from "../../services/certificate/certificate-assets-service"
import { downloadCertificatePdf } from "../../services/receipt/certificate-view-service"
import type { CertificateChoice, CertificateVariant, CertificateView } from "../../types/certificate-types"
import { cn } from "../../utils/cn"
import { formatDate } from "../../utils/format"
import { downloadFile, printPdf } from "../../utils/pdf-file"

// O código pode chegar colado de vários jeitos: só os 64 caracteres, com
// espaços no meio (copiado do PDF) ou o endereço inteiro que o QR abre.
function extractCode(value: string): string | null {
  const compact = value.replace(/\s+/g, "")
  const match = compact.match(/[0-9a-fA-F]{64}/)

  return match ? match[0].toLowerCase() : null
}

function Verdict({ certificate }: { certificate: CertificateView }) {
  if (certificate.valid) {
    return (
      <p role="status" className="flex items-center gap-2 font-display font-bold text-success-dark">
        <BadgeCheck className="size-5 shrink-0" aria-hidden="true" />
        Certificado autêntico e válido
      </p>
    )
  }

  if (certificate.authentic) {
    return (
      <p role="status" className="flex items-center gap-2 font-display font-bold text-alert-dark">
        <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
        Autêntico, mas cancelado em {certificate.cancelled_at ? formatDate(certificate.cancelled_at) : "data não informada"}
      </p>
    )
  }

  return (
    <p role="status" className="flex items-center gap-2 font-display font-bold text-primary">
      <CircleX className="size-5 shrink-0" aria-hidden="true" />
      O registro deste certificado não confere. Fale com a associação.
    </p>
  )
}

const CHOICES: { value: CertificateChoice; label: string; description: string }[] = [
  { value: "amount", label: "Com o valor", description: "O certificado mostra quanto foi a contribuição." },
  { value: "message", label: "Com uma mensagem", description: "Uma mensagem de agradecimento no lugar do valor." },
  { value: "both", label: "Os dois", description: "As duas versões, uma em cada página." },
]

const VARIANT_CAPTION: Record<CertificateVariant, string> = {
  amount: "Com o valor",
  message: "Com a mensagem",
}

function CertificateResult({ certificate }: { certificate: CertificateView }) {
  const [busy, setBusy] = useState<"download" | "print" | null>(null)
  const [failed, setFailed] = useState(false)
  const [choice, setChoice] = useState<CertificateChoice>("amount")

  const shown: CertificateVariant[] = choice === "both" ? ["amount", "message"] : [choice]

  // As imagens do certificado vêm da biblioteca pública do estúdio, e as duas
  // variações podem usar imagens diferentes.
  const assets = useMemo(() => {
    const map = new Map<string, CanvasAsset>()
    const designs = [certificate.variants.amount.design, certificate.variants.message.design]
    const ids = designs.flatMap((design) => [
      ...design.elements.flatMap((element) => (element.type === "image" ? [element.asset_id] : [])),
      ...(design.background.asset_id ? [design.background.asset_id] : []),
    ])

    for (const id of ids) map.set(id, { url: assetUrl(id), name: "Imagem" })

    return map
  }, [certificate.variants])

  async function withPdf(action: "download" | "print") {
    setBusy(action)
    setFailed(false)

    try {
      const blob = await downloadCertificatePdf(certificate.hash, choice)
      const suffix = choice === "message" ? "-mensagem" : choice === "both" ? "-completo" : ""

      if (action === "download") downloadFile(blob, `certificado-${certificate.number.replace("/", "-")}${suffix}.pdf`)
      else printPdf(blob)
    } catch {
      setFailed(true)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-col gap-1">
          <Verdict certificate={certificate} />
          <p className="text-sm text-ink-soft">
            Recibo nº {certificate.number}, emitido em {formatDate(certificate.issued_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => withPdf("download")} disabled={busy !== null}>
            {busy === "download" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
            Baixar PDF
          </Button>
          <Button size="sm" variant="outline" tone="ink" onClick={() => withPdf("print")} disabled={busy !== null}>
            {busy === "print" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Printer className="size-4" aria-hidden="true" />}
            Imprimir
          </Button>
          <ButtonLink to={`/recibo/verificar?codigo=${certificate.hash}`} size="sm" variant="outline" tone="ink">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Conferir
          </ButtonLink>
        </div>
      </div>

      {failed && <StateMessage tone="error" title="O PDF não abriu" description="Tente de novo em instantes." />}

      {/* Quem contribuiu decide se o certificado mostra o valor: a associação
          desenha as duas variações no estúdio, e a escolha vale para a tela,
          para o PDF e para a impressão. */}
      <fieldset className="flex flex-col gap-3">
        <legend className="font-display text-sm font-bold">Como você quer o certificado</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {CHOICES.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-tile border-2 bg-surface px-4 py-3 transition-colors",
                choice === option.value ? "border-institutional bg-institutional-soft" : "border-line hover:border-ink-soft/40",
              )}
            >
              <input
                type="radio"
                name="variacao-certificado"
                value={option.value}
                checked={choice === option.value}
                onChange={() => setChoice(option.value)}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className="min-w-0">
                <span className="block font-display text-sm font-bold">{option.label}</span>
                <span className="block text-xs text-ink-soft">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-6">
        {shown.map((variant) => (
          <figure key={variant} className="flex flex-col gap-2 rounded-card bg-surface-muted p-2 sm:p-6">
            <CertificateArtboard
              design={certificate.variants[variant].design}
              assets={assets}
              fields={certificate.fields}
              qr={certificate.variants[variant].qr}
              stamp={certificate.status === "cancelled" ? "CANCELADO" : null}
              label={`Certificado ${variant === "amount" ? "com o valor" : "com a mensagem"} de ${certificate.fields.nome ?? "contribuição"}, recibo ${certificate.number}`}
              className="mx-auto h-auto w-full max-w-5xl rounded-tile bg-surface shadow-xl"
            />
            {choice === "both" && <figcaption className="text-center text-xs font-semibold text-ink-soft">{VARIANT_CAPTION[variant]}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  )
}

// A segunda via do certificado, aberta a qualquer pessoa: quem perdeu o
// arquivo digita o código impresso nele (ou lê o QR) e vê, baixa ou imprime de
// novo. O código de 64 caracteres é a credencial, como na verificação.
export default function CertificatePage() {
  const navigate = useNavigate()
  const { hash: param = "" } = useParams()
  const hash = extractCode(param) ?? ""
  const [error, setError] = useState<string | undefined>()
  const view = useCertificateView(hash)
  const notFound = view.error instanceof NotFoundError

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const code = extractCode(String(new FormData(event.currentTarget).get("codigo") ?? ""))

    if (!code) {
      setError("Cole o código completo, com os 64 caracteres.")
      return
    }

    setError(undefined)
    navigate(`/certificado/${code}`)
  }

  return (
    <>
      <PageHero
        eyebrow="Segunda via"
        title="Meu certificado"
        tone="institutional"
        breadcrumb={[{ label: "Institucional", to: "/institucional" }, { label: "Meu certificado" }]}
        lead={<p>Perdeu o certificado? Digite o código impresso nele para ver, baixar ou imprimir de novo.</p>}
      />

      <section aria-labelledby="buscar-certificado" className="py-12 sm:py-16">
        <Container className="flex flex-col gap-10">
          <form onSubmit={onSubmit} noValidate className="flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-start">
            <h2 id="buscar-certificado" className="sr-only">
              Buscar certificado pelo código
            </h2>
            <div className="min-w-0 flex-1">
              <Field id="codigo" label="Código do certificado" hint="Fica no rodapé do certificado e do recibo." error={error} required>
                {(control) => (
                  <TextInput
                    {...control}
                    key={hash}
                    name="codigo"
                    autoComplete="off"
                    spellCheck={false}
                    defaultValue={hash}
                    placeholder="a1b2c3d4…"
                    className="font-mono text-sm"
                  />
                )}
              </Field>
            </div>
            <Button type="submit" size="lg" className="sm:mt-8">
              <Search className="size-5" aria-hidden="true" />
              Ver certificado
            </Button>
          </form>

          {hash && view.isPending && <Skeleton className="aspect-[842/595] w-full max-w-5xl" />}

          {hash && notFound && (
            <StateMessage
              tone="error"
              title="Nenhum certificado com este código"
              description="Confira se o código foi copiado inteiro. Se continuar, fale com a associação."
            />
          )}

          {hash && view.isError && !notFound && (
            <StateMessage
              tone="error"
              title="Não conseguimos buscar o certificado agora"
              description={getErrorMessage(view.error, "O serviço não respondeu.")}
              action={
                <button type="button" onClick={() => view.refetch()} className="font-display font-bold text-primary underline underline-offset-4">
                  Tentar de novo
                </button>
              }
            />
          )}

          {view.data && <CertificateResult certificate={view.data} />}
        </Container>
      </section>
    </>
  )
}
