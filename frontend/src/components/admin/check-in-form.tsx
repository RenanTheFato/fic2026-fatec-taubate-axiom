import { DoorOpen, Loader2, ScanLine } from "lucide-react"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useCheckIn } from "../../hooks/use-admin-registrations"
import type { Registration } from "../../types/registration-types"
import { extractTicketCode, formatTicketCode } from "../../utils/ticket-code"
import { Button } from "../ui/button"
import { Field, TextInput } from "../ui/field"

type CheckInFormProps = {
  eventId: string
  registrations: Registration[]
  disabled: boolean
}

type Outcome = { tone: "success" | "error"; text: string }

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// A porta. O código chega digitado ou pelo leitor de mão, que "digita" o
// endereço inteiro do QR e aperta Enter sozinho. A lista do evento já está na
// tela, então código errado, ingresso cancelado e entrada repetida são
// respondidos na hora, em português, sem ir ao servidor; o backend continua
// sendo quem decide, e só ele registra a entrada.
//
// Depois de cada leitura o campo esvazia e o foco volta para ele: a fila anda
// sem ninguém precisar clicar.
export function CheckInForm({ eventId, registrations, disabled }: CheckInFormProps) {
  const [value, setValue] = useState("")
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const checkIn = useCheckIn()

  function done(next: Outcome) {
    flushSync(() => setOutcome(next))
    setValue("")
    inputRef.current?.focus()
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const code = extractTicketCode(value)

    if (!code) {
      done({ tone: "error", text: "Digite os 10 caracteres do código, como ABCDE-12345." })
      return
    }

    const formatted = formatTicketCode(code)
    const registration = registrations.find((item) => item.ticket_code === formatted)

    if (!registration) {
      done({ tone: "error", text: `O código ${formatted} não é de uma inscrição deste evento.` })
      return
    }

    if (registration.status === "cancelled") {
      done({ tone: "error", text: `A inscrição de ${registration.participant_name} foi cancelada.` })
      return
    }

    if (registration.checked_in_at) {
      done({ tone: "error", text: `${registration.participant_name} já entrou, às ${time(registration.checked_in_at)}.` })
      return
    }

    checkIn.mutate(
      { eventId, code: formatted },
      {
        onSuccess: () => done({ tone: "success", text: `Entrada de ${registration.participant_name} registrada.` }),
        onError: (error) =>
          done({ tone: "error", text: error instanceof CheckoutError ? error.message : "Não conseguimos falar com o servidor. Tente de novo." }),
      },
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Field id="check-in-codigo" label="Código do ingresso" required>
            {(control) => (
              <TextInput
                {...control}
                ref={inputRef}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ABCDE-12345"
                disabled={disabled}
                className="font-mono"
              />
            )}
          </Field>
        </div>

        <Button type="submit" disabled={disabled || checkIn.isPending} className="shrink-0">
          {checkIn.isPending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <ScanLine className="size-5" aria-hidden="true" />}
          Registrar entrada
        </Button>
      </div>

      <p
        role="status"
        className={
          outcome === null
            ? "sr-only"
            : outcome.tone === "success"
              ? "flex items-center gap-2 font-display text-sm font-bold text-success-dark"
              : "flex items-center gap-2 font-display text-sm font-bold text-primary"
        }
      >
        {outcome?.tone === "success" && <DoorOpen className="size-4 shrink-0" aria-hidden="true" />}
        {outcome?.text ?? ""}
      </p>
    </form>
  )
}
