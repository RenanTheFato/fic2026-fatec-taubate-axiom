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
import type { CertificateView } from "../../types/certificate-types"
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

function CertificateResult({ certificate }: { certificate: CertificateView }) {
  const [busy, setBusy] = useState<"download" | "print" | null>(null)
  const [failed, setFailed] = useState(false)

  // As imagens do certificado vêm da biblioteca pública do estúdio.
  const assets = useMemo(() => {
    const map = new Map<string, CanvasAsset>()
    const ids = [
      ...certificate.design.elements.flatMap((element) => (element.type === "image" ? [element.asset_id] : [])),
      ...(certificate.design.background.asset_id ? [certificate.design.background.asset_id] : []),
    ]

    for (const id of ids) map.set(id, { url: assetUrl(id), name: "Imagem" })

    return map
  }, [certificate.design])

  async function withPdf(action: "download" | "print") {
    setBusy(action)
    setFailed(false)

    try {
      const blob = await downloadCertificatePdf(certificate.hash)

      if (action === "download") downloadFile(blob, `certificado-${certificate.number.replace("/", "-")}.pdf`)
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

      <div className="rounded-card bg-surface-muted p-2 sm:p-6">
        <CertificateArtboard
          design={certificate.design}
          assets={assets}
          fields={certificate.fields}
          qr={certificate.qr}
          stamp={certificate.status === "cancelled" ? "CANCELADO" : null}
          label={`Certificado de ${certificate.fields.nome ?? "contribuição"}, recibo ${certificate.number}`}
          className="mx-auto h-auto w-full max-w-5xl rounded-tile bg-surface shadow-xl"
        />
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
