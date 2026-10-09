import { Lock } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent, MouseEvent, PointerEvent, RefObject } from "react"
import { CERTIFICATE_PAGE } from "../../../types/certificate-types"
import type { CertificateElement, CertificatePalette, CertificateText } from "../../../types/certificate-types"
import { CertificateArtboard } from "../certificate-artboard"
import type { CanvasAsset } from "../certificate-artboard"
import { cssFont } from "../certificate-fonts"
import { elementCenter, layoutText, paintStops } from "../certificate-layout"
import {
  HANDLE_VECTOR,
  contains,
  corners,
  elementBounds,
  handlesFor,
  resize,
  rotationFrom,
  round,
  snapBox,
  unionBounds,
} from "./editor-geometry"
import type { Box, Guide, Handle, Point } from "./editor-geometry"
import type { DesignEditor } from "./use-design-editor"

const { width: W, height: H } = CERTIFICATE_PAGE

// A cor da seleção e das guias é a magenta da marca: aparece sobre qualquer
// papel que a associação escolher e não se confunde com o desenho.
const ACCENT = "var(--color-partner)"

const CURSOR: Record<Handle, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
}

type Gesture =
  | { kind: "move"; start: Point; origins: Map<string, CertificateElement>; others: Box[]; moved: boolean; clicked: string; wasSelected: boolean }
  | { kind: "resize"; handle: Handle; origin: CertificateElement }
  | { kind: "rotate"; origin: CertificateElement }
  | { kind: "marquee"; start: Point; base: string[]; additive: boolean }
  | { kind: "pan"; x: number; y: number; left: number; top: number }

type TextEditorProps = {
  element: CertificateText
  palette: CertificatePalette
  zoom: number
  onChange: (content: string) => void
  onDone: () => void
}

// O texto é editado no lugar, numa caixa por cima dele, girada junto. A caixa
// mostra os campos como são escritos ({{nome}}), e não preenchidos: é ali que
// a pessoa decide onde o nome entra.
function InlineTextEditor({ element, palette, zoom, onChange, onDone }: TextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const raw = layoutText({ ...element, fit: "wrap" }, {})
  const font = cssFont(raw.face)
  const center = elementCenter(element)
  const height = Math.max(raw.height, element.height) + element.size * 0.8

  useEffect(() => {
    const field = ref.current

    if (!field) return

    field.focus()
    field.setSelectionRange(field.value.length, field.value.length)
  }, [])

  return (
    <g transform={element.rotation ? `rotate(${element.rotation} ${center.x} ${center.y})` : undefined}>
      <foreignObject x={element.x - 2} y={element.y} width={element.width + 4} height={height}>
        <textarea
          ref={ref}
          aria-label="Texto do elemento"
          value={element.content}
          spellCheck
          onChange={(event) => onChange(event.target.value)}
          onBlur={onDone}
          onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
            event.stopPropagation()

            if (event.key === "Escape") {
              event.preventDefault()
              onDone()
            }
          }}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            margin: 0,
            padding: "0 2px",
            border: 0,
            resize: "none",
            overflow: "hidden",
            background: "rgba(255, 255, 255, 0.88)",
            outline: `${1.5 / zoom}px solid ${ACCENT}`,
            fontFamily: font.fontFamily,
            fontWeight: font.fontWeight,
            fontStyle: font.fontStyle,
            fontSize: `${raw.size}px`,
            lineHeight: element.line_height,
            letterSpacing: `${element.letter_spacing}px`,
            textAlign: element.align,
            textTransform: element.uppercase ? "uppercase" : "none",
            color: paintStops(element.color, palette)[0],
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        />
      </foreignObject>
    </g>
  )
}

type SelectionProps = {
  elements: CertificateElement[]
  zoom: number
}

function Outline({ element, zoom, dashed }: { element: CertificateElement; zoom: number; dashed?: boolean }) {
  return (
    <polygon
      points={corners(element)
        .map((point) => `${point.x},${point.y}`)
        .join(" ")}
      fill="none"
      stroke={ACCENT}
      strokeWidth={1.25 / zoom}
      strokeDasharray={dashed ? `${4 / zoom} ${3 / zoom}` : undefined}
      pointerEvents="none"
    />
  )
}

function SelectionOverlay({ elements, zoom }: SelectionProps) {
  if (elements.length === 0) return null

  if (elements.length > 1) {
    const bounds = unionBounds(elements) as Box

    return (
      <g>
        {elements.map((element) => (
          <Outline key={element.id} element={element} zoom={zoom} />
        ))}
        <rect
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1 / zoom}
          strokeDasharray={`${5 / zoom} ${4 / zoom}`}
          pointerEvents="none"
        />
      </g>
    )
  }

  const element = elements[0]
  const center = elementCenter(element)
  const handle = 9 / zoom
  const knobDistance = 26 / zoom

  return (
    <g transform={element.rotation ? `rotate(${element.rotation} ${center.x} ${center.y})` : undefined}>
      <rect
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.5 / zoom}
        pointerEvents="none"
      />

      {element.locked ? (
        <Lock
          x={element.x + element.width - 8 / zoom}
          y={element.y - 22 / zoom}
          width={16 / zoom}
          height={16 / zoom}
          color={ACCENT}
          strokeWidth={2.4}
          aria-hidden="true"
          pointerEvents="none"
        />
      ) : (
        <>
          <line x1={center.x} y1={element.y} x2={center.x} y2={element.y - knobDistance} stroke={ACCENT} strokeWidth={1.25 / zoom} pointerEvents="none" />
          <circle
            data-handle="rotate"
            cx={center.x}
            cy={element.y - knobDistance}
            r={6 / zoom}
            fill="white"
            stroke={ACCENT}
            strokeWidth={1.5 / zoom}
            style={{ cursor: "grab" }}
          />
          {handlesFor(element).map((name) => {
            const vector = HANDLE_VECTOR[name]
            const hx = element.x + ((vector.x + 1) / 2) * element.width
            const hy = element.y + ((vector.y + 1) / 2) * element.height

            return (
              <rect
                key={name}
                data-handle={name}
                x={hx - handle / 2}
                y={hy - handle / 2}
                width={handle}
                height={handle}
                rx={2 / zoom}
                fill="white"
                stroke={ACCENT}
                strokeWidth={1.5 / zoom}
                style={{ cursor: CURSOR[name] }}
              />
            )
          })}
        </>
      )}
    </g>
  )
}

type EditorCanvasProps = {
  editor: DesignEditor
  fields: Record<string, string>
  assets: Map<string, CanvasAsset>
  zoom: number
  snapping: boolean
  panning: boolean
  editingId: string | null
  onEditText: (id: string | null) => void
  onContextMenu: (point: { x: number; y: number }) => void
  workspaceRef: RefObject<HTMLDivElement | null>
  svgRef: RefObject<SVGSVGElement | null>
}

