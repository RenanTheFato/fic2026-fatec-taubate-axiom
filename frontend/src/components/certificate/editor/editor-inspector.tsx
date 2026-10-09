import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  Bold,
  BringToFront,
  CaseUpper,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  FlipHorizontal2,
  FlipVertical2,
  Italic,
  Lock,
  LockOpen,
  Minus,
  SendToBack,
  Square,
  Trash2,
  Underline,
} from "lucide-react"
import { useEffect, useRef } from "react"
import type { KeyboardEvent } from "react"
import type {
  CertificateAsset,
  CertificateElement,
  CertificateFont,
  CertificateImage,
  CertificatePaint,
  CertificateShape,
  CertificateText,
} from "../../../types/certificate-types"
import { cn } from "../../../utils/cn"
import { assetUrl } from "../../../services/certificate/certificate-assets-service"
import { FIELD_INFO, elementLabel } from "../certificate-design"
import type { CanvasAsset } from "../certificate-artboard"
import { FONT_FAMILIES, FONT_ORDER, cssFont, ensureFaces, faceKey, fontStyle } from "../certificate-fonts"
import { NumberField, PanelSection, PopoverPanel, Segmented, SliderField, ToolButton } from "./editor-controls"
import { usePopover } from "./use-popover"
import { normalizeAngle } from "./editor-geometry"
import { MOD } from "./editor-keys"
import { PaintPicker } from "./paint-picker"
import type { AlignEdge, DesignEditor } from "./use-design-editor"


const ALIGN_BUTTONS: { edge: AlignEdge; label: string; icon: typeof AlignStartVertical }[] = [
  { edge: "left", label: "Alinhar à esquerda", icon: AlignStartVertical },
  { edge: "hcenter", label: "Centralizar na horizontal", icon: AlignCenterVertical },
  { edge: "right", label: "Alinhar à direita", icon: AlignEndVertical },
  { edge: "top", label: "Alinhar ao topo", icon: AlignStartHorizontal },
  { edge: "vcenter", label: "Centralizar na vertical", icon: AlignCenterHorizontal },
  { edge: "bottom", label: "Alinhar à base", icon: AlignEndHorizontal },
]

function Arrange({ editor, ids }: { editor: DesignEditor; ids: string[] }) {
  return (
    <PanelSection title="Camada">
      <div className="flex flex-wrap gap-1">
        <ToolButton icon={BringToFront} label="Trazer para a frente" shortcut={`${MOD}+Shift+]`} onClick={() => editor.arrange(ids, "front")} />
        <ToolButton icon={ChevronUp} label="Avançar uma camada" shortcut={`${MOD}+]`} onClick={() => editor.arrange(ids, "forward")} />
        <ToolButton icon={ChevronDown} label="Recuar uma camada" shortcut={`${MOD}+[`} onClick={() => editor.arrange(ids, "backward")} />
        <ToolButton icon={SendToBack} label="Enviar para trás" shortcut={`${MOD}+Shift+[`} onClick={() => editor.arrange(ids, "back")} />
      </div>
    </PanelSection>
  )
}

function Align({ editor, ids, title }: { editor: DesignEditor; ids: string[]; title: string }) {
  return (
    <PanelSection title={title}>
      <div className="flex flex-wrap gap-1">
        {ALIGN_BUTTONS.map((button) => (
          <ToolButton key={button.edge} icon={button.icon} label={button.label} onClick={() => editor.align(ids, button.edge)} />
        ))}
        {ids.length > 1 && (
          <>
            <ToolButton
              icon={AlignHorizontalDistributeCenter}
              label="Distribuir na horizontal"
              disabled={ids.length < 3}
              onClick={() => editor.distribute(ids, "x")}
            />
            <ToolButton
              icon={AlignVerticalDistributeCenter}
              label="Distribuir na vertical"
              disabled={ids.length < 3}
              onClick={() => editor.distribute(ids, "y")}
            />
          </>
        )}
      </div>
    </PanelSection>
  )
}

function Actions({ editor, elements }: { editor: DesignEditor; elements: CertificateElement[] }) {
  const ids = elements.map((element) => element.id)
  const locked = elements.every((element) => element.locked)

  return (
    <div className="flex flex-wrap gap-1 px-4 py-3">
      <ToolButton
        icon={locked ? LockOpen : Lock}
        label={locked ? "Destravar" : "Travar"}
        showLabel
        shortcut={`${MOD}+L`}
        onClick={() => editor.updateElements(ids, { locked: !locked })}
      />
      <ToolButton icon={Copy} label="Duplicar" showLabel shortcut={`${MOD}+D`} onClick={() => editor.duplicate(ids)} />
      <ToolButton icon={Trash2} label="Excluir" showLabel tone="danger" shortcut="Delete" onClick={() => editor.remove(ids)} />
    </div>
  )
}

// Fonte

function FontPicker({ value, onChange }: { value: CertificateFont; onChange: (font: CertificateFont) => void }) {
  const { open, setOpen, anchor, panel, toggle } = usePopover()
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    ensureFaces(FONT_ORDER.map((font) => faceKey(font, false, false)))
    list.current?.querySelector<HTMLButtonElement>("[aria-selected='true']")?.focus()
  }, [open])

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return

    event.preventDefault()
    const options = [...(list.current?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? [])]
    const index = options.indexOf(document.activeElement as HTMLButtonElement)
    options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus()
  }

  const current = cssFont(faceKey(value, false, false))

  return (
    <div className="relative flex flex-col gap-1">
      <span className="text-xs font-semibold text-ink-soft">Fonte</span>
      <button
        ref={anchor}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        className="flex h-9 items-center justify-between gap-2 rounded-tile border border-line bg-surface px-3 text-left hover:border-ink"
      >
        <span style={{ fontFamily: current.fontFamily, fontSize: "1rem" }}>{FONT_FAMILIES[value].label}</span>
        <ChevronDown className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
      </button>

      <PopoverPanel open={open} panelRef={panel} label="Fontes" className="w-full p-1.5">
        <div ref={list} role="listbox" aria-label="Fontes" onKeyDown={onKey} className="flex flex-col">
          {FONT_ORDER.map((font) => {
            const face = cssFont(faceKey(font, false, false))

            return (
              <button
                key={font}
                type="button"
                role="option"
                aria-selected={font === value}
                onClick={() => {
                  onChange(font)
                  setOpen(false)
                  anchor.current?.focus()
                }}
                className={cn("flex flex-col rounded-tile px-2 py-1.5 text-left hover:bg-surface-muted", font === value && "bg-surface-muted")}
              >
                <span style={{ fontFamily: face.fontFamily, fontSize: "1.0625rem", lineHeight: 1.3 }}>{FONT_FAMILIES[font].label}</span>
                <span className="text-[0.6875rem] text-ink-soft">{FONT_FAMILIES[font].hint}</span>
              </button>
            )
          })}
        </div>
      </PopoverPanel>
    </div>
  )
}

function TextSection({ editor, element }: { editor: DesignEditor; element: CertificateText }) {
  const content = useRef<HTMLTextAreaElement>(null)
  const set = (change: Partial<CertificateText>, coalesce?: string) => editor.updateElements([element.id], change, coalesce)
  const canBold = fontStyle(element.font, true, element.italic).startsWith("bold")
  const canItalic = fontStyle(element.font, element.bold, true).endsWith("italic")

  function insertField(key: string) {
    const field = content.current
    const token = `{{${key}}}`
    const start = field?.selectionStart ?? element.content.length
    const end = field?.selectionEnd ?? element.content.length

    set({ content: element.content.slice(0, start) + token + element.content.slice(end) })
    requestAnimationFrame(() => {
      field?.focus()
      field?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  return (
    <PanelSection title="Texto">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-soft">Conteúdo</span>
        <textarea
          ref={content}
          value={element.content}
          rows={3}
          onChange={(event) => set({ content: event.target.value }, `conteudo:${element.id}`)}
          className="min-h-16 resize-y rounded-tile border border-line px-2 py-1.5 text-sm outline-none focus:border-ink"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-soft">Inserir dado do recibo</span>
        <select
          value=""
          onChange={(event) => event.target.value && insertField(event.target.value)}
          className="h-8 rounded-tile border border-line bg-surface px-2 text-xs outline-none focus:border-ink"
        >
          <option value="">Escolha um dado</option>
          {FIELD_INFO.map((field) => (
            <option key={field.key} value={field.key}>
              {field.label}
            </option>
          ))}
        </select>
      </label>

      <FontPicker value={element.font} onChange={(font) => set({ font })} />

      <div className="grid grid-cols-[5.5rem_1fr] items-end gap-2">
        <NumberField label="Tamanho" value={element.size} min={4} max={160} step={0.5} suffix="pt" onChange={(size) => set({ size }, `tamanho:${element.id}`)} />
        <div className="flex gap-0.5 rounded-tile border border-line p-0.5">
          <ToolButton icon={Bold} label="Negrito" shortcut={`${MOD}+B`} pressed={element.bold} disabled={!canBold && !element.bold} onClick={() => set({ bold: !element.bold })} />
          <ToolButton icon={Italic} label="Itálico" shortcut={`${MOD}+I`} pressed={element.italic} disabled={!canItalic && !element.italic} onClick={() => set({ italic: !element.italic })} />
          <ToolButton icon={Underline} label="Sublinhado" shortcut={`${MOD}+U`} pressed={element.underline} onClick={() => set({ underline: !element.underline })} />
          <ToolButton icon={CaseUpper} label="Tudo em maiúsculas" pressed={element.uppercase} onClick={() => set({ uppercase: !element.uppercase })} />
        </div>
      </div>

      <Segmented
        label="Alinhamento do texto"
        value={element.align}
        onChange={(align) => set({ align })}
        options={[
          { value: "left", label: "À esquerda", icon: AlignLeft },
          { value: "center", label: "Centralizado", icon: AlignCenter },
          { value: "right", label: "À direita", icon: AlignRight },
        ]}
      />

      <PaintPicker label="Cor" value={element.color} palette={editor.design.palette} onChange={(color) => color && set({ color }, `cor:${element.id}`)} />

      <SliderField
        label="Espaço entre letras"
        value={element.letter_spacing}
        min={-2}
        max={20}
        step={0.2}
        format={(value) => `${value.toFixed(1).replace(".", ",")} pt`}
        onChange={(letter_spacing) => set({ letter_spacing }, `letras:${element.id}`)}
      />
      <SliderField
        label="Entrelinha"
        value={element.line_height}
        min={0.8}
        max={2.5}
        step={0.05}
        format={(value) => value.toFixed(2).replace(".", ",")}
        onChange={(line_height) => set({ line_height }, `linhas:${element.id}`)}
      />

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-soft">Quando não couber</span>
        <Segmented
          label="Quando o texto não couber"
          value={element.fit}
          onChange={(fit) => set({ fit })}
          options={[
            { value: "wrap", label: "Quebrar linha" },
            { value: "shrink", label: "Reduzir a letra" },
          ]}
        />
      </div>
    </PanelSection>
  )
}

function ShapeSection({ editor, element }: { editor: DesignEditor; element: CertificateShape }) {
  const palette = editor.design.palette
  const set = (change: Partial<CertificateShape>, coalesce?: string) => editor.updateElements([element.id], change, coalesce)

  function changeShape(shape: CertificateShape["shape"]) {
    if (shape === element.shape) return

    if (shape === "line") {
      const thickness = Math.max(element.stroke_width, 2)
      set({ shape, height: thickness, y: element.y + element.height / 2 - thickness / 2, fill: null, stroke: element.stroke ?? "@accent", stroke_width: thickness })
      return
    }

    const height = element.shape === "line" ? 100 : element.height
    set({ shape, height, y: element.shape === "line" ? element.y - height / 2 : element.y, fill: element.fill ?? "@primary" })
  }

  return (
    <PanelSection title="Forma">
      <Segmented
        label="Tipo de forma"
        value={element.shape}
        onChange={changeShape}
        options={[
          { value: "rect", label: "Retângulo", icon: Square },
          { value: "ellipse", label: "Elipse", icon: Circle },
          { value: "line", label: "Linha", icon: Minus },
        ]}
      />
      {element.shape !== "line" && (
        <PaintPicker label="Preenchimento" value={element.fill} palette={palette} allowNone onChange={(fill: CertificatePaint | null) => set({ fill }, `fundo:${element.id}`)} />
      )}
      <PaintPicker label="Contorno" value={element.stroke} palette={palette} allowNone={element.shape !== "line"} onChange={(stroke) => set({ stroke }, `traco:${element.id}`)} />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Espessura"
          value={element.stroke_width}
          min={0}
          max={40}
          step={0.2}
          suffix="pt"
          onChange={(stroke_width) =>
            set(
              element.shape === "line"
                ? { stroke_width, height: Math.max(stroke_width, 0.5), y: element.y + element.height / 2 - Math.max(stroke_width, 0.5) / 2 }
                : { stroke_width },
              `espessura:${element.id}`,
            )
          }
        />
        {element.shape === "rect" && (
          <NumberField label="Cantos" value={element.radius} min={0} max={400} suffix="pt" onChange={(radius) => set({ radius }, `cantos:${element.id}`)} />
        )}
      </div>
      <Segmented
        label="Estilo do traço"
        value={element.dash}
        onChange={(dash) => set({ dash })}
        options={[
          { value: "solid", label: "Contínuo" },
          { value: "dashed", label: "Tracejado" },
          { value: "dotted", label: "Pontilhado" },
        ]}
      />
    </PanelSection>
  )
}

function ImageSection({ editor, element, library, assets }: { editor: DesignEditor; element: CertificateImage; library: CertificateAsset[]; assets: Map<string, CanvasAsset> }) {
  const { open, setOpen, anchor, panel, toggle } = usePopover()

  return (
    <PanelSection title="Imagem">
      <div className="flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-tile border border-line bg-surface-muted">
          <img src={assetUrl(element.asset_id)} alt="" className="max-h-full max-w-full object-contain" />
        </span>
        <div className="relative min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{assets.get(element.asset_id)?.name ?? "Imagem"}</p>
          <button
            ref={anchor}
            type="button"
            aria-expanded={open}
            onClick={toggle}
            className="text-xs font-semibold text-ink underline underline-offset-2"
          >
            Trocar imagem
          </button>
          <PopoverPanel open={open} panelRef={panel} label="Trocar imagem" align="end" className="w-60">
            <ul className="grid max-h-64 grid-cols-3 gap-1.5 overflow-y-auto">
              {library.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    title={asset.name}
                    aria-label={asset.name}
                    onClick={() => {
                      const height = Math.round((element.width * asset.height) / asset.width)
                      editor.updateElements([element.id], { asset_id: asset.id, height })
                      setOpen(false)
                    }}
                    className="flex aspect-square w-full items-center justify-center rounded-tile border border-line bg-surface-muted p-1 hover:border-ink"
                  >
                    <img src={assetUrl(asset.id)} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
                  </button>
                </li>
              ))}
            </ul>
          </PopoverPanel>
        </div>
      </div>
      <div className="flex gap-1">
        <ToolButton icon={FlipHorizontal2} label="Espelhar na horizontal" showLabel pressed={element.flip_x} onClick={() => editor.updateElements([element.id], { flip_x: !element.flip_x })} />
        <ToolButton icon={FlipVertical2} label="Espelhar na vertical" showLabel pressed={element.flip_y} onClick={() => editor.updateElements([element.id], { flip_y: !element.flip_y })} />
      </div>
    </PanelSection>
  )
}

function Geometry({ editor, element }: { editor: DesignEditor; element: CertificateElement }) {
  const set = (change: Partial<CertificateElement>, key: string) => editor.updateElements([element.id], change, `${key}:${element.id}`)
  const ratio = element.height / element.width
  const keepsRatio = element.type === "image" || element.type === "logo" || element.type === "qr"
  const autoHeight = element.type === "text" || (element.type === "shape" && element.shape === "line")

  return (
    <PanelSection title="Posição e tamanho">
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={element.x} step={1} suffix="pt" disabled={element.locked} onChange={(x) => set({ x }, "x")} />
        <NumberField label="Y" value={element.y} step={1} suffix="pt" disabled={element.locked} onChange={(y) => set({ y }, "y")} />
        <NumberField
          label="Largura"
          value={element.width}
          min={element.type === "text" ? 20 : 8}
          max={1683}
          suffix="pt"
          disabled={element.locked}
          onChange={(width) => set(keepsRatio ? { width, height: Math.round(width * ratio * 100) / 100 } : { width }, "largura")}
        />
        <NumberField
          label="Altura"
          value={element.height}
          min={8}
          max={1683}
          suffix="pt"
          disabled={element.locked || autoHeight}
          onChange={(height) => set(keepsRatio ? { height, width: Math.round((height / ratio) * 100) / 100 } : { height }, "altura")}
        />
        <NumberField
          label="Giro"
          value={element.rotation}
          min={-180}
          max={180}
          suffix="°"
          disabled={element.locked}
          onChange={(rotation) => set({ rotation: normalizeAngle(rotation) }, "giro")}
        />
      </div>
      <SliderField
        label="Opacidade"
        value={Math.round(element.opacity * 100)}
        min={5}
        max={100}
        format={(value) => `${value}%`}
        onChange={(value) => set({ opacity: value / 100 }, "opacidade")}
      />
    </PanelSection>
  )
}

type InspectorProps = {
  editor: DesignEditor
  library: CertificateAsset[]
  assets: Map<string, CanvasAsset>
}

export function EditorInspector({ editor, library, assets }: InspectorProps) {
  const { design, selection } = editor
  const elements = design.elements.filter((element) => selection.includes(element.id))
  const ids = elements.map((element) => element.id)

  if (elements.length === 0) {
    const background = design.background

    return (
      <div>
        <h2 className="border-b border-line px-4 py-3 font-display text-sm font-bold">Página</h2>
        <PanelSection title="Fundo">
          <PaintPicker
            label="Cor do papel"
            value={background.color}
            palette={design.palette}
            allowGradient={false}
            onChange={(color) => color && editor.commit((current) => ({ ...current, background: { ...current.background, color: color as string } }), "fundo-cor")}
          />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-soft">Imagem de fundo</span>
            <select
              value={background.asset_id ?? ""}
              onChange={(event) =>
                editor.commit((current) => ({
                  ...current,
                  background: { ...current.background, asset_id: event.target.value || null, opacity: current.background.asset_id ? current.background.opacity : 0.6 },
                }))
              }
              className="h-8 rounded-tile border border-line bg-surface px-2 text-xs outline-none focus:border-ink"
            >
              <option value="">Sem imagem</option>
              {library.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </label>
          {background.asset_id && (
            <SliderField
              label="Intensidade da imagem"
              value={Math.round(background.opacity * 100)}
              min={5}
              max={100}
              format={(value) => `${value}%`}
              onChange={(value) => editor.commit((current) => ({ ...current, background: { ...current.background, opacity: value / 100 } }), "fundo-intensidade")}
            />
          )}
        </PanelSection>
      </div>
    )
  }

  if (elements.length > 1) {
    return (
      <div>
        <h2 className="border-b border-line px-4 py-3 font-display text-sm font-bold">{elements.length} elementos</h2>
        <Align editor={editor} ids={ids} title="Alinhar entre si" />
        <Arrange editor={editor} ids={ids} />
        <Actions editor={editor} elements={elements} />
      </div>
    )
  }

  const element = elements[0]

  return (
    <div>
      <h2 className="truncate border-b border-line px-4 py-3 font-display text-sm font-bold" title={elementLabel(element, assets)}>
        {elementLabel(element, assets)}
      </h2>
      {element.type === "text" && <TextSection key={element.id} editor={editor} element={element} />}
      {element.type === "shape" && <ShapeSection editor={editor} element={element} />}
      {element.type === "image" && <ImageSection editor={editor} element={element} library={library} assets={assets} />}
      {element.type === "qr" && (
        <PanelSection title="QR de verificação">
          <PaintPicker
            label="Cor"
            value={element.color}
            palette={design.palette}
            allowGradient={false}
            onChange={(color) => color && editor.updateElements([element.id], { color: color as string }, `cor:${element.id}`)}
          />
        </PanelSection>
      )}
      <Geometry editor={editor} element={element} />
      <Align editor={editor} ids={ids} title="Alinhar na página" />
      <Arrange editor={editor} ids={ids} />
      <Actions editor={editor} elements={elements} />
    </div>
  )
}
