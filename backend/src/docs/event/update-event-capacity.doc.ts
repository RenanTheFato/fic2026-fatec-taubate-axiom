import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const updateEventCapacityDoc = {
  tags: ["event"],
  summary: "Adjust an event's seat capacity",
  description: "Sets the event's capacity to the given absolute number of seats. Null means unlimited. Recuses a capacity lower than the seats already taken. Restricted to users with the admin or communication role.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid()
      .describe("Identifier of the event.")
      .meta({ example: "3c6b1f9e-2a4d-4e7b-8f10-5d9c2a7b3e61" }),
  }),
  body: z.object({
    capacity: z.number()
      .nullable()
      .describe("Maximum number of seats. Null means unlimited.")
      .meta({ example: 200 }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
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
    }).describe("Event capacity updated successfully."),

    400: validationErrorSchema.describe("Bad Request: Validation failure or capacity lower than seats taken."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden: The authenticated user's role is not allowed to adjust event capacity."),

    404: z.object({
      error: z.string(),
    }).describe("Event not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
