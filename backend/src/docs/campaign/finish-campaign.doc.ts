import { z } from "zod/v4";

export const finishCampaignDoc = {
  tags: ["campaign"],
  summary: "Finish an Campaign",
  description: "Turn an active campaign into an finished and visible publicly",
  security: [
    {
      bearerAuth: [],
    },
  ],
  response: {
    200: z.object({
      message: z.string()
    }).describe("Status changed sucessful"),

    400: z.object({
      error: z.string(),
    }).describe("Bad Request — Validation failure or business rule violation."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to publish campaigns."),

    404: z.object({
      error: z.string(),
    }).describe("Campaign not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}