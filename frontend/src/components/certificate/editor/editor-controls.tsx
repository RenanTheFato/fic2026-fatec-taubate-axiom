import type { LucideIcon } from "lucide-react"
import { useId, useState } from "react"
import type { ButtonHTMLAttributes, KeyboardEvent, ReactNode, Ref, RefObject } from "react"
import { cn } from "../../../utils/cn"

// As peças miúdas do editor. Um editor de slides tem dezenas de controles por
// tela, e os componentes de formulário do site (feitos para quem doa pelo
// celular) ocupariam o triplo do espaço. Estes são compactos, mas mantêm nome
// acessível, foco visível e alvo de toque de 32px.

type ToolButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: LucideIcon
  label: string
  /** Mostra o rótulo ao lado do ícone, e não só na dica. */
  showLabel?: boolean
  pressed?: boolean
  shortcut?: string
  tone?: "default" | "danger" | "primary"
  iconClassName?: string
  ref?: Ref<HTMLButtonElement>
}

export function ToolButton({ icon: Icon, label, showLabel, pressed, shortcut, tone = "default", className, iconClassName, ...rest }: ToolButtonProps) {
  const hint = shortcut ? `${label} (${shortcut})` : label

  return (
    <button
      type="button"
      aria-label={showLabel ? undefined : label}
      aria-pressed={pressed}
      title={hint}
      {...rest}
      className={cn(
        "inline-flex min-h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-tile px-2 text-sm font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        tone === "danger" && "text-primary hover:bg-primary-soft",
        tone === "primary" && "bg-ink text-white hover:brightness-125",
        tone === "default" && (pressed ? "bg-ink text-white" : "text-ink hover:bg-surface-muted"),
        className,
      )}
    >
      <Icon className={cn("size-4 shrink-0", iconClassName)} aria-hidden="true" />
      {showLabel && <span className="whitespace-nowrap">{label}</span>}
    </button>
  )
}

export function PanelSection({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const id = useId()

  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 border-b border-line px-4 py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <h3 id={id} className="font-display text-xs font-bold tracking-[0.12em] text-ink-soft uppercase">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  disabled?: boolean
  className?: string
}

// O número só é aplicado quando forma um valor válido, então apagar o campo
// para digitar outro não manda o elemento para o canto da página. Seta para
// cima e para baixo mudam de um em um, e com Shift de dez em dez.
export function NumberField({ label, value, onChange, min, max, step = 1, suffix, disabled, className }: NumberFieldProps) {
  const id = useId()
  const shown = String(Math.round(value * 100) / 100).replace(".", ",")
  const [draft, setDraft] = useState(shown)
  const [synced, setSynced] = useState(shown)

  if (synced !== shown) {
    setSynced(shown)
    setDraft(shown)
  }

  function clamp(next: number) {
    return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next))
  }

  function apply(text: string) {
    const parsed = Number(text.replace(",", "."))

    if (text.trim() !== "" && Number.isFinite(parsed)) onChange(clamp(parsed))
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return

    event.preventDefault()
    const delta = (event.key === "ArrowUp" ? 1 : -1) * step * (event.shiftKey ? 10 : 1)
    onChange(clamp(Math.round((value + delta) * 100) / 100))
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className="text-xs font-semibold text-ink-soft">
        {label}
      </label>
      <div className="flex h-8 items-center rounded-tile border border-line bg-surface focus-within:border-ink">
        <input
          id={id}
          inputMode="decimal"
          value={draft}
          disabled={disabled}
          onChange={(event) => {
            setDraft(event.target.value)
            apply(event.target.value)
          }}
          onBlur={() => setDraft(shown)}
          onKeyDown={onKeyDown}
          className="h-full w-full min-w-0 rounded-tile bg-transparent px-2 text-sm tabular-nums outline-none disabled:opacity-50"
        />
        {suffix && <span className="pr-2 text-xs text-ink-soft">{suffix}</span>}
      </div>
    </div>
  )
}

type SliderFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  onChange: (value: number) => void
}

export function SliderField({ label, value, min, max, step = 1, format, onChange }: SliderFieldProps) {
  const id = useId()

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-ink-soft">
          {label}
        </label>
        <span className="text-xs tabular-nums">{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-6 w-full accent-ink"
      />
    </div>
  )
}

type SegmentedOption<T extends string> = { value: T; label: string; icon?: LucideIcon; disabled?: boolean }

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-tile border border-line bg-surface-muted p-0.5">
      {options.map((option) => {
        const active = option.value === value
        const Icon = option.icon

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={Icon ? option.label : undefined}
            title={option.label}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-7 flex-1 items-center justify-center rounded-[0.375rem] px-2 text-xs font-semibold transition-colors disabled:opacity-40",
              active ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink",
            )}
          >
            {Icon ? <Icon className="size-4" aria-hidden="true" /> : option.label}
          </button>
        )
      })}
    </div>
  )
}

type PopoverPanelProps = {
  open: boolean
  panelRef: RefObject<HTMLDivElement | null>
  label: string
  align?: "start" | "end"
  className?: string
  children: ReactNode
}

export function PopoverPanel({ open, panelRef, label, align = "start", className, children }: PopoverPanelProps) {
  if (!open) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={label}
      className={cn(
        "absolute top-full z-40 mt-2 rounded-card border border-line bg-surface p-3 shadow-xl",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  )
}
