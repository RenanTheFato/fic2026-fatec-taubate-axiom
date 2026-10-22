import { z } from "zod/v4";
import { volunteerSchema, validationErrorSchema } from "./volunteer-shape.doc.js";

export const reviewVolunteerDoc = {
  tags: ["volunteer"],
  summary: "Approve or refuse a volunteer registration",
  description: "Admin and communication. Only a pending registration. Refusing requires a reason of at least 10 characters, which the person reads in the panel.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the volunteer registration.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  body: z.object({
    decision: z.enum(["approved", "refused"]),
    note: z.string().nullish().describe("Required on a refusal."),
  }),
  response: {
    200: z.object({
      message: z.string(),
      volunteer: volunteerSchema,
    }).describe("Registration reviewed."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields, refusal without a reason, or a registration already reviewed."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to coordinate volunteers."),

    404: z.object({
      error: z.string(),
    }).describe("Registration not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
