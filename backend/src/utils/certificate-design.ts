import { z } from "zod/v4";
import { CERTIFICATE_FONTS } from "./certificate-fonts.js";
import type { CertificateFont } from "./certificate-fonts.js";
import { CODE_MIN_SIZE, QR_MIN_SIZE, designProblems } from "./certificate-layout.js";
import type { DesignProblem } from "./certificate-layout.js";

// O certificado é uma página com elementos soltos, como um slide: textos, formas, imagens da
// biblioteca, a logo e o QR de verificação, cada um com posição, tamanho, giro e opacidade. O
// conteúdo verificável entra como campo ({{nome}}, {{valor}}, {{codigo}}) e é preenchido com os
// dados do recibo na hora de gerar o PDF: a equipe decide onde e como cada dado aparece, mas não o
// que ele diz. As coordenadas são pontos de PDF numa A4 deitada, a mesma unidade que o editor
// desenha, para que o que a equipe vê no painel seja o que o doador recebe.

export const CERTIFICATE_PAGE = { width: 841.89, height: 595.28 } as const

export const MAX_ELEMENTS = 80

export interface CertificatePalette {
  paper: string,
  primary: string,
  secondary: string,
  accent: string,
  ink: string,
  muted: string,
}

// "#RRGGBB" ou um papel da paleta, como "@primary".
export type CertificateColor = string

export interface CertificateGradient {
  stops: CertificateColor[],
  angle: number,
}

export type CertificatePaint = CertificateColor | CertificateGradient

interface CertificateElementBase {
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  opacity: number,
  locked: boolean,
}

export interface CertificateText extends CertificateElementBase {
  type: "text",
  content: string,
  font: CertificateFont,
  size: number,
  bold: boolean,
  italic: boolean,
  underline: boolean,
  color: CertificatePaint,
  align: "left" | "center" | "right",
  letter_spacing: number,
  line_height: number,
  uppercase: boolean,
  fit: "wrap" | "shrink",
}

export interface CertificateShape extends CertificateElementBase {
  type: "shape",
  shape: "rect" | "ellipse" | "line",
  fill: CertificatePaint | null,
  stroke: CertificatePaint | null,
  stroke_width: number,
  radius: number,
  dash: "solid" | "dashed" | "dotted",
}

export interface CertificateImage extends CertificateElementBase {
  type: "image",
  asset_id: string,
  flip_x: boolean,
  flip_y: boolean,
}

export interface CertificateLogo extends CertificateElementBase {
  type: "logo",
}

export interface CertificateQr extends CertificateElementBase {
  type: "qr",
  color: CertificateColor,
}

export type CertificateElement = CertificateText | CertificateShape | CertificateImage | CertificateLogo | CertificateQr

export interface CertificateBackground {
  color: CertificateColor,
  asset_id: string | null,
  opacity: number,
}

export interface CertificateDesignSpec {
  palette: CertificatePalette,
  background: CertificateBackground,
  elements: CertificateElement[],
}

const hex = z.string({ error: "The color must be a string" })
  .regex(/^#[0-9a-fA-F]{6}$/, { error: "The color must be a hex value like #1A2B3C" })
  .transform((value) => value.toUpperCase())

const color = z.string({ error: "The color must be a string" })
  .regex(/^(#[0-9a-fA-F]{6}|@(paper|primary|secondary|accent|ink|muted|line|label|contrast))$/, {
    error: "The color must be a hex value like #1A2B3C or a theme color like @primary",
  })
  .transform((value) => (value.startsWith("#") ? value.toUpperCase() : value))

const paint = z.union([
  color,
  z.object({
    stops: z.array(color).min(2, { error: "A gradient needs at least 2 colors" }).max(3, { error: "A gradient takes at most 3 colors" }),
    angle: z.number().min(-360).max(360),
  }),
], { error: "The paint must be a color or a gradient" })

const position = z.number({ error: "The position must be a number" })
  .min(-CERTIFICATE_PAGE.width)
  .max(CERTIFICATE_PAGE.width * 2)

const base = {
  id: z.string({ error: "The element id must be a string" })
    .regex(/^[a-zA-Z0-9_-]{1,32}$/, { error: "The element id must have up to 32 letters, digits, hyphens or underscores" }),
  x: position,
  y: position,
  width: z.number({ error: "The width must be a number" }).min(1).max(CERTIFICATE_PAGE.width * 2),
  height: z.number({ error: "The height must be a number" }).min(0.5).max(CERTIFICATE_PAGE.width * 2),
  rotation: z.number({ error: "The rotation must be a number" }).min(-360).max(360),
  opacity: z.number({ error: "The opacity must be a number" }).min(0.05).max(1),
  locked: z.boolean().optional().default(false),
}

const elementSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("text"),
    content: z.string({ error: "The text must be a string" })
      .max(600, { error: "The text has exceeded the maximum length (600)" })
      .transform((value) => value.replace(/\r\n?/g, "\n")),
    font: z.enum(CERTIFICATE_FONTS, { error: `The font must be one of: ${CERTIFICATE_FONTS.join(", ")}` }),
    size: z.number({ error: "The font size must be a number" }).min(4).max(160),
    bold: z.boolean(),
    italic: z.boolean(),
    underline: z.boolean().optional().default(false),
    color: paint,
    align: z.enum(["left", "center", "right"], { error: "The alignment must be left, center or right" }),
    letter_spacing: z.number().min(-5).max(40),
    line_height: z.number().min(0.7).max(3),
    uppercase: z.boolean(),
    fit: z.enum(["wrap", "shrink"], { error: "The fit must be wrap or shrink" }),
  }),
  z.object({
    ...base,
    type: z.literal("shape"),
    shape: z.enum(["rect", "ellipse", "line"], { error: "The shape must be rect, ellipse or line" }),
    fill: paint.nullable(),
    stroke: paint.nullable(),
    stroke_width: z.number().min(0).max(40),
    radius: z.number().min(0).max(400),
    dash: z.enum(["solid", "dashed", "dotted"]).optional().default("solid"),
  }),
  z.object({
    ...base,
    type: z.literal("image"),
    asset_id: z.uuid({ error: "The image asset id must be a valid uuid" }),
    flip_x: z.boolean().optional().default(false),
    flip_y: z.boolean().optional().default(false),
  }),
  z.object({
    ...base,
    type: z.literal("logo"),
  }),
  z.object({
    ...base,
    type: z.literal("qr"),
    color,
  }),
], { error: "The element type must be text, shape, image, logo or qr" })

function problemIssue(problem: DesignProblem): { path: (string | number)[], message: string } {
  switch (problem.code) {
    case "duplicate-id":
      return { path: ["elements", problem.index, "id"], message: "Each element needs a unique id" }
    case "qr-missing":
      return { path: ["elements"], message: "The certificate needs its verification QR code" }
    case "qr-duplicate":
      return { path: ["elements", problem.index], message: "The certificate takes only one QR code" }
    case "qr-small":
      return { path: ["elements", problem.index, "width"], message: `The QR code must be at least ${QR_MIN_SIZE} points wide to be read on paper` }
    case "qr-contrast":
      return { path: ["elements", problem.index, "color"], message: "The QR code color must have a contrast of at least 4.5:1 against white" }
    case "code-missing":
      return { path: ["elements"], message: "A text must carry the verification code ({{codigo}})" }
    case "code-small":
      return { path: ["elements", problem.index, "size"], message: `The verification code must be at least ${CODE_MIN_SIZE} points tall` }
    case "empty-text":
      return { path: ["elements", problem.index, "content"], message: "A text element can't be empty" }
    case "unknown-field":
      return { path: ["elements", problem.index, "content"], message: `Unknown field {{${problem.field}}}` }
    case "unsupported-char":
      return { path: ["elements", problem.index, "content"], message: `The character "${problem.char}" can't be printed with this font` }
    case "text-contrast":
      return {
        path: ["elements", problem.index, "color"],
        message: `The text has a contrast of ${problem.ratio.toFixed(1)}:1 with what is behind it, and needs at least ${problem.required}:1`,
      }
  }
}

// Compartilhado pelo controller que grava uma versão e pelo que gera a prévia: os dois precisam
// recusar exatamente o mesmo desenho, senão a prévia mostraria algo que salvar não aceita.
export function certificateDesignSchema() {
  return z.object({
    palette: z.object({
      paper: hex,
      primary: hex,
      secondary: hex,
      accent: hex,
      ink: hex,
      muted: hex,
    }, { error: "The palette must have paper, primary, secondary, accent, ink and muted" }),
    background: z.object({
      color,
      asset_id: z.uuid({ error: "The background asset id must be a valid uuid" }).nullish().default(null),
      opacity: z.number().min(0.05).max(1),
    }, { error: "The background must have a color, an optional image and its opacity" }),
    elements: z.array(elementSchema, { error: "The elements must be a list" })
      .max(MAX_ELEMENTS, { error: `The elements have exceeded the maximum allowed length (${MAX_ELEMENTS})` }),
  }).superRefine((design, ctx) => {
    for (const problem of designProblems(design as CertificateDesignSpec)) {
      ctx.addIssue({ code: "custom", ...problemIssue(problem) })
    }
  })
}

export function referencedAssets(design: CertificateDesignSpec) {
  const ids = new Set<string>()

  for (const element of design.elements) {
    if (element.type === "image") {
      ids.add(element.asset_id)
    }
  }

  if (design.background.asset_id) {
    ids.add(design.background.asset_id)
  }

  return [...ids]
}

// O MySQL devolve a coluna JSON já interpretada pelo driver, mas uma leitura crua (sequelize.query)
// ou outro dialeto pode entregar o texto. As duas formas chegam aqui e saem como objeto.
export function parseDesign(value: unknown): CertificateDesignSpec {
  return (typeof value === "string" ? JSON.parse(value) : value) as CertificateDesignSpec
}
