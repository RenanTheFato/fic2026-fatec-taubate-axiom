import { z } from "zod/v4";

export const deleteEventDoc = {
  tags: ["event"],
  summary: "Delete an event",
  description: "Removes a registered event from the system where status equals draft. An event that was ever published is cancelled instead, never deleted. Only by admins.",
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
    204: z.object({}).describe("Deleted successfully, no content on response."),

    400: z.object({
      error: z.string(),
    }).describe("Bad Request — The event isn't a draft."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to delete events."),

    404: z.object({
      error: z.string(),
    }).describe("Event not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
