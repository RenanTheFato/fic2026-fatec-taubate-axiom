import { z } from "zod/v4";

export const cancelCampaignDoc = {
  tags: ["campaign"],
  summary: "Cancel an Campaign",
  description: "Turn an active or draft campaign into an cancelled",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid()
      .describe("Identifier of the campaign.")
      .meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
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