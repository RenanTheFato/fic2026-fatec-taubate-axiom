import { z } from "zod/v4";

const validationErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

const serviceErrorSchema = z.object({
  error: z.string(),
}).describe("A business logic error occurred during campaign creation.")

const internalErrorSchema = z.object({
  error: z.string(),
}).describe("Unexpected internal server error.")

export const createCampaignDoc = {
  tags: ["campaign"],
  summary: "Create a new fundraising campaign",
  description: "Registers a new campaign, generating its public slug from the title and starting it as a draft. Restricted to users with the admin or communication role.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    title: z.string()
      .describe("Public title of the campaign.")
      .meta({ example: "Natal Solidário 2026" }),
    description: z.string()
      .nullish()
      .describe("Long description shown on the campaign page.")
      .meta({ example: "Arrecadação de cestas básicas para 200 famílias." }),
    goal_amount: z.number()
      .describe("Fundraising goal, with at most two decimal places.")
      .meta({ example: 25000.00 }),
    starts_at: z.iso.datetime()
      .describe("Date the campaign starts accepting donations.")
      .meta({ example: "2026-11-01T00:00:00.000Z" }),
    ends_at: z.iso.datetime()
      .nullish()
      .describe("Date the campaign closes. Null means open-ended.").
      meta({ example: "2026-12-25T23:59:59.000Z" }),
  }),
  response: {
    201: z.object({
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
    }).describe("Campaign created successfully."),

    400: z.union([validationErrorSchema, serviceErrorSchema])
      .describe("Bad Request — Validation failure or business rule violation."),

    401: z.object({
      error: z.string()
    }).describe("Unauthorized — Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to create campaigns."),

    500: internalErrorSchema.describe("Internal Server Error — Unexpected failure during campaign creation."),
  },
}
