import { z } from "zod/v4";
import { assignmentSchema, validationErrorSchema } from "./volunteer-shift-shape.doc.js";

export const reviewVolunteerAssignmentDoc = {
  tags: ["volunteer-shift"],
  summary: "Confirm or dismiss a volunteer on a shift",
  description: "Admin and communication. Before the shift starts: confirmed counts on a pending volunteer; cancelled dismisses a pending or confirmed one and frees the slot.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the assignment.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  body: z.object({
    decision: z.enum(["confirmed", "cancelled"]),
  }),
  response: {
    200: z.object({
      message: z.string(),
      assignment: assignmentSchema,
    }).describe("Assignment reviewed."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields, a cancelled or started shift, or a status that doesn't allow the decision."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to coordinate volunteers."),

    404: z.object({
      error: z.string(),
    }).describe("Assignment not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
