import { CERTIFICATE_PAGE } from "../../../types/certificate-types"
import type { CertificateElement, CertificateText } from "../../../types/certificate-types"
import { elementCenter, layoutText, rotatePoint } from "../certificate-layout"

// A geometria do editor: onde ficam os cantos de um elemento girado, como uma
// alça muda o tamanho sem deslocar o lado oposto, como o giro encaixa nos
// ângulos redondos e onde a seleção gruda nas guias. Tudo em pontos da página.

export type Point = { x: number; y: number }
export type Box = { x: number; y: number; width: number; height: number }

const { width: W, height: H } = CERTIFICATE_PAGE

export function round(value: number, step = 0.01): number {
  return Math.round(value / step) * step
}

export function corners(element: CertificateElement): Point[] {
  const center = elementCenter(element)
  const { x, y, width, height } = element

  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ].map((point) => rotatePoint(point, center, element.rotation))
}

export function boundsOf(points: Point[]): Box {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)

  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

export function elementBounds(element: CertificateElement): Box {
  return boundsOf(corners(element))
}

export function unionBounds(elements: CertificateElement[]): Box | null {
  if (elements.length === 0) return null

  return boundsOf(elements.flatMap(corners))
}

export function contains(outer: Box, inner: Box): boolean {
  return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height
}

// Alças

export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

export const HANDLE_VECTOR: Record<Handle, Point> = {
  nw: { x: -1, y: -1 },
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
}

// Imagem, logo e QR só crescem pelos cantos, mantendo a proporção: um enfeite
// esticado é o jeito mais rápido de um certificado parecer amador. Texto
// cresce de largura pelos lados e de letra pelos cantos; a altura dele é a das
// linhas. Linha só tem comprimento.
export function handlesFor(element: CertificateElement): Handle[] {
  if (element.type === "text") return ["nw", "ne", "se", "sw", "e", "w"]
  if (element.type === "shape" && element.shape === "line") return ["e", "w"]
  if (element.type === "shape") return ["nw", "n", "ne", "e", "se", "s", "sw", "w"]

  return ["nw", "ne", "se", "sw"]
}

export function keepsRatio(element: CertificateElement, handle: Handle, shift: boolean): boolean {
  const corner = handle.length === 2

  if (!corner) return false
  if (element.type === "shape") return shift

  return true
}

const MIN_SIZE = 8

// O lado oposto à alça fica parado na página, mesmo com o elemento girado: o
// ponteiro é levado para o sistema do próprio elemento, a medida nova é
// calculada lá, e o centro novo volta para a página girado.
export function resize(origin: CertificateElement, handle: Handle, pointer: Point, shift: boolean): CertificateElement {
  const vector = HANDLE_VECTOR[handle]
  const center = elementCenter(origin)
  const local = rotatePoint(pointer, center, -origin.rotation)
  const dx = local.x - center.x
  const dy = local.y - center.y
  const minWidth = origin.type === "text" ? 20 : MIN_SIZE

  let width = vector.x !== 0 ? Math.max(minWidth, vector.x * dx + origin.width / 2) : origin.width
  let height = vector.y !== 0 ? Math.max(MIN_SIZE, vector.y * dy + origin.height / 2) : origin.height

  if (keepsRatio(origin, handle, shift)) {
    const scale = Math.max(width / origin.width, height / origin.height)
    width = Math.max(minWidth, origin.width * scale)
    height = origin.height * (width / origin.width)
  }

  if (origin.type === "shape" && origin.shape === "line") {
    height = origin.height
  }

  const offset = {
    x: vector.x !== 0 ? (vector.x * (width - origin.width)) / 2 : 0,
    y: vector.y !== 0 ? (vector.y * (height - origin.height)) / 2 : 0,
  }
  const radians = (origin.rotation * Math.PI) / 180
  const nextCenter = {
    x: center.x + offset.x * Math.cos(radians) - offset.y * Math.sin(radians),
    y: center.y + offset.x * Math.sin(radians) + offset.y * Math.cos(radians),
  }

  const next = {
    ...origin,
    x: round(nextCenter.x - width / 2),
    y: round(nextCenter.y - height / 2),
    width: round(width),
    height: round(height),
  }

  // Pelo canto, o texto cresce por inteiro: a letra acompanha a largura.
  if (origin.type === "text" && handle.length === 2) {
    const scale = width / origin.width
    return { ...next, size: round(Math.min(160, Math.max(4, origin.size * scale)), 0.5) } as CertificateText
  }

  return next
}

// Giro

export function rotationFrom(center: Point, pointer: Point, shift: boolean): number {
  let angle = (Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180) / Math.PI + 90

  if (shift) {
    angle = Math.round(angle / 15) * 15
  } else {
    const nearest = Math.round(angle / 45) * 45
    if (Math.abs(angle - nearest) < 3) angle = nearest
  }

  return normalizeAngle(angle)
}

export function normalizeAngle(angle: number): number {
  let value = ((angle % 360) + 360) % 360
  if (value > 180) value -= 360

  return round(value, 0.1)
}

// Guias

export type Guide = { axis: "x" | "y"; position: number }

// Encaixa a caixa que se move nas bordas e no centro da página e nas bordas e
// centros dos outros elementos. O limite vem em pontos, já convertido do
// tamanho em pixels que a pessoa enxerga.
export function snapBox(box: Box, others: Box[], threshold: number): { dx: number; dy: number; guides: Guide[] } {
  const targetsX = [0, W / 2, W, ...others.flatMap((other) => [other.x, other.x + other.width / 2, other.x + other.width])]
  const targetsY = [0, H / 2, H, ...others.flatMap((other) => [other.y, other.y + other.height / 2, other.y + other.height])]
  const edgesX = [box.x, box.x + box.width / 2, box.x + box.width]
  const edgesY = [box.y, box.y + box.height / 2, box.y + box.height]

  const best = (edges: number[], targets: number[]) => {
    let found: { delta: number; position: number } | null = null

    for (const edge of edges) {
      for (const target of targets) {
        const delta = target - edge

        if (Math.abs(delta) <= threshold && (!found || Math.abs(delta) < Math.abs(found.delta))) {
          found = { delta, position: target }
        }
      }
    }

    return found
  }

  const x = best(edgesX, targetsX)
  const y = best(edgesY, targetsY)
  const guides: Guide[] = []

  if (x) guides.push({ axis: "x", position: x.position })
  if (y) guides.push({ axis: "y", position: y.position })

  return { dx: x?.delta ?? 0, dy: y?.delta ?? 0, guides }
}

// Texto

// A altura de um texto é a das linhas dele com os dados de exemplo. Ela é
// recalculada a cada mudança, e é a caixa que o giro e o degradê usam.
export function withTextHeight(element: CertificateElement, fields: Record<string, string>): CertificateElement {
  if (element.type !== "text") return element

  const height = round(Math.max(layoutText(element, fields).height, element.size * element.line_height))

  return height === element.height ? element : { ...element, height }
}
