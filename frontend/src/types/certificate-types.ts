import type { TransactionType } from "./transaction-types"

// Espelha `utils/certificate-design.ts` do backend. O certificado é uma página
// com elementos soltos, como um slide, e as coordenadas são pontos de PDF numa
// A4 deitada: o editor desenha na mesma unidade que o pdfkit, e é isso que faz
// a tela do painel ser o certificado que o doador recebe.
export const CERTIFICATE_PAGE = { width: 841.89, height: 595.28 } as const

export type CertificateScope = "default" | "campaign" | "event"

export type CertificateFont = "helvetica" | "times" | "courier" | "nunito" | "cormorant" | "cinzel" | "caveat" | "greatvibes"

export type CertificatePalette = {
  paper: string
  primary: string
  secondary: string
  accent: string
  ink: string
  muted: string
}

/** "#RRGGBB" ou um papel da paleta, como "@primary". */
export type CertificateColor = string

export type CertificateGradient = {
  stops: CertificateColor[]
  angle: number
}

export type CertificatePaint = CertificateColor | CertificateGradient

type ElementBase = {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked: boolean
}

export type CertificateText = ElementBase & {
  type: "text"
  content: string
  font: CertificateFont
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  color: CertificatePaint
  align: "left" | "center" | "right"
  letter_spacing: number
  line_height: number
  uppercase: boolean
  fit: "wrap" | "shrink"
}

export type CertificateShape = ElementBase & {
  type: "shape"
  shape: "rect" | "ellipse" | "line"
  fill: CertificatePaint | null
  stroke: CertificatePaint | null
  stroke_width: number
  radius: number
  dash: "solid" | "dashed" | "dotted"
}

export type CertificateImage = ElementBase & {
  type: "image"
  asset_id: string
  flip_x: boolean
  flip_y: boolean
}

export type CertificateLogo = ElementBase & {
  type: "logo"
}

export type CertificateQr = ElementBase & {
  type: "qr"
  color: CertificateColor
}

export type CertificateElement = CertificateText | CertificateShape | CertificateImage | CertificateLogo | CertificateQr

export type CertificateBackground = {
  color: CertificateColor
  asset_id: string | null
  opacity: number
}

export type CertificateDesign = {
  palette: CertificatePalette
  background: CertificateBackground
  elements: CertificateElement[]
}

export type CertificateFolder = {
  /** "default", "campaign:<id>" ou "event:<id>". */
  folder: string
  scope: CertificateScope
  target_id: string | null
  title: string
  status: string | null
  versions: number
  issued: number
  current: { id: string; version: number; label: string; created_at: string } | null
}

export type CertificateVersion = {
  id: string
  scope: CertificateScope
  campaign_id: string | null
  event_id: string | null
  folder: string
  version: number
  label: string
  design: CertificateDesign
  created_by: string | null
  created_at: string
  updated_at: string
  author: { id: string; name: string } | null
  issued: number
}

export type CertificateAsset = {
  id: string
  name: string
  mime_type: "image/png" | "image/jpeg"
  width: number
  height: number
  size: number
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export type IssuedCertificate = {
  id: string
  number: string
  sequence: number
  donor_name: string
  amount: string
  transaction_type: TransactionType
  status: "issued" | "cancelled"
  issued_at: string
  hash: string
  certificate_design_id: string
  design_version: number | null
  design_label: string | null
}

export type CreateCertificateDesignInput = {
  scope: CertificateScope
  target_id: string | null
  label: string
  design: CertificateDesign
}

/** A segunda via pública: o certificado de um recibo, pronto para desenhar. */
export type CertificateView = {
  number: string
  status: "issued" | "cancelled"
  transaction_type: TransactionType
  issued_at: string
  cancelled_at: string | null
  hash: string
  authentic: boolean
  valid: boolean
  version: { version: number; label: string } | null
  design: CertificateDesign
  fields: Record<string, string>
  qr: string
}
