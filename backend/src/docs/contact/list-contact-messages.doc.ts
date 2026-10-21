import { z } from "zod/v4";
import { contactSchema, validationErrorSchema } from "./contact-shape.doc.js";

export const listContactMessagesDoc = {
  tags: ["contact"],
  summary: "List the panel inbox",
  description: "Newest first. Admin reads every channel; communication reads contact and wall_removal only, because the ombudsman and job applications are kept with the administration. A wall removal request carries wall_status: listed (the e-mail has a name on the wall), not_listed (a donor, but nothing on the wall) or no_donor.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    status: z.enum(["open", "resolved"]).optional().describe("Only messages in this status."),
    channel: z.enum(["contact", "ombudsman", "work", "wall_removal"]).optional().describe("Only messages of this channel."),
    page: z.coerce.number().optional().describe("Page number, starting at 1.").meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("Messages per page, at most 50. Defaults to 20.").meta({ example: 20 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      contacts: z.array(contactSchema.extend({
        resolver: z.object({ id: z.string(), name: z.string() }).nullable(),
        wall_status: z.enum(["listed", "not_listed", "no_donor"]).nullable(),
      })),
      total: z.number().describe("Messages matching the filters."),
      open: z.number().describe("Open messages in the channels the role reads, whatever the status filter."),
    }).describe("Messages fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to read messages."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
