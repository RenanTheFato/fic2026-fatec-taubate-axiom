import {
  Circle,
  GripVertical,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  LockOpen,
  Minus,
  Palette,
  QrCode,
  Shapes,
  Square,
  Type,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useRef, useState } from "react"
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react"
import type { CertificateAsset, CertificateElement, CertificatePalette } from "../../../types/certificate-types"
import { cn } from "../../../utils/cn"
import { assetUrl } from "../../../services/certificate/certificate-assets-service"
import {
  FIELD_INFO,
  PALETTE_FIELDS,
  PALETTE_PRESETS,
  TEXT_PRESETS,
  createImage,
  createLogo,
  createQr,
  createShape,
  createText,
  elementLabel,
  isHex,
} from "../certificate-design"
import type { CanvasAsset } from "../certificate-artboard"
import { cssFont, faceKey } from "../certificate-fonts"
import { PanelSection } from "./editor-controls"
import type { DesignEditor } from "./use-design-editor"

export type SideTab = "elementos" | "imagens" | "camadas" | "tema"

const TABS: { value: SideTab; label: string; icon: LucideIcon }[] = [
  { value: "elementos", label: "Elementos", icon: Shapes },
  { value: "imagens", label: "Imagens", icon: ImageIcon },
  { value: "camadas", label: "Camadas", icon: Layers },
  { value: "tema", label: "Tema", icon: Palette },
]

const TYPE_ICON: Record<CertificateElement["type"], LucideIcon> = {
  text: Type,
  shape: Square,
  image: ImageIcon,
  logo: Shapes,
  qr: QrCode,
}

const TILE = "flex min-h-11 items-center gap-2 rounded-tile border border-line bg-surface px-3 py-2 text-left text-sm font-semibold transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"

