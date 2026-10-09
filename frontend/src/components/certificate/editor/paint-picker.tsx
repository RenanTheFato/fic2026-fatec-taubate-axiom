import { Ban, Plus, X } from "lucide-react"
import { useState } from "react"
import type { CertificatePaint, CertificatePalette } from "../../../types/certificate-types"
import { cn } from "../../../utils/cn"
import { THEME_SWATCHES, isHex } from "../certificate-design"
import { isGradient, paintStops, resolveColor } from "../certificate-layout"
import { PopoverPanel, Segmented, SliderField } from "./editor-controls"
import { usePopover } from "./use-popover"

function paintCss(paint: CertificatePaint | null, palette: CertificatePalette): string {
  if (!paint) return "transparent"
  if (!isGradient(paint)) return resolveColor(paint, palette)

  // O ângulo do certificado conta da esquerda para a direita; o do CSS, de baixo
  // para cima. A diferença é um quarto de volta.
  return `linear-gradient(${paint.angle + 90}deg, ${paintStops(paint, palette).join(", ")})`
}

function themeLabel(color: string): string | null {
  return THEME_SWATCHES.find((swatch) => swatch.color === color)?.label ?? null
}

function paintLabel(paint: CertificatePaint | null, palette: CertificatePalette): string {
  if (!paint) return "Nenhuma"
  if (isGradient(paint)) return `Degradê de ${paint.stops.length} cores`

  return themeLabel(paint) ?? resolveColor(paint, palette)
}

type ColorChooserProps = {
  value: string
  palette: CertificatePalette
  onChange: (color: string) => void
  label: string
}

// Cores do tema primeiro, porque são as que acompanham a troca de paleta; a
// cor própria, por seletor ou por hex colado, logo abaixo.
function ColorChooser({ value, palette, onChange, label }: ColorChooserProps) {
  const resolved = resolveColor(value, palette)
  const [draft, setDraft] = useState(resolved)
  const [synced, setSynced] = useState(resolved)

  if (synced !== resolved) {
    setSynced(resolved)
    setDraft(resolved)
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label={`${label}: cores do tema`} className="grid grid-cols-9 gap-1">
        {THEME_SWATCHES.map((swatch) => (
          <button
            key={swatch.color}
            type="button"
            title={swatch.label}
            aria-label={swatch.label}
            aria-pressed={value === swatch.color}
            onClick={() => onChange(swatch.color)}
            className={cn(
              "size-6 rounded-full border border-line transition-transform hover:scale-110",
              value === swatch.color && "ring-2 ring-ink ring-offset-2",
            )}
            style={{ backgroundColor: resolveColor(swatch.color, palette) }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={resolved.toLowerCase()}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label={`${label}: cor própria`}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-tile border border-line bg-surface p-0.5"
        />
        <input
          value={draft}
          aria-label={`${label}: hex`}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value.trim()
            setDraft(next)

            if (isHex(next)) onChange(next.toUpperCase())
          }}
          className="h-8 min-w-0 flex-1 rounded-tile border border-line px-2 font-mono text-xs uppercase outline-none focus:border-ink"
        />
      </div>
    </div>
  )
}

type PaintPickerProps = {
  label: string
  value: CertificatePaint | null
  palette: CertificatePalette
  onChange: (value: CertificatePaint | null) => void
  allowGradient?: boolean
  allowNone?: boolean
}

export function PaintPicker({ label, value, palette, onChange, allowGradient = true, allowNone = false }: PaintPickerProps) {
  const { open, anchor, panel, toggle } = usePopover()
  const mode = value === null ? "none" : isGradient(value) ? "gradient" : "solid"

  function setMode(next: "none" | "solid" | "gradient") {
    if (next === "none") onChange(null)
    if (next === "solid") onChange(value && isGradient(value) ? value.stops[0] : (value ?? "@primary"))
    if (next === "gradient") {
      const first = value && !isGradient(value) ? value : "@primary"
      onChange({ stops: [first, "@secondary"], angle: 0 })
    }
  }

  const modes = [
    ...(allowNone ? [{ value: "none" as const, label: "Nenhuma" }] : []),
    { value: "solid" as const, label: "Sólida" },
    ...(allowGradient ? [{ value: "gradient" as const, label: "Degradê" }] : []),
  ]

  return (
    <div className="relative flex flex-col gap-1">
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      <button
        ref={anchor}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggle}
        className="flex h-8 items-center gap-2 rounded-tile border border-line bg-surface px-2 text-left text-xs hover:border-ink"
      >
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full border border-line"
          style={{ background: paintCss(value, palette) }}
          aria-hidden="true"
        >
          {value === null && <Ban className="size-3.5 text-ink-soft" />}
        </span>
        <span className="min-w-0 truncate">{paintLabel(value, palette)}</span>
        <span className="sr-only">: mudar {label.toLowerCase()}</span>
      </button>

      <PopoverPanel open={open} panelRef={panel} label={label} className="w-72">
        <div className="flex flex-col gap-3">
          {modes.length > 1 && <Segmented label={`Tipo de ${label.toLowerCase()}`} value={mode} options={modes} onChange={setMode} />}

          {value !== null && !isGradient(value) && <ColorChooser value={value} palette={palette} onChange={onChange} label={label} />}

          {value !== null && isGradient(value) && (
            <div className="flex flex-col gap-3">
              {value.stops.map((stop, index) => (
                <div key={index} className="flex flex-col gap-1.5 rounded-tile border border-line p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Cor {index + 1}</span>
                    {value.stops.length > 2 && (
                      <button
                        type="button"
                        aria-label={`Tirar a cor ${index + 1} do degradê`}
                        onClick={() => onChange({ ...value, stops: value.stops.filter((_, position) => position !== index) })}
                        className="rounded-tile p-1 text-ink-soft hover:bg-surface-muted"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <ColorChooser
                    value={stop}
                    palette={palette}
                    label={`Cor ${index + 1}`}
                    onChange={(color) => onChange({ ...value, stops: value.stops.map((item, position) => (position === index ? color : item)) })}
                  />
                </div>
              ))}
              {value.stops.length < 3 && (
                <button
                  type="button"
                  onClick={() => onChange({ ...value, stops: [...value.stops, "@accent"] })}
                  className="inline-flex items-center gap-1.5 self-start rounded-tile px-2 py-1 text-xs font-semibold hover:bg-surface-muted"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Terceira cor
                </button>
              )}
              <SliderField label="Direção" value={value.angle} min={0} max={360} step={5} format={(angle) => `${angle}°`} onChange={(angle) => onChange({ ...value, angle })} />
            </div>
          )}
        </div>
      </PopoverPanel>
    </div>
  )
}
