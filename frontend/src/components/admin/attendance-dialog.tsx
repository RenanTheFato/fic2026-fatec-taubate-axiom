import { Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Button } from "../ui/button"
import { Field, TextInput } from "../ui/field"
import { StateMessage } from "../ui/states"

type AttendanceDialogProps = {
  name: string
  activity: string
  /** A duração do turno em horas, que é o valor de partida. */
  duration: number
  pending: boolean
  error: string | null
  onConfirm: (hours: number) => void
  onClose: () => void
}

function decimal(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "").replace(".", ",")
}

// A presença vira hora no painel do voluntário. Vale a duração do turno, e a
// coordenação ajusta quando a pessoa chegou depois ou saiu antes.
export function AttendanceDialog({ name, activity, duration, pending, error, onConfirm, onClose }: AttendanceDialogProps) {
  const [hours, setHours] = useState(decimal(duration))
  const [invalid, setInvalid] = useState<string | undefined>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = Number(hours.trim().replace(",", "."))

    if (!Number.isFinite(value) || value <= 0 || value > 24 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) {
      setInvalid("Use um número de horas entre 0 e 24, como 2,5.")
      inputRef.current?.focus()
      return
    }

    setInvalid(undefined)
    onConfirm(value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="presenca-titulo" className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-lg">
        <h2 id="presenca-titulo" className="font-display text-xl font-extrabold break-words">
          Presença de {name}
        </h2>
        <p className="mt-1 text-sm break-words text-ink-soft">{activity}</p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-5">
          <Field id="presenca-horas" label="Horas no turno" hint="Somam no painel do voluntário." error={invalid} required>
            {(control) => <TextInput {...control} ref={inputRef} inputMode="decimal" value={hours} onChange={(event) => setHours(event.target.value)} />}
          </Field>

          {error && <StateMessage tone="error" title="A presença não foi registrada" description={error} />}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" tone="ink" variant="outline" onClick={onClose} disabled={pending}>
              Voltar
            </Button>
            <Button type="submit" tone="success" disabled={pending}>
              {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              Registrar presença
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
