import { z } from "zod/v4";
import { protectedErrors, registrationSchema, validationErrorSchema } from "./registration-shape.doc.js";

export const listEventRegistrationsDoc = {
  tags: ["registration"],
  summary: "List the registrations of an event",
  description: "The attendance list, in alphabetical order, with the event and the counts the door needs. Carries participant e-mail and phone, so it answers only to admin and communication.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the event.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  query: z.object({
    page: z.coerce.number().optional().describe("Page number, starting at 1.").meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("Registrations per page, at most 1000. Defaults to 500.").meta({ example: 500 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      event: z.object({
        id: z.string(),
        title: z.string(),
        slug: z.string(),
        location: z.string().nullable(),
        starts_at: z.iso.datetime(),
        ends_at: z.iso.datetime().nullable(),
        ticket_price: z.string(),
        capacity: z.number().nullable(),
        taken_seats: z.number(),
        status: z.enum(["draft", "published", "finished", "cancelled"]),
      }),
      registrations: z.array(registrationSchema.extend({
        checker: z.object({ id: z.string(), name: z.string() }).nullable(),
      })),
      total: z.number(),
      summary: z.object({
        confirmed: z.number(),
        checked_in: z.number(),
        cancelled: z.number(),
      }),
    }).describe("Attendance list fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid id or query."),

    404: z.object({
      error: z.string(),
    }).describe("Event not found."),

    ...protectedErrors,
  },
}
