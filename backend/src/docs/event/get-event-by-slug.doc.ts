import { z } from "zod/v4";

const validationErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const getEventBySlugDoc = {
  tags: ["event"],
  summary: "View one event",
  description: "Fetch the event where the slug equals the search.",
  params: z.object({
    slug: z.string()
      .describe("Public slug of the event.")
      .meta({ example: "atividade-em-publico-setembro-2026" }),
  }),
  response: {
    200: z.object({
      message: z.string()
        .describe("Success message."),
      event: z.object({
        id: z.string(),
        campaign_id: z.string().nullable(),
        title: z.string(),
        slug: z.string(),
        description: z.string().nullable(),
        location: z.string().nullable(),
        starts_at: z.iso.datetime(),
        ends_at: z.iso.datetime().nullable(),
        ticket_price: z.string(),
        capacity: z.number().nullable(),
        taken_seats: z.number(),
        status: z.string(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      }),
    }).describe("Event successfully fetched."),

    400: validationErrorSchema.describe("Bad Request — Validation failure or business rule violation."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  }
}