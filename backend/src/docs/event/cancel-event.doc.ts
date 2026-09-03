import { z } from "zod/v4";

export const cancelEventDoc = {
  tags: ["event"],
  summary: "Cancel an event",
  description: "Turns a draft or published event into cancelled. The event leaves the public agenda without deleting anything already registered against it. Only by admins.",
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
  response: {
    200: z.object({
      message: z.string()
    }).describe("Status changed successfully."),

    400: z.object({
      error: z.string(),
    }).describe("Bad Request: The event isn't a draft or published."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden: The authenticated user's role is not allowed to cancel events."),

    404: z.object({
      error: z.string(),
    }).describe("Event not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
