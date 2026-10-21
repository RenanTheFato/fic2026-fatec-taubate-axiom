import { z } from "zod/v4";
import { contactSchema, validationErrorSchema } from "./contact-shape.doc.js";

export const resolveContactMessageDoc = {
  tags: ["contact"],
  summary: "Mark a message as resolved",
  description: "Records who resolved it and when. A message of a channel the role does not read answers 404, exactly as one that does not exist.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the message.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      contact: contactSchema,
    }).describe("Message resolved."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid id or the message is already resolved."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to answer messages."),

    404: z.object({
      error: z.string(),
    }).describe("Message not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
