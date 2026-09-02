import { BadgeCheck, CircleAlert, CircleX, Link2 } from "lucide-react"
import type { ReceiptVerification } from "../../types/receipt-types"
import { formatCurrency, formatDate } from "../../utils/format"
import { Card } from "../ui/card"

type VerificationResultProps = {
  verification: ReceiptVerification
}

const TYPE_LABEL: Record<string, string> = {
  donation: "Doação",
  sponsorship: "Patrocínio",
  ticket: "Convite",
  product: "Produto",
}

type Verdict = {
  icon: typeof BadgeCheck
  title: string
  description: string
  className: string
}

// Três desfechos, e cada um diz uma coisa diferente. "Autêntico mas cancelado"
// não é falha de verificação: o documento é verdadeiro, só não vale mais — e
// misturar os dois casos num só aviso seria enganoso nas duas direções.
function verdictOf(verification: ReceiptVerification): Verdict {
  if (verification.valid) {
    return {
      icon: BadgeCheck,
      title: "Documento autêntico",
      description: "O conteúdo confere com o registro da associação e o documento continua válido.",
      className: "border-success bg-success-soft text-success-dark",
    }
  }

  if (verification.authentic) {
    return {
      icon: CircleAlert,
      title: "Documento autêntico, mas cancelado",
      description:
        "O documento foi mesmo emitido pela associação, e depois cancelado. Ele não vale como comprovante.",
      className: "border-alert bg-alert/15 text-ink",
    }
  }

  return {
    icon: CircleX,
    title: "O documento não confere",
    description:
      "O conteúdo registrado não corresponde ao código apresentado. Fale com a associação antes de usar este documento.",
    className: "border-primary bg-primary-soft text-primary",
  }
}

export function VerificationResult({ verification }: VerificationResultProps) {
  const verdict = verdictOf(verification)
  const { receipt } = verification

  return (
    <div className="flex flex-col gap-6">
      <div role="status" className={`flex gap-4 rounded-card border-2 p-6 ${verdict.className}`}>
        <verdict.icon className="size-8 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-display text-xl font-extrabold">{verdict.title}</p>
          <p className="mt-1 text-base leading-relaxed">{verdict.description}</p>
        </div>
      </div>

      <Card>
        <dl className="grid gap-px overflow-hidden bg-line sm:grid-cols-2">
          {[
            { term: "Número do documento", value: receipt.number },
            { term: "Tipo", value: TYPE_LABEL[receipt.transaction_type] ?? receipt.transaction_type },
            { term: "Emitido em", value: formatDate(receipt.issued_at) },
            { term: "Valor", value: formatCurrency(receipt.amount) },
            { term: "Em nome de", value: receipt.donor_name },
            { term: "Documento do doador", value: receipt.donor_document ?? "não informado" },
          ].map((row) => (
            <div key={row.term} className="bg-surface px-5 py-4">
              <dt className="text-xs tracking-wide text-ink-soft uppercase">{row.term}</dt>
              <dd className="mt-1 font-display text-base font-bold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="rounded-card border border-line bg-surface-muted p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Link2 className="size-5 text-institutional-dark" aria-hidden="true" />O que foi conferido
        </h2>

        <ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-ink-soft">
          <li className="flex gap-3">
            {verification.checks.content_matches ? (
              <BadgeCheck className="size-5 shrink-0 text-success-dark" aria-hidden="true" />
            ) : (
              <CircleX className="size-5 shrink-0 text-primary" aria-hidden="true" />
            )}
            <span>
              <strong className="block font-display text-ink">Conteúdo do documento</strong>
              Valor, nome e data continuam exatamente como no momento da emissão.
            </span>
          </li>

          <li className="flex gap-3">
            {verification.checks.chain_matches ? (
              <BadgeCheck className="size-5 shrink-0 text-success-dark" aria-hidden="true" />
            ) : (
              <CircleX className="size-5 shrink-0 text-primary" aria-hidden="true" />
            )}
            <span>
              <strong className="block font-display text-ink">Ligação com o documento anterior</strong>
              Cada documento aponta para o anterior. Se um deles fosse alterado ou removido, essa
              corrente se romperia — e é isso que este teste verifica.
            </span>
          </li>
        </ul>

        <p className="mt-5 text-xs break-all text-ink-soft">
          Código conferido: <span className="font-mono">{receipt.hash}</span>
        </p>
      </div>
    </div>
  )
}
