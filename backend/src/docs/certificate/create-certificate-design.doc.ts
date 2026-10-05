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

export const createCertificateDesignDoc = {
  tags: ["certificate"],
  summary: "Save a new certificate version",
  description: "Appends the next version to the folder. Nothing is overwritten: receipts issued with an earlier version keep rendering with it. A receipt takes, when issued, the newest version of the most specific folder that has one: event, then campaign, then default.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    scope: z.enum(["default", "campaign", "event"]),
    target_id: z.uuid().nullish().describe("The campaign or event id. Null for the default folder."),
    label: z.string().describe("Short name of the version.").meta({ example: "Natal com enfeites dourados" }),
    design: certificateDesignShape,
  }),
  response: {
    201: z.object({
      message: z.string(),
      design: versionSchema,
    }).describe("Version saved."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })])
      .describe("Bad Request: invalid design (no QR, no {{codigo}}, unreadable text over its backdrop, unknown field or character), missing image, unknown target or a concurrent save."),

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
