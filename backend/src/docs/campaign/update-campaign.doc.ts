import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

const serviceErrorSchema = z.object({
  error: z.string(),
}).describe("A business logic error occurred during campaign update.")

export const updateCampaignDoc = {
  tags: ["campaign"],
  summary: "Update an existing campaign",
  description: "Updates the editable fields of a campaign that is still a draft or active. The slug and the status are never changed here, and the raised amount is never editable.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid()
      .describe("Identifier of the campaign.")
      .meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  body: z.object({
    title: z.string()
      .optional()
      .describe("Public title of the campaign. Changing it does not change the slug.")
      .meta({ example: "Natal Solidário 2026" }),
    description: z.string()
      .nullish()
      .describe("Long description shown on the campaign page.")
      .meta({ example: "Arrecadação de cestas básicas para 200 famílias." }),
    goal_amount: z.number()
      .optional()
      .describe("Fundraising goal, with at most two decimal places.")
      .meta({ example: 30000.00 }),
    starts_at: z.iso.datetime()
      .optional()
      .describe("Date the campaign starts accepting donations.")
      .meta({ example: "2026-11-01T00:00:00.000Z" }),
    ends_at: z.iso.datetime()
      .nullish()
      .describe("Date the campaign closes. Null means open-ended.")
      .meta({ example: "2026-12-25T23:59:59.000Z" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      campaign: z.object({
        id: z.string(),
        title: z.string(),
        slug: z.string(),
        description: z.string().nullable(),
        goal_amount: z.string(),
        raised_amount: z.string(),
        starts_at: z.iso.datetime(),
        ends_at: z.iso.datetime().nullable(),
        status: z.string(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      }),
    }).describe("Campaign updated successfully."),

    400: z.union([validationErrorSchema, serviceErrorSchema])
      .describe("Bad Request — Validation failure or business rule violation."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to update campaigns."),

    404: z.object({
      error: z.string(),
    }).describe("Campaign not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
