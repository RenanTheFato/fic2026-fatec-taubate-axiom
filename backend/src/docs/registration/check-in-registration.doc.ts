import { z } from "zod/v4";
import { codeParams, protectedErrors, registrationSchema, validationErrorSchema } from "./registration-shape.doc.js";

export const checkInRegistrationDoc = {
  tags: ["registration"],
  summary: "Check a ticket in at the door",
  description: "Records the entry and who recorded it. The event goes in the body because the door works one event at a time: a valid ticket for another event is refused. A cancelled registration, a ticket already checked in and a cancelled event are refused too. Two doors reading the same ticket queue on the row lock, and the second one sees the first entry.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: codeParams,
  body: z.object({
    event_id: z.uuid().describe("The event the door is working.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      registration: registrationSchema,
    }).describe("Entry recorded."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: another event, cancelled registration, already checked in, or an event not taking check-ins."),

    404: z.object({
      error: z.string(),
    }).describe("No registration with this code."),

    ...protectedErrors,
  },
}
