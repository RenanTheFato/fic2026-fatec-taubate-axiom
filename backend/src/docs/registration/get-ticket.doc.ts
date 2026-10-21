import { z } from "zod/v4";
import { codeParams, validationErrorSchema } from "./registration-shape.doc.js";

export const getTicketDoc = {
  tags: ["registration"],
  summary: "Read a ticket by its code",
  description: "Public. The code is the credential, as the hash is for a receipt, so the answer carries the participant name the door checks but never the e-mail or the phone. The QR is an SVG data url that encodes the site address of this ticket: a staff phone camera opens the page and checks the person in from there.",
  params: codeParams,
  response: {
    200: z.object({
      message: z.string(),
      ticket: z.object({
        id: z.string(),
        ticket_code: z.string(),
        participant_name: z.string(),
        status: z.enum(["confirmed", "cancelled"]),
        paid: z.boolean().describe("True for a paid ticket, false for a free registration."),
        checked_in_at: z.iso.datetime().nullable(),
        event: z.object({
          id: z.string(),
          title: z.string(),
          slug: z.string(),
          location: z.string().nullable(),
          starts_at: z.iso.datetime(),
          ends_at: z.iso.datetime().nullable(),
          status: z.enum(["draft", "published", "finished", "cancelled"]),
        }),
        qr: z.string().describe("data:image/svg+xml;base64 QR code."),
      }),
    }).describe("Ticket fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid code."),

    404: z.object({
      error: z.string(),
    }).describe("No registration with this code."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
