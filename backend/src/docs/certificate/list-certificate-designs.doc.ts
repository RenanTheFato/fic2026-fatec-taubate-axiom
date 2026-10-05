import { z } from "zod/v4";
import { certificateDesignShape } from "./certificate-design-shape.doc.js";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

const versionSchema = z.object({
  id: z.string(),
  scope: z.enum(["default", "campaign", "event"]),
  campaign_id: z.string().nullable(),
  event_id: z.string().nullable(),
  folder: z.string().meta({ example: "campaign:0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  version: z.number(),
  label: z.string(),
  design: certificateDesignShape,
  created_by: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const listCertificateDesignsDoc = {
  tags: ["certificate"],
  summary: "List the version history of a folder",
  description: "Every version ever saved in the folder, newest first, with its author and the number of receipts issued with it. Versions are never edited: the history is complete.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    scope: z.enum(["default", "campaign", "event"]).describe("Which kind of folder."),
    target_id: z.uuid().optional().describe("The campaign or event id. Omitted for the default folder."),
  }),
  response: {
    200: z.object({
      message: z.string(),
      designs: z.array(versionSchema.extend({
        author: z.object({ id: z.string(), name: z.string() }).nullable(),
        issued: z.number(),
      })),
    }).describe("History fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to manage certificates."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
