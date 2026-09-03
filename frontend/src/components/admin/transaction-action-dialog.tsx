import { AlertTriangle, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTransactionAction } from "../../hooks/use-admin-transactions"
import { CheckoutError } from "../../config/errors"
import {
  ACTION_CONSEQUENCE,
  ACTION_LABEL,
} from "../../services/admin/transaction-actions-service"
import type { TransactionAction } from "../../services/admin/transaction-actions-service"
import type { AdminTransaction } from "../../services/admin/list-transactions-service"
import { formatCurrency } from "../../utils/format"
import { Button } from "../ui/button"
import { Field, TextInput } from "../ui/field"
import { StateMessage } from "../ui/states"

type TransactionActionDialogProps = {
  action: TransactionAction
  transaction: AdminTransaction
  onClose: () => void
}

// Nenhuma ação de dinheiro acontece com um clique só. O motivo é obrigatório
// porque ele vai para `transaction_audit_logs` junto com o autor. Sem ele,
// meses depois ninguém sabe por que um pagamento mudou de estado.
//
// O diálogo é nosso, como todo componente deste projeto. O que ele precisa
// entregar é o comportamento que um `<dialog>` de biblioteca entregaria: foco
// que entra ao abrir, `Esc` que fecha, e o resto da página marcado como inerte
// para o leitor de tela.
export function TransactionActionDialog({ action, transaction, onClose }: TransactionActionDialogProps) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const mutation = useTransactionAction()

  useEffect(() => {
    inputRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (reason.trim().length < 3) {
      setError("Descreva o motivo com pelo menos 3 caracteres. Ele fica registrado na auditoria.")
      inputRef.current?.focus()
      return
    }

    setError(undefined)

    mutation.mutate(
      { action, id: transaction.id, reason: reason.trim() },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="acao-titulo"
        className="w-full max-w-lg rounded-card border border-line bg-surface p-6 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-6 shrink-0 text-alert-dark" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="acao-titulo" className="font-display text-xl font-extrabold">
              {ACTION_LABEL[action]} {formatCurrency(transaction.amount)}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {transaction.donor?.name ?? "Doador não identificado"}
            </p>
          </div>
        </div>

        <p className="mt-4 rounded-tile bg-surface-muted p-4 text-sm leading-relaxed text-ink-soft">
          {ACTION_CONSEQUENCE[action]}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-5">
          <Field
            id="acao-motivo"
            label="Motivo"
            hint="Fica registrado na auditoria com o seu nome e a data."
            error={error}
            required
          >
            {(control) => (
              <TextInput
                {...control}
                ref={inputRef}
                type="text"
                maxLength={255}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            )}
          </Field>

          {mutation.isError && (
            <StateMessage
              tone="error"
              title="A operação não foi concluída"
              description={
                mutation.error instanceof CheckoutError
                  ? mutation.error.message
                  : "Não conseguimos falar com o servidor. Nada foi alterado."
              }
            />
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" tone="ink" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Voltar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  Aplicando…
                </>
              ) : (
                `${ACTION_LABEL[action]} mesmo assim`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
