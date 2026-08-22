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
}).describe("A business logic error occurred during event update.")

export const updateEventDoc = {
  tags: ["event"],
  summary: "Update an existing event",
  description: "Updates the editable fields of an event that isn't finished or cancelled. The slug, the status, the capacity and the taken seats are never changed here — capacity has its own route.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    event_id: z.uuid()
      .describe("Identifier of the event.")
      .meta({ example: "3c6b1f9e-2a4d-4e7b-8f10-5d9c2a7b3e61" }),
  }),
  body: z.object({
    campaign_id: z.uuid()
      .nullish()
      .describe("Campaign this event belongs to. Send null to detach it.")
      .meta({ example: "9f1d4c2e-6b7a-4d3f-8c21-0a5e7b9d1c34" }),
    title: z.string()
      .optional()
      .describe("Public title of the event. Changing it does not change the slug.")
      .meta({ example: "Jantar Beneficente Somos do Bem 2026" }),
    description: z.string()
      .nullish()
      .describe("Long description shown on the event page.")
      .meta({ example: "Jantar com renda revertida para a campanha de inverno." }),
    location: z.string()
      .nullish()
      .describe("Where the event happens.")
      .meta({ example: "Salão Paroquial, Rua das Flores 120, Sorocaba" }),
    starts_at: z.iso.datetime()
      .optional()
      .describe("Start date and time of the event.")
      .meta({ example: "2026-09-12T20:00:00.000Z" }),
    ends_at: z.iso.datetime()
      .nullish()
      .describe("End date and time. When informed, must be after the start date.")
      .meta({ example: "2026-09-12T23:30:00.000Z" }),
    ticket_price: z.number()
      .optional()
      .describe("Ticket price, with at most two decimal places.")
      .meta({ example: 120.00 }),
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
    }).describe("Event updated successfully."),

    400: z.union([validationErrorSchema, serviceErrorSchema])
      .describe("Bad Request — Validation failure or business rule violation."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to update events."),

    404: z.object({
      error: z.string(),
    }).describe("Event not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
