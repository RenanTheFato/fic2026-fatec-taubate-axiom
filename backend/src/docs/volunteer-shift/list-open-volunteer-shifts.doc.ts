import { z } from "zod/v4";
import { shiftSchema } from "./volunteer-shift-shape.doc.js";

export const listOpenVolunteerShiftsDoc = {
  tags: ["volunteer-shift"],
  summary: "List the open shifts for the signed-in volunteer",
  description: "Role volunteer, approved only. Shifts that have not started, soonest first, with the free slots and the status of the person on each one.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  response: {
    200: z.object({
      message: z.string(),
      shifts: z.array(shiftSchema.extend({
        free_slots: z.number(),
        my_status: z.enum(["pending", "confirmed", "attended", "absent"]).nullable(),
      })),
    }).describe("Open shifts fetched."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only an approved volunteer reaches the scale."),

    404: z.object({
      error: z.string(),
    }).describe("The account has no volunteer registration."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