export function EditorCanvas({
  editor,
  fields,
  assets,
  zoom,
  snapping,
  panning,
  editingId,
  onEditText,
  onContextMenu,
  workspaceRef,
  svgRef,
}: EditorCanvasProps) {
  const { design, selection, setSelection } = editor
  const gesture = useRef<Gesture | null>(null)
  const [guides, setGuides] = useState<Guide[]>([])
  const [marquee, setMarquee] = useState<Box | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [grabbing, setGrabbing] = useState(false)

  const selected = design.elements.filter((element) => selection.includes(element.id))
  const editing = design.elements.find((element) => element.id === editingId && element.type === "text") as CertificateText | undefined
  const hovered = hover && !selection.includes(hover) ? design.elements.find((element) => element.id === hover) : undefined

  function toPage(event: { clientX: number; clientY: number }): Point {
    const matrix = svgRef.current?.getScreenCTM()

    if (!matrix) return { x: 0, y: 0 }

    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())

    return { x: point.x, y: point.y }
  }

  function capture(event: PointerEvent) {
    svgRef.current?.setPointerCapture?.(event.pointerId)
  }

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    const target = event.target as Element
    setHover(null)

    if (target.closest("foreignObject")) return

    const workspace = workspaceRef.current

    if ((event.button === 1 || panning) && workspace) {
      event.preventDefault()
      gesture.current = { kind: "pan", x: event.clientX, y: event.clientY, left: workspace.scrollLeft, top: workspace.scrollTop }
      setGrabbing(true)
      capture(event)
      return
    }

    const point = toPage(event)
    const handle = target.closest("[data-handle]")?.getAttribute("data-handle")

    if (handle && selected.length === 1 && !selected[0].locked) {
      editor.gesture.start()
      gesture.current = handle === "rotate" ? { kind: "rotate", origin: selected[0] } : { kind: "resize", handle: handle as Handle, origin: selected[0] }
      capture(event)
      return
    }

    const id = target.closest("[data-element-id]")?.getAttribute("data-element-id") ?? null

    // O botão direito só escolhe o alvo; o menu abre no evento de contexto.
    if (event.button === 2) {
      if (id && !selection.includes(id)) setSelection([id])
      if (!id) setSelection([])
      return
    }

    if (!id) {
      if (!event.shiftKey) setSelection([])
      gesture.current = { kind: "marquee", start: point, base: event.shiftKey ? selection : [], additive: event.shiftKey }
      capture(event)
      return
    }

    const wasSelected = selection.includes(id)
    let next = selection

    if (event.shiftKey) {
      next = wasSelected ? selection.filter((item) => item !== id) : [...selection, id]
    } else if (!wasSelected) {
      next = [id]
    }

    setSelection(next)

    if (event.shiftKey && wasSelected) return

    const moving = design.elements.filter((element) => next.includes(element.id) && !element.locked)

    if (moving.length === 0) return

    editor.gesture.start()
    gesture.current = {
      kind: "move",
      start: point,
      origins: new Map(moving.map((element) => [element.id, element])),
      others: design.elements.filter((element) => !next.includes(element.id)).map(elementBounds),
      moved: false,
      clicked: id,
      wasSelected,
    }
    capture(event)
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current

    if (!current) {
      const id = (event.target as Element).closest("[data-element-id]")?.getAttribute("data-element-id") ?? null
      if (id !== hover) setHover(id)
      return
    }

    if (current.kind === "pan") {
      const workspace = workspaceRef.current

      if (workspace) {
        workspace.scrollLeft = current.left - (event.clientX - current.x)
        workspace.scrollTop = current.top - (event.clientY - current.y)
      }
      return
    }

    const point = toPage(event)

    if (current.kind === "marquee") {
      setMarquee({
        x: Math.min(current.start.x, point.x),
        y: Math.min(current.start.y, point.y),
        width: Math.abs(point.x - current.start.x),
        height: Math.abs(point.y - current.start.y),
      })
      return
    }

    if (current.kind === "move") {
      let dx = point.x - current.start.x
      let dy = point.y - current.start.y

      if (!current.moved && Math.hypot(dx, dy) < 3 / zoom) return

      current.moved = true
      const box = unionBounds([...current.origins.values()]) as Box
      const moved = { ...box, x: box.x + dx, y: box.y + dy }

      if (snapping && !event.altKey) {
        const snap = snapBox(moved, current.others, 6 / zoom)
        dx += snap.dx
        dy += snap.dy
        setGuides(snap.guides)
      } else {
        setGuides([])
      }

      editor.gesture.update((design) => ({
        ...design,
        elements: design.elements.map((element) => {
          const origin = current.origins.get(element.id)
          return origin ? { ...element, x: round(origin.x + dx), y: round(origin.y + dy) } : element
        }),
      }))
      return
    }

    const next =
      current.kind === "resize"
        ? resize(current.origin, current.handle, point, event.shiftKey)
        : { ...current.origin, rotation: rotationFrom(elementCenter(current.origin), point, event.shiftKey) }

    editor.gesture.update((design) => ({
      ...design,
      elements: design.elements.map((element) => (element.id === next.id ? next : element)),
    }))
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current
    gesture.current = null
    svgRef.current?.releasePointerCapture?.(event.pointerId)
    setGuides([])
    setGrabbing(false)

    if (!current) return

    if (current.kind === "marquee") {
      setMarquee(null)

      const point = toPage(event)
      const box = {
        x: Math.min(current.start.x, point.x),
        y: Math.min(current.start.y, point.y),
        width: Math.abs(point.x - current.start.x),
        height: Math.abs(point.y - current.start.y),
      }

      if (box.width < 2 && box.height < 2) return

      const inside = design.elements.filter((element) => contains(box, elementBounds(element))).map((element) => element.id)
      setSelection(current.additive ? [...new Set([...current.base, ...inside])] : inside)
      return
    }

    if (current.kind === "move" && !current.moved && current.wasSelected && !event.shiftKey && selection.length > 1) {
      setSelection([current.clicked])
    }

    if (current.kind !== "pan") editor.gesture.end()
  }

  // Com o ponteiro capturado pelo primeiro clique, o duplo clique chega ao SVG,
  // e não ao texto. O alvo sai do ponto clicado, ou da seleção que o primeiro
  // clique acabou de fazer.
  function onDoubleClick(event: MouseEvent<SVGSVGElement>) {
    const under = document.elementFromPoint?.(event.clientX, event.clientY)?.closest("[data-element-id]")?.getAttribute("data-element-id")
    const id = under ?? (selection.length === 1 ? selection[0] : null)
    const element = design.elements.find((item) => item.id === id)

    if (element?.type === "text" && !element.locked) {
      setSelection([element.id])
      onEditText(element.id)
    }
  }

  return (
    <CertificateArtboard
      svgRef={svgRef}
      design={design}
      assets={assets}
      fields={fields}
      hiddenId={editingId}
      interactive
      label="Página do certificado em edição"
      width={W * zoom}
      height={H * zoom}
      className="block shrink-0 bg-surface shadow-[0_8px_40px_rgba(0,0,0,0.18)] select-none"
      style={{ touchAction: "none", cursor: panning ? (grabbing ? "grabbing" : "grab") : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => setHover(null)}
      onDoubleClick={onDoubleClick}
      onContextMenu={(event) => {
        event.preventDefault()
        onContextMenu({ x: event.clientX, y: event.clientY })
      }}
    >
      {hovered && <Outline element={hovered} zoom={zoom} dashed />}
      {!editing && <SelectionOverlay elements={selected} zoom={zoom} />}

      {guides.map((guide) =>
        guide.axis === "x" ? (
          <line key={`x-${guide.position}`} x1={guide.position} y1={0} x2={guide.position} y2={H} stroke={ACCENT} strokeWidth={1 / zoom} pointerEvents="none" />
        ) : (
          <line key={`y-${guide.position}`} x1={0} y1={guide.position} x2={W} y2={guide.position} stroke={ACCENT} strokeWidth={1 / zoom} pointerEvents="none" />
        ),
      )}

      {marquee && (
        <rect
          x={marquee.x}
          y={marquee.y}
          width={marquee.width}
          height={marquee.height}
          fill={ACCENT}
          fillOpacity={0.08}
          stroke={ACCENT}
          strokeWidth={1 / zoom}
          pointerEvents="none"
        />
      )}

      {editing && (
        <InlineTextEditor
          key={editing.id}
          element={editing}
          palette={design.palette}
          zoom={zoom}
          onChange={(content) => editor.updateElements([editing.id], { content }, `conteudo:${editing.id}`)}
          onDone={() => {
            onEditText(null)

            // Texto que ficou vazio some, como num editor de slides.
            if (editing.content.trim().length === 0) editor.remove([editing.id])
          }}
        />
      )}
    </CertificateArtboard>
  )
}
