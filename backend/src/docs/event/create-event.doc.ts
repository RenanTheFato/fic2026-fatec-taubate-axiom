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
}).describe("A business logic error occurred during event creation.")

const internalErrorSchema = z.object({
  error: z.string(),
}).describe("Unexpected internal server error.")

export const createEventDoc = {
  tags: ["event"],
  summary: "Create a new event",
  description: "Registers a new event as a draft. The event stays out of the public listing until it is published, and its seats are only taken when a ticket payment is confirmed. Restricted to users with the admin or communication role.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    campaign_id: z.uuid()
      .nullish()
      .describe("Campaign this event belongs to. Optional: an event can exist on its own.")
      .meta({ example: "9f1d4c2e-6b7a-4d3f-8c21-0a5e7b9d1c34" }),
    title: z.string()
      .describe("Public title of the event. The slug is derived from it and must be unique.")
      .meta({ example: "Jantar Beneficente Somos do Bem" }),
    description: z.string()
      .nullish()
      .describe("Long description shown on the event page.")
      .meta({ example: "Jantar com renda revertida para a campanha de inverno." }),
    location: z.string()
      .nullish()
      .describe("Where the event happens.")
      .meta({ example: "Salão Paroquial, Rua das Flores 120, Sorocaba" }),
    starts_at: z.iso.datetime()
      .describe("Start date and time of the event.")
      .meta({ example: "2026-09-12T20:00:00.000Z" }),
    ends_at: z.iso.datetime()
      .nullish()
      .describe("End date and time. When informed, must be after the start date.")
      .meta({ example: "2026-09-12T23:30:00.000Z" }),
    ticket_price: z.number()
      .optional()
      .describe("Ticket price, with at most two decimal places. Defaults to zero, which means a free event.")
      .meta({ example: 120.00 }),
    capacity: z.number()
      .nullish()
      .describe("Maximum number of seats. Null means unlimited.")
      .meta({ example: 150 }),
  }),
  response: {
    201: z.object({
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
    }).describe("Event created successfully."),

    400: z.union([validationErrorSchema, serviceErrorSchema])
      .describe("Bad Request: Validation failure, duplicated title or invalid campaign."),

    401: z.object({
      error: z.string()
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden: The authenticated user's role is not allowed to create events."),

    500: internalErrorSchema.describe("Internal Server Error: Unexpected failure during event creation."),
  },
}
