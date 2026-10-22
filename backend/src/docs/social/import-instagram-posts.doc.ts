import { z } from "zod/v4";
import { validationErrorSchema } from "./social-shape.doc.js";

export const importInstagramPostsDoc = {
  tags: ["social"],
  summary: "Import the latest Instagram posts",
  description: "Admin and communication. Reads the 12 latest media of the association account through the official Instagram API, with the long-lived token in INSTAGRAM_ACCESS_TOKEN, and copies each image to the photo table, because the Instagram image address expires in a few days. Posts already imported are skipped by their media id, so running it again only brings what is new.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  response: {
    200: z.object({
      message: z.string(),
      imported: z.number(),
      skipped: z.number().describe("Already on the site."),
      failed: z.number().describe("Media whose image could not be downloaded; they come on the next import."),
    }).describe("Import finished."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: the integration is not configured, or Instagram refused the request."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to manage the social media page."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
