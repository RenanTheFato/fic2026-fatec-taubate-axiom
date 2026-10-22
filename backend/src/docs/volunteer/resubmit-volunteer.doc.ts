import { z } from "zod/v4";
import { volunteerAreas, volunteerPeriods, volunteerSchema, validationErrorSchema } from "./volunteer-shape.doc.js";

export const resubmitVolunteerDoc = {
  tags: ["volunteer"],
  summary: "Send a refused registration again",
  description: "Role volunteer. Only a refused registration; it goes back to the coordination as pending.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    area: volunteerAreas,
    availability: z.array(volunteerPeriods),
    about: z.string(),
  }),
  response: {
    200: z.object({
      message: z.string(),
      volunteer: volunteerSchema,
    }).describe("Registration sent again."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields, or the registration is not refused."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only a volunteer account has a registration."),

    404: z.object({
      error: z.string(),
    }).describe("The account has no volunteer registration."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