function ElementsTab({ editor }: { editor: DesignEditor }) {
  const hasQr = editor.design.elements.some((element) => element.type === "qr")
  const hasLogo = editor.design.elements.some((element) => element.type === "logo")

  return (
    <>
      <PanelSection title="Texto">
        <div className="flex flex-col gap-2">
          {TEXT_PRESETS.map((preset) => {
            const font = cssFont(faceKey(preset.font, preset.bold, false))

            return (
              <button
                key={preset.value}
                type="button"
                onClick={() =>
                  editor.add([
                    createText(preset.value === "body" ? "Escreva aqui" : preset.label, {
                      font: preset.font,
                      size: preset.size,
                      bold: preset.bold,
                      width: preset.value === "body" ? 300 : 420,
                      color: preset.value === "title" ? "@primary" : "@ink",
                    }),
                  ])
                }
                className={cn(TILE, "justify-start")}
                style={{ fontFamily: font.fontFamily, fontWeight: font.fontWeight, fontSize: `${Math.min(preset.size, 26) / 16}rem` }}
              >
                {preset.value === "body" ? "Adicionar texto" : `Adicionar ${preset.label.toLowerCase()}`}
              </button>
            )
          })}
        </div>
      </PanelSection>

      <PanelSection title="Dados do recibo">
        <div className="flex flex-wrap gap-1.5">
          {FIELD_INFO.map((field) => (
            <button
              key={field.key}
              type="button"
              title={`{{${field.key}}}`}
              onClick={() => editor.add([createText(`{{${field.key}}}`, { width: field.key === "codigo" ? 480 : 300, font: field.key === "codigo" ? "courier" : "nunito", size: field.key === "codigo" ? 7 : 14 })])}
              className="rounded-pill border border-line bg-surface px-3 py-1.5 text-xs font-semibold transition-colors hover:border-ink"
            >
              {field.label}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Formas">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { shape: "rect", label: "Retângulo", icon: Square },
              { shape: "ellipse", label: "Elipse", icon: Circle },
              { shape: "line", label: "Linha", icon: Minus },
            ] as const
          ).map((item) => (
            <button key={item.shape} type="button" onClick={() => editor.add([createShape(item.shape)])} className={cn(TILE, "flex-col justify-center gap-1 text-xs")}>
              <item.icon className="size-6" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Da associação">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={hasLogo} onClick={() => editor.add([createLogo()])} className={TILE}>
            <Shapes className="size-5 shrink-0" aria-hidden="true" />
            Logo
          </button>
          <button type="button" disabled={hasQr} onClick={() => editor.add([createQr()])} className={TILE}>
            <QrCode className="size-5 shrink-0" aria-hidden="true" />
            QR
          </button>
        </div>
      </PanelSection>
    </>
  )
}

type ImagesTabProps = {
  editor: DesignEditor
  library: CertificateAsset[]
  uploading: boolean
  uploadError: string | null
  onUpload: (file: File) => Promise<CertificateAsset | null>
}

function ImagesTab({ editor, library, uploading, uploadError, onUpload }: ImagesTabProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    const asset = await onUpload(file)

    if (asset) editor.add([createImage(asset)])
  }

  return (
    <PanelSection title="Biblioteca">
      <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={handleFile} />
      <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className={cn(TILE, "justify-center")}>
        {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
        Enviar PNG ou JPEG
      </button>
      {uploadError && (
        <p role="alert" className="text-xs font-semibold text-primary">
          {uploadError}
        </p>
      )}

      <ul className="grid grid-cols-3 gap-2">
        {library.map((asset) => (
          <li key={asset.id}>
            <button
              type="button"
              title={asset.name}
              onClick={() => editor.add([createImage(asset)])}
              className="flex w-full flex-col gap-1 rounded-tile border border-line bg-surface p-1.5 text-center transition-colors hover:border-ink"
            >
              <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[0.375rem] bg-surface-muted">
                <img src={assetUrl(asset.id)} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
              </span>
              <span className="line-clamp-1 text-[0.6875rem] font-semibold break-all">{asset.name}</span>
              <span className="sr-only">: pôr na página</span>
            </button>
          </li>
        ))}
      </ul>
    </PanelSection>
  )
}

// As camadas de cima para baixo, como no painel de seleção do PowerPoint: o
// primeiro da lista é o que fica na frente. Arrastar reordena; com o teclado,
// Alt e as setas fazem o mesmo.
function LayersTab({ editor, assets }: { editor: DesignEditor; assets: Map<string, CanvasAsset> }) {
  const { design, selection, setSelection } = editor
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const total = design.elements.length
  const layers = [...design.elements].reverse()

  function drop(event: DragEvent, position: number) {
    event.preventDefault()

    if (dragging) editor.moveLayer(dragging, total - 1 - position)

    setDragging(null)
    setOver(null)
  }

  function onKey(event: KeyboardEvent, element: CertificateElement) {
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return

    event.preventDefault()
    editor.arrange([element.id], event.key === "ArrowUp" ? "forward" : "backward")
  }

  return (
    <PanelSection title={`${total} camadas`}>
      <ul className="flex flex-col gap-0.5">
        {layers.map((element, position) => {
          const Icon = TYPE_ICON[element.type]
          const active = selection.includes(element.id)

          return (
            <li
              key={element.id}
              draggable
              onDragStart={() => setDragging(element.id)}
              onDragOver={(event) => {
                event.preventDefault()
                setOver(position)
              }}
              onDragEnd={() => {
                setDragging(null)
                setOver(null)
              }}
              onDrop={(event) => drop(event, position)}
              className={cn(
                "group flex items-center gap-1 rounded-tile border-t-2 border-transparent",
                over === position && dragging !== element.id && "border-partner",
                active ? "bg-partner/10" : "hover:bg-surface-muted",
              )}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-ink-soft" aria-hidden="true" />
              <button
                type="button"
                aria-pressed={active}
                onClick={(event) =>
                  setSelection(
                    event.shiftKey ? (active ? selection.filter((id) => id !== element.id) : [...selection, element.id]) : [element.id],
                  )
                }
                onKeyDown={(event) => onKey(event, element)}
                className="flex min-h-8 min-w-0 flex-1 items-center gap-2 py-1 text-left text-xs"
              >
                <Icon className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                <span className={cn("truncate", active && "font-bold")}>{elementLabel(element, assets)}</span>
              </button>
              <button
                type="button"
                aria-label={element.locked ? `Destravar ${elementLabel(element, assets)}` : `Travar ${elementLabel(element, assets)}`}
                aria-pressed={element.locked}
                onClick={() => editor.updateElements([element.id], { locked: !element.locked })}
                className={cn(
                  "rounded-tile p-1.5 text-ink-soft hover:bg-surface hover:text-ink",
                  !element.locked && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                )}
              >
                {element.locked ? <Lock className="size-3.5" aria-hidden="true" /> : <LockOpen className="size-3.5" aria-hidden="true" />}
              </button>
            </li>
          )
        })}
      </ul>
    </PanelSection>
  )
}

function PaletteColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)

  if (synced !== value) {
    setSynced(value)
    setDraft(value)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value.toLowerCase()}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        aria-label={`${label}: escolher no seletor`}
        className="h-8 w-10 shrink-0 cursor-pointer rounded-tile border border-line bg-surface p-0.5"
      />
      <label className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-semibold text-ink-soft">{label}</span>
        <input
          value={draft}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value.trim()
            setDraft(next)
            if (isHex(next)) onChange(next.toUpperCase())
          }}
          className="h-7 min-w-0 rounded-tile border border-line px-2 font-mono text-xs uppercase outline-none focus:border-ink"
        />
      </label>
    </div>
  )
}

