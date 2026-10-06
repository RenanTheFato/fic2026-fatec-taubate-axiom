import type { ComponentProps, ReactNode } from "react"
import { cn } from "../../utils/cn"

// Campos próprios. O que o componente resolve não é a aparência, e sim a ligação
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
  /**
   * Esconde o rótulo da vista, mas nunca do leitor de tela. Serve onde o
   * contexto já nomeia o campo, como uma célula sob o cabeçalho "Estoque":
   * repetir a palavra ali rouba a largura que a tabela não tem.
   */
  hideLabel?: boolean
  children: (control: FieldControl) => ReactNode
}

export function Field({ id, label, hint, error, required, hideLabel, children }: FieldProps) {
  const hintId = hint ? `${id}-dica` : undefined
  const errorId = error ? `${id}-erro` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  // Três blocos, sempre nesta ordem: cabeçalho (rótulo + dica), controle e erro.
  // A dica mora dentro do cabeçalho de propósito, porque é isso que permite ao
  // `FieldRow` alinhar os controles de dois campos vizinhos por `subgrid`.
  return (
    <div className="grid content-start gap-2">
      <div className={cn("grid gap-1", hideLabel && "sr-only")}>
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
      </div>

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

type FieldRowProps = {
  children: ReactNode
  className?: string
}

// Dois campos lado a lado só ficam alinhados se rótulo, controle e mensagem de
// erro de cada um caírem nas mesmas três linhas. Empilhados numa coluna cada um,
// um campo com dica desce o próprio controle e não o do vizinho, que é
// exatamente o desalinho que se vê num formulário com "Telefone (dica)" ao lado
// de "Assunto".
//
// `subgrid` resolve isso sem altura fixa: a linha declara as três faixas e cada
// campo empresta as mesmas, então a faixa do cabeçalho tem a altura do maior
// dos dois e os controles começam juntos. Abaixo de `sm` a linha vira coluna
// simples e nada disso se aplica, porque não há vizinho com quem alinhar.
export function FieldRow({ children, className }: FieldRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        "sm:grid sm:grid-cols-2 sm:grid-rows-[auto_auto_auto] sm:gap-x-5 sm:gap-y-2",
        "sm:[&>*]:row-span-3 sm:[&>*]:grid-rows-subgrid",
        className,
      )}
    >
      {children}
    </div>
  )
}

const CONTROL =
  "w-full rounded-tile border-2 border-line bg-surface px-4 py-3 text-base text-ink " +
  "transition-colors placeholder:text-ink-soft/70 hover:border-ink-soft/40 " +
  "aria-[invalid=true]:border-primary"

type TextInputProps = ComponentProps<"input">

export function TextInput({ className, ...rest }: TextInputProps) {
  return <input {...rest} className={cn(CONTROL, "min-h-12", className)} />
}

type TextAreaProps = ComponentProps<"textarea">

export function TextArea({ className, rows = 5, ...rest }: TextAreaProps) {
  return <textarea {...rest} rows={rows} className={cn(CONTROL, "resize-y", className)} />
}

type SelectProps = ComponentProps<"select">

export function SelectInput({ className, children, ...rest }: SelectProps) {
  return (
    <select {...rest} className={cn(CONTROL, "min-h-12", className)}>
      {children}
    </select>
  )
}

type CheckboxProps = ComponentProps<"input"> & {
  label: string
}

// A caixa de marcar vive dentro do próprio rótulo, então a área clicável é a
// linha inteira e não um quadrado de 16px. O estado marcado é desenhado pela
// borda e pelo fundo, e não só pelo símbolo dentro da caixa, porque quem
// enxerga pouco precisa distinguir a opção escolhida à distância.
export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-tile border-2 border-line bg-surface px-4 py-2.5 transition-colors hover:border-ink-soft/40 has-[:checked]:border-institutional has-[:checked]:bg-institutional-soft">
      <input type="checkbox" {...rest} className={cn("size-4 shrink-0 accent-primary", className)} />
      <span className="font-display text-sm font-bold text-ink">{label}</span>
    </label>
  )
}

type CheckboxGroupProps = {
  id: string
  legend: string
  hint?: string
  error?: string
  required?: boolean
  columns?: 2 | 3
  children: ReactNode
}

const COLUMNS: Record<2 | 3, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
}

// Um conjunto de opções é um campo só, e por isso é `fieldset` com `legend`: o
// leitor de tela anuncia a pergunta antes de cada opção, em vez de ler quatro
// caixas soltas. O `tabIndex` negativo existe para o mesmo motivo do `Field`:
// quando a validação falha, o foco precisa ter para onde ir.
export function CheckboxGroup({ id, legend, hint, error, required, columns = 3, children }: CheckboxGroupProps) {
  const hintId = hint ? `${id}-dica` : undefined
  const errorId = error ? `${id}-erro` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      className="grid content-start gap-2 focus:outline-none"
    >
      <legend className="font-display text-sm font-bold text-ink">
        {legend}
        {required && (
          <span className="ml-1 text-primary" aria-hidden="true">
            *
          </span>
        )}
      </legend>

      {hint && (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}

      <div className={cn("mt-1 grid gap-3", COLUMNS[columns])}>{children}</div>

      {error && (
        <p id={errorId} className="text-sm font-semibold text-primary">
          {error}
        </p>
      )}
    </fieldset>
  )
}
