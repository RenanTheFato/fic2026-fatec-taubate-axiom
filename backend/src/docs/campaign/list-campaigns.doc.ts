import { z } from "zod/v4";

const validationErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const listCampaignsDoc = {
  tags: ["campaign"],
  summary: "View all the public campaigns",
  description: "Fetches the campaigns where the status equals active or finished.",
  response: {
    200: z.object({
      message: z.string()
        .describe("Success message."),
      campaigns: z.array(z.object({
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
      }))
    }).describe("Campaigns successfully fetched."),

    400: validationErrorSchema.describe("Bad Request — Validation failure or business rule violation."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  }
}