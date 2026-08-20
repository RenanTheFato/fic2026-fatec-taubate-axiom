import { z } from "zod/v4";

export const getUserProfileDoc = {
  tags: ["user", "profile"],
  summary: "View authenticated user information",
  description: "Fetches the profile data of the currently authenticated user. Requires a valid JWT token.",
  security: [
    {
      bearerAuth: []
    }
  ],
  response: {
    200: z.object({
      message: z.string()
        .describe("Success message."),
      user: z.object({
        id: z.string(),
        user_id: z.string(),
        name: z.string(),
        email: z.string(),
        document: z.string(),
        document_type: z.string(),
        phone: z.string(),
        created_at: z.date().describe("Account creation timestamp."),
        updated_at: z.date().describe("Last update timestamp."),
      }),
    }).describe("Donor data successfully fetched."),

    400: z.object({
      error: z.string(),
    }).describe("Missing user ID or donor does not exist."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    404: z.object({
      error: z.string(),
    }).describe("Donor not found in database."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  }
}