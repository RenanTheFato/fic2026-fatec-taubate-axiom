import { AlertTriangle, Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { StateMessage } from "../ui/states"

type ConfirmDialogProps = {
  title: string
  /** O que a ação faz de verdade, em uma ou duas frases. */
  consequence: string
  confirmLabel: string
  pending: boolean
  error?: string | null
  onConfirm: () => void
  onClose: () => void
}

// A confirmação das ações que não voltam atrás: excluir rascunho, anonimizar
// doador, cancelar inscrição, retirar nome do mural. Diferente do diálogo de
// dinheiro, não pede motivo, porque nenhuma delas entra na auditoria de
// transação; o que ela pede é um segundo clique consciente.
//
// O foco abre em "Voltar", e não no botão da ação: um Enter apressado nunca
// apaga nada. `Esc` fecha, como em todo diálogo.
export function ConfirmDialog({ title, consequence, confirmLabel, pending, error, onConfirm, onClose }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLButtonElement>("[data-voltar]")?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        aria-describedby="confirmar-consequencia"
        className="w-full max-w-lg rounded-card border border-line bg-surface p-6 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-6 shrink-0 text-alert-dark" aria-hidden="true" />
          <h2 id="confirmar-titulo" className="min-w-0 font-display text-xl font-extrabold break-words">
            {title}
          </h2>
        </div>

        <p id="confirmar-consequencia" className="mt-4 rounded-tile bg-surface-muted p-4 text-sm leading-relaxed text-ink-soft">
          {consequence}
        </p>

        {error && (
          <div className="mt-5">
            <StateMessage tone="error" title="A operação não foi concluída" description={error} />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button data-voltar type="button" tone="ink" variant="outline" onClick={onClose} disabled={pending}>
            Voltar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
