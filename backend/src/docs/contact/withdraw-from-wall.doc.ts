import { z } from "zod/v4";
import { contactSchema, validationErrorSchema } from "./contact-shape.doc.js";

export const withdrawFromWallDoc = {
  tags: ["contact"],
  summary: "Withdraw a name from the supporters wall",
  description: "Answers a wall removal request: unticks public_recognition on every contribution of the donors that use the e-mail of the request and resolves the request, in one database transaction. The name leaves the site wall, the campaign wall and the event wall at once. Contributions, receipts and certificates stay valid.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the wall removal request.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      contact: contactSchema,
      withdrawn: z.number().describe("Contributions that stopped showing the name."),
    }).describe("Name withdrawn and request resolved."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid id, a message that is not a wall removal request, or no donor with that e-mail."),

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
