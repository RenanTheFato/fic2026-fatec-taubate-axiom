import { z } from "zod/v4";

const validationErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const listEventsDoc = {
  tags: ["event"],
  summary: "View all events",
  description: "Fetches the events.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    page: z.coerce.number().int().positive()
      .optional()
      .describe("Page number, starting at 1.")
      .meta({ example: 1 }),
    limit: z.coerce.number().int().positive().max(50)
      .optional()
      .describe("Items per page, capped at 50.")
      .meta({ example: 20 }),
  }),
  response: {
    200: z.object({
      message: z.string()
        .describe("Success message."),
      events: z.array(z.object({
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
      })),
      total: z.number()
        .describe("Total number of events matching the filter, for pagination."),
    }).describe("Events successfully fetched."),

    400: validationErrorSchema.describe("Bad Request — Validation failure or business rule violation."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  }
}