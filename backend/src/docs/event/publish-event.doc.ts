import { z } from "zod/v4";

export const publishEventDoc = {
  tags: ["event"],
  summary: "Publish an event",
  description: "Turns a draft event into published and visible in the public agenda. Requires the event to still be a draft and its start date to be in the future. Restricted to users with the admin or communication role.",
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
    }).describe("Published successfully."),

    400: z.object({
      error: z.string(),
    }).describe("Bad Request — The event isn't a draft, or its start date already passed."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to publish events."),

    404: z.object({
      error: z.string(),
    }).describe("Event not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
