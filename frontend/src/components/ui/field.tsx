import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"
import { cn } from "../../utils/cn"

// Campos próprios. O que o componente resolve não é a aparência — é a ligação
// entre rótulo, dica e erro: `htmlFor`, `aria-describedby` e `aria-invalid`
// saem daqui prontos, porque é justamente isso que se esquece de escrever à mão
// em cada formulário novo.

export type FieldControl = {
  id: string
  "aria-describedby": string | undefined
  "aria-invalid": boolean | undefined
  required?: boolean
}

type FieldProps = {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (control: FieldControl) => ReactNode
}

export function Field({ id, label, hint, error, required, children }: FieldProps) {
  const hintId = hint ? `${id}-dica` : undefined
  const errorId = error ? `${id}-erro` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-display text-sm font-bold text-ink">
        {label}
        {required && (
          <span className="ml-1 text-primary" aria-hidden="true">
            *
          </span>
        )}
        {!required && <span className="ml-2 font-sans text-xs font-normal text-ink-soft">(opcional)</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required,
      })}

      {error && (
        <p id={errorId} className="text-sm font-semibold text-primary">
          {error}
        </p>
      )}
    </div>
  )
}

const CONTROL =
  "w-full rounded-tile border-2 border-line bg-surface px-4 py-3 text-base text-ink " +
  "transition-colors placeholder:text-ink-soft/70 hover:border-ink-soft/40 " +
  "aria-[invalid=true]:border-primary"

type TextInputProps = InputHTMLAttributes<HTMLInputElement>

export function TextInput({ className, ...rest }: TextInputProps) {
  return <input {...rest} className={cn(CONTROL, "min-h-12", className)} />
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextArea({ className, rows = 5, ...rest }: TextAreaProps) {
  return <textarea {...rest} rows={rows} className={cn(CONTROL, "resize-y", className)} />
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function SelectInput({ className, children, ...rest }: SelectProps) {
  return (
    <select {...rest} className={cn(CONTROL, "min-h-12", className)}>
      {children}
    </select>
  )
}