function ThemeTab({ editor }: { editor: DesignEditor }) {
  const { palette } = editor.design

  function setPalette(next: CertificatePalette, coalesce?: string) {
    editor.commit((design) => ({ ...design, palette: next }), coalesce)
  }

  return (
    <>
      <PanelSection title="Paletas">
        <div className="grid grid-cols-2 gap-2">
          {PALETTE_PRESETS.map((preset) => (
            <button key={preset.name} type="button" onClick={() => setPalette(preset.palette)} className={cn(TILE, "text-xs")}>
              <span className="flex shrink-0" aria-hidden="true">
                {[preset.palette.primary, preset.palette.secondary, preset.palette.accent].map((color) => (
                  <span key={color} className="-ml-1 size-4 rounded-full border border-surface first:ml-0" style={{ backgroundColor: color }} />
                ))}
              </span>
              {preset.name}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Cores do tema">
        <div className="flex flex-col gap-3">
          {PALETTE_FIELDS.map((field) => (
            <PaletteColor
              key={field.key}
              label={field.label}
              value={palette[field.key]}
              onChange={(value) => setPalette({ ...palette, [field.key]: value }, `tema:${field.key}`)}
            />
          ))}
        </div>
      </PanelSection>
    </>
  )
}

type EditorSidePanelProps = {
  editor: DesignEditor
  tab: SideTab
  onTab: (tab: SideTab) => void
  library: CertificateAsset[]
  assets: Map<string, CanvasAsset>
  uploading: boolean
  uploadError: string | null
  onUpload: (file: File) => Promise<CertificateAsset | null>
}

export function EditorSidePanel({ editor, tab, onTab, library, assets, uploading, uploadError, onUpload }: EditorSidePanelProps) {
  return (
    <div className="flex h-full min-h-0">
      <div role="tablist" aria-orientation="vertical" aria-label="Painéis do editor" className="flex w-16 shrink-0 flex-col gap-1 border-r border-line bg-surface-muted p-1.5">
        {TABS.map((item) => {
          const active = item.value === tab

          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`aba-${item.value}`}
              aria-selected={active}
              aria-controls={`painel-${item.value}`}
              onClick={() => onTab(item.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-tile px-1 py-2 text-[0.6875rem] font-semibold transition-colors",
                active ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:bg-surface hover:text-ink",
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={`painel-${tab}`} aria-labelledby={`aba-${tab}`} className="min-h-0 w-64 overflow-y-auto bg-surface">
        {tab === "elementos" && <ElementsTab editor={editor} />}
        {tab === "imagens" && (
          <ImagesTab editor={editor} library={library} uploading={uploading} uploadError={uploadError} onUpload={onUpload} />
        )}
        {tab === "camadas" && <LayersTab editor={editor} assets={assets} />}
        {tab === "tema" && <ThemeTab editor={editor} />}
      </div>
    </div>
  )
}
