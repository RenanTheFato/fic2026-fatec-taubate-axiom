import { QrCode } from "lucide-react"
import { useEffect, useId } from "react"
import type { ReactNode, Ref, SVGProps } from "react"
import { CERTIFICATE_PAGE } from "../../types/certificate-types"
import type { CertificateDesign, CertificateElement, CertificatePaint, CertificatePalette } from "../../types/certificate-types"
import { cssFont, loadDesignFonts } from "./certificate-fonts"
import { elementCenter, gradientLine, isGradient, layoutText, resolveColor } from "./certificate-layout"

export type CanvasAsset = {
  url: string
  name: string
}

const { width: W, height: H } = CERTIFICATE_PAGE

// A logo do PDF é a versão completa e quadrada da marca. A do cabeçalho do site
// é outra, mais larga, e por isso o certificado tem a sua própria cópia.
export const CERTIFICATE_LOGO = "/imagens/logo-certificado.png"

// O QR e a tarja são parte do documento, e não cor de interface.
const QR_PAPER = "#FFFFFF"
const STAMP_RED = "#B91C1C"

type PaintRef = { value: string; gradient: ReactNode }

function paint(id: string, value: CertificatePaint, palette: CertificatePalette, box: CertificateElement): PaintRef {
  if (!isGradient(value)) {
    return { value: resolveColor(value, palette), gradient: null }
  }

  const line = gradientLine(value.angle, box)

  return {
    value: `url(#${id})`,
    gradient: (
      <linearGradient id={id} gradientUnits="userSpaceOnUse" {...line}>
        {value.stops.map((stop, index) => (
          <stop key={`${stop}-${index}`} offset={index / (value.stops.length - 1)} stopColor={resolveColor(stop, palette)} />
        ))}
      </linearGradient>
    ),
  }
}

function dashArray(dash: "solid" | "dashed" | "dotted", width: number): string | undefined {
  if (dash === "dashed") return `${width * 3} ${width * 2}`
  if (dash === "dotted") return `0.01 ${width * 2}`
  return undefined
}

type ElementProps = {
  element: CertificateElement
  palette: CertificatePalette
  fields: Record<string, string>
  assets: Map<string, CanvasAsset>
  qr?: string | null
  uid: string
  hidden: boolean
  interactive: boolean
}

function ArtboardElement({ element, palette, fields, assets, qr, uid, hidden, interactive }: ElementProps) {
  const center = elementCenter(element)
  const transform = element.rotation ? `rotate(${element.rotation} ${center.x} ${center.y})` : undefined
  const key = `${uid}-${element.id}`
  let body: ReactNode = null

  switch (element.type) {
    case "text": {
      const layout = layoutText(element, fields)
      const font = cssFont(layout.face)
      const fill = paint(`${key}-cor`, element.color, palette, element)
      const thickness = Math.max(0.5, layout.size * 0.06)

      body = (
        <>
          {fill.gradient}
          <text
            fontFamily={font.fontFamily}
            fontWeight={font.fontWeight}
            fontStyle={font.fontStyle}
            fontSize={layout.size}
            letterSpacing={element.letter_spacing || undefined}
            fill={fill.value}
            style={{ whiteSpace: "pre" }}
          >
            {layout.lines.map((line, index) => (
              <tspan key={index} x={line.x} y={line.baseline}>
                {line.text}
              </tspan>
            ))}
          </text>
          {element.underline &&
            layout.lines.map((line, index) =>
              line.text.length > 0 ? (
                <rect key={`u-${index}`} x={line.x} y={line.baseline + layout.size * 0.12} width={line.width} height={thickness} fill={fill.value} />
              ) : null,
            )}
        </>
      )
      break
    }
    case "shape": {
      const fill = element.fill && element.shape !== "line" ? paint(`${key}-fundo`, element.fill, palette, element) : null
      const stroke = element.stroke && element.stroke_width > 0 ? paint(`${key}-traco`, element.stroke, palette, element) : null
      const shared = {
        fill: fill?.value ?? "none",
        stroke: stroke?.value ?? "none",
        strokeWidth: stroke ? element.stroke_width : undefined,
        strokeDasharray: stroke ? dashArray(element.dash, element.stroke_width) : undefined,
        strokeLinecap: element.dash === "dotted" ? ("round" as const) : undefined,
      }

      body = (
        <>
          {fill?.gradient}
          {stroke?.gradient}
          {element.shape === "line" && <line x1={element.x} y1={center.y} x2={element.x + element.width} y2={center.y} {...shared} />}
          {element.shape === "ellipse" && <ellipse cx={center.x} cy={center.y} rx={element.width / 2} ry={element.height / 2} {...shared} />}
          {element.shape === "rect" && (
            <rect
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              rx={Math.min(element.radius, element.width / 2, element.height / 2)}
              {...shared}
            />
          )}
        </>
      )
      break
    }
    case "image": {
      const asset = assets.get(element.asset_id)
      const flip =
        element.flip_x || element.flip_y
          ? `translate(${center.x} ${center.y}) scale(${element.flip_x ? -1 : 1} ${element.flip_y ? -1 : 1}) translate(${-center.x} ${-center.y})`
          : undefined

      body = asset ? (
        <image href={asset.url} x={element.x} y={element.y} width={element.width} height={element.height} preserveAspectRatio="none" transform={flip} />
      ) : null
      break
    }
    case "logo":
      body = <image href={CERTIFICATE_LOGO} x={element.x} y={element.y} width={element.width} height={element.height} preserveAspectRatio="none" />
      break
    case "qr": {
      const inset = element.width * 0.05
      const size = element.width - inset * 2

      body = (
        <>
          <rect x={element.x} y={element.y} width={element.width} height={element.height} rx={element.width * 0.05} fill={QR_PAPER} />
          {qr ? (
            <image href={qr} x={element.x + inset} y={element.y + inset} width={size} height={element.height - inset * 2} />
          ) : (
            <QrCode
              x={element.x + inset}
              y={element.y + inset}
              width={size}
              height={element.height - inset * 2}
              color={resolveColor(element.color, palette)}
              strokeWidth={1.4}
              aria-hidden="true"
            />
          )}
        </>
      )
      break
    }
  }

  return (
    <g data-element-id={element.id} transform={transform} opacity={element.opacity < 1 ? element.opacity : undefined}>
      {!hidden && body}
      {interactive && <HitArea element={element} />}
    </g>
  )
}

// A área de clique do editor. Texto, imagem, QR e forma preenchida respondem na
// caixa inteira: um texto só seria clicável em cima das letras. Forma só de
// contorno (a moldura da página, um círculo vazado) e linha respondem só no
// traço, alargado para o dedo e o mouse acertarem; senão a moldura engoliria
// todo clique dentro dela e não daria para selecionar nada pelo laço.
function HitArea({ element }: { element: CertificateElement }) {
  const outline = element.type === "shape" && (element.shape === "line" || element.fill === null)

  if (!outline) {
    return <rect x={element.x} y={element.y} width={element.width} height={Math.max(element.height, 8)} fill="transparent" />
  }

  const center = elementCenter(element)
  const band = { fill: "none", stroke: "transparent", strokeWidth: Math.max(element.stroke_width, 10), pointerEvents: "stroke" as const }

  if (element.shape === "line") return <line x1={element.x} y1={center.y} x2={element.x + element.width} y2={center.y} {...band} />
  if (element.shape === "ellipse") return <ellipse cx={center.x} cy={center.y} rx={element.width / 2} ry={element.height / 2} {...band} />

  return (
    <rect
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rx={Math.min(element.radius, element.width / 2, element.height / 2)}
      {...band}
    />
  )
}

type CertificateArtboardProps = Omit<SVGProps<SVGSVGElement>, "ref" | "children"> & {
  design: CertificateDesign
  assets: Map<string, CanvasAsset>
  fields: Record<string, string>
  /** O QR de verdade, como data URL. Ausente, o editor desenha um de exemplo. */
  qr?: string | null
  label: string
  /** "CANCELADO" ou "MODELO", por cima de tudo, como no PDF. */
  stamp?: string | null
  /** Elemento que não aparece: o texto que está sendo editado no lugar. */
  hiddenId?: string | null
  /** Editor: cada elemento ganha uma área de clique. */
  interactive?: boolean
  svgRef?: Ref<SVGSVGElement>
  /** Camadas do editor por cima do desenho: seleção, guias, edição de texto. */
  children?: ReactNode
}

// O certificado desenhado em SVG, na mesma geometria do template do backend:
// mesma página em pontos, a mesma lista de elementos na mesma ordem e a mesma
// conta de quebra de linha. É a mesa de trabalho do editor, a miniatura do
// histórico e a segunda via pública. O PDF continua vindo do backend.
export function CertificateArtboard({
  design,
  assets,
  fields,
  qr,
  label,
  stamp,
  hiddenId = null,
  interactive = false,
  svgRef,
  children,
  ...rest
}: CertificateArtboardProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const background = design.background.asset_id ? assets.get(design.background.asset_id) : undefined

  useEffect(() => {
    loadDesignFonts(design)
  }, [design])

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role={interactive ? "application" : "img"} aria-label={label} {...rest}>
      <rect width={W} height={H} fill={resolveColor(design.background.color, design.palette)} />
      {background && (
        <image href={background.url} width={W} height={H} preserveAspectRatio="xMidYMid slice" opacity={design.background.opacity} />
      )}

      {design.elements.map((element) => (
        <ArtboardElement
          key={element.id}
          element={element}
          palette={design.palette}
          fields={fields}
          assets={assets}
          qr={qr}
          uid={uid}
          hidden={element.id === hiddenId}
          interactive={interactive}
        />
      ))}

      {stamp && (
        <text
          x={W / 2}
          y={H / 2 - 62 + 0.718 * 96}
          transform={`rotate(-22 ${W / 2} ${H / 2})`}
          textAnchor="middle"
          fontFamily={cssFont("helvetica:bold").fontFamily}
          fontWeight={700}
          fontSize={96}
          letterSpacing={6}
          fill={STAMP_RED}
          fillOpacity={stamp === "MODELO" ? 0.08 : 0.13}
          pointerEvents="none"
        >
          {stamp}
        </text>
      )}

      {children}
    </svg>
  )
}
