import { z } from "zod/v4";

export const deleteUserDoc = {
  tags: ["user"],
  summary: "Delete the authenticated user",
  description: "Removes the authenticated user from the system. The id comes from the bearer token, never from the URL, so a user can only delete their own account.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  response: {
    204: z.object({}).describe("Deleted successful, no content on response."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: The bearer token is missing, expired or invalid."),

    404: z.object({
      error: z.string(),
    }).describe("User not registered, impossible to delete."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}