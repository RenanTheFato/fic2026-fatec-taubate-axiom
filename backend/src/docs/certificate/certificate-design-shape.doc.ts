import { z } from "zod/v4";

// O formato do desenho de um certificado, compartilhado pelas rotas que recebem ou devolvem uma
// versão. Fica num arquivo só porque são cinco rotas e o formato é longo: cópias divergiriam.

const hex = z.string().describe("Hex color, #RRGGBB.").meta({ example: "#7F1D1D" })

const color = z.string()
  .describe("Hex color (#RRGGBB) or a theme color that follows the palette: @paper, @primary, @secondary, @accent, @ink, @muted, or the derived @line, @label and @contrast.")
  .meta({ example: "@primary" })

const paint = z.union([
  color,
  z.object({
    stops: z.array(color).describe("Two or three colors, evenly spaced."),
    angle: z.number().describe("Degrees: 0 runs left to right, 90 top to bottom."),
  }),
]).describe("A solid color or a linear gradient across the element box.")

const base = {
  id: z.string().describe("Unique inside the design.").meta({ example: "nome" }),
  x: z.number().describe("Left edge before rotation, in PDF points (the page is 841.89 by 595.28)."),
  y: z.number().describe("Top edge before rotation, in PDF points."),
  width: z.number(),
  height: z.number(),
  rotation: z.number().describe("Degrees, clockwise, around the element center."),
  opacity: z.number().describe("From 0.05 to 1."),
  locked: z.boolean().describe("Editor only: a locked element can't be dragged."),
}

export const certificateDesignShape = z.object({
  palette: z.object({
    paper: hex,
    primary: hex,
    secondary: hex,
    accent: hex,
    ink: hex,
    muted: hex,
  }).describe("The theme. Elements that use @ colors follow it, so swapping the palette recolors the whole certificate."),
  background: z.object({
    color,
    asset_id: z.uuid().nullable().describe("Full-page image, drawn like CSS cover."),
    opacity: z.number(),
  }),
  elements: z.array(z.union([
    z.object({
      ...base,
      type: z.literal("text"),
      content: z.string()
        .describe("Free text with fields filled per receipt: {{nome}}, {{valor}}, {{titulo}}, {{acao}}, {{destino}}, {{numero}}, {{data}}, {{registro}}, {{codigo}}, {{associacao}}, {{cnpj}}.")
        .meta({ example: "{{nome}}" }),
      font: z.enum(["helvetica", "times", "courier", "nunito", "cormorant", "cinzel", "caveat", "greatvibes"]),
      size: z.number().describe("Points."),
      bold: z.boolean(),
      italic: z.boolean(),
      underline: z.boolean(),
      color: paint,
      align: z.enum(["left", "center", "right"]),
      letter_spacing: z.number(),
      line_height: z.number().describe("Multiplier of the font size."),
      uppercase: z.boolean(),
      fit: z.enum(["wrap", "shrink"]).describe("shrink reduces the font, down to 60%, until every paragraph fits on one line."),
    }),
    z.object({
      ...base,
      type: z.literal("shape"),
      shape: z.enum(["rect", "ellipse", "line"]),
      fill: paint.nullable(),
      stroke: paint.nullable(),
      stroke_width: z.number(),
      radius: z.number().describe("Corner radius of a rect."),
      dash: z.enum(["solid", "dashed", "dotted"]),
    }),
    z.object({
      ...base,
      type: z.literal("image"),
      asset_id: z.uuid(),
      flip_x: z.boolean(),
      flip_y: z.boolean(),
    }),
    z.object({
      ...base,
      type: z.literal("logo"),
    }),
    z.object({
      ...base,
      type: z.literal("qr"),
      color: color.describe("Needs 4.5:1 against white. Exactly one QR per design, at least 56 points wide."),
    }),
  ])).describe("Drawn in order, from the back to the front. A design needs the QR code and a text with {{codigo}}."),
})
