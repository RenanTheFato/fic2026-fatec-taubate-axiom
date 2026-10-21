import { z } from "zod/v4";
import { validationErrorSchema } from "./registration-shape.doc.js";

export const createRegistrationDoc = {
  tags: ["registration"],
  summary: "Register for a free event",
  description: "Public. Only for a published, free event that has not ended. The seat is taken by a conditional update, as on a paid ticket, so the last seat goes to one person only. The same name and e-mail cannot register twice for the same event. A paid ticket never comes through here: its registration is created when the payment is confirmed.",
  body: z.object({
    event_id: z.uuid().describe("The event, as returned by GET /event/{slug}.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
    participant_name: z.string().describe("Who is going, at least 3 characters.").meta({ example: "Maria Oliveira" }),
    participant_email: z.email().describe("Where the association reaches the participant.").meta({ example: "maria@exemplo.com.br" }),
    participant_phone: z.string().nullish().describe("Optional phone.").meta({ example: "19 99876-5432" }),
  }),
  response: {
    201: z.object({
      message: z.string(),
      registration: z.object({
        id: z.string(),
        ticket_code: z.string().meta({ example: "7KQ2M-X9D4R" }),
        participant_name: z.string(),
        status: z.literal("confirmed"),
        event: z.object({ title: z.string(), slug: z.string(), starts_at: z.iso.datetime() }),
      }),
    }).describe("Registered. The ticket code opens GET /registration/ticket/{code}."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields, paid event, registrations closed, repeated registration or no seats left."),

    404: z.object({
      error: z.string(),
    }).describe("Event not found, or not on the agenda."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
