import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const listIssuedCertificatesDoc = {
  tags: ["certificate"],
  summary: "List the certificates issued from a folder",
  description: "The receipts issued with the folder's versions, newest first, each openable at /receipt/certificate/:hash exactly as the donor received it. Carries donor names, so it answers to admin and finance.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    scope: z.enum(["default", "campaign", "event"]).describe("Which kind of folder."),
    target_id: z.uuid().optional().describe("The campaign or event id. Omitted for the default folder."),
    design_id: z.uuid().optional().describe("Only one version of the folder."),
    page: z.coerce.number().optional().meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("At most 50. Defaults to 20.").meta({ example: 20 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      certificates: z.array(z.object({
        id: z.string(),
        number: z.string(),
        sequence: z.number(),
        donor_name: z.string(),
        amount: z.string(),
        transaction_type: z.string(),
        status: z.enum(["issued", "cancelled"]),
        issued_at: z.iso.datetime(),
        hash: z.string(),
        certificate_design_id: z.string(),
        design_version: z.number().nullable(),
        design_label: z.string().nullable(),
      })),
      total: z.number(),
    }).describe("Certificates fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to list issued certificates."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
