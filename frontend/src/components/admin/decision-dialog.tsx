import { Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Button } from "../ui/button"
import type { ButtonTone } from "../ui/button"
import { Field, TextArea } from "../ui/field"
import { StateMessage } from "../ui/states"

type DecisionDialogProps = {
  title: string
  /** A quem a decisão se refere, numa linha: a empresa, a pessoa. */
  subject: string
  /** O que a decisão faz de verdade, em uma ou duas frases. */
  consequence: string
  confirmLabel: string
  tone?: ButtonTone
  noteLabel: string
  noteHint?: string
  /** Quantos caracteres a nota exige. Zero deixa a nota opcional. */
  noteMinLength: number
  pending: boolean
  error: string | null
  onConfirm: (note: string | null) => void
  onClose: () => void
}

// A decisão sobre um pedido que chega de fora: aprovar ou recusar uma empresa,
// um cadastro de voluntariado, uma proposta. A nota vai para quem pediu e é lida
// no painel dela, então a recusa sempre leva o motivo; a aprovação pode levar
// um recado, se houver.
//
// Como o diálogo de dinheiro, é nosso: foco no campo ao abrir, `Esc` fecha, e
// "Voltar" fica ao lado da ação.
export function DecisionDialog({
  title,
  subject,
  consequence,
  confirmLabel,
  tone = "primary",
  noteLabel,
  noteHint,
  noteMinLength,
  pending,
  error,
  onConfirm,
  onClose,
}: DecisionDialogProps) {
  const [note, setNote] = useState("")
  const [invalid, setInvalid] = useState<string | undefined>()
  const noteRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    noteRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const text = note.trim()

    if (text.length < noteMinLength) {
      setInvalid(`Escreva pelo menos ${noteMinLength} caracteres. É o que a pessoa vai ler no painel.`)
      noteRef.current?.focus()
      return
    }

    setInvalid(undefined)
    onConfirm(text || null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="decisao-titulo"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-card border border-line bg-surface p-6 shadow-lg"
      >
        <h2 id="decisao-titulo" className="font-display text-xl font-extrabold break-words">
          {title}
        </h2>
        <p className="mt-1 text-sm break-words text-ink-soft">{subject}</p>

        <p className="mt-4 rounded-tile bg-surface-muted p-4 text-sm leading-relaxed text-ink-soft">{consequence}</p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-5">
          <Field id="decisao-nota" label={noteLabel} hint={noteHint} error={invalid} required={noteMinLength > 0}>
            {(control) => (
              <TextArea {...control} ref={noteRef} rows={3} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} />
            )}
          </Field>

          {error && <StateMessage tone="error" title="A operação não foi concluída" description={error} />}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" tone="ink" variant="outline" onClick={onClose} disabled={pending}>
              Voltar
            </Button>
            <Button type="submit" tone={tone} disabled={pending}>
              {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              {confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
