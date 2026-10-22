import { z } from "zod/v4";
import { assignmentSchema, validationErrorSchema } from "./volunteer-shift-shape.doc.js";

export const recordVolunteerAttendanceDoc = {
  tags: ["volunteer-shift"],
  summary: "Record the attendance of a volunteer",
  description: "Admin and communication. After the shift starts. attended turns into validated hours (the shift duration, unless hours is sent); absent records no hours. It can be corrected.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the assignment.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  body: z.object({
    attended: z.boolean(),
    hours: z.number().nullish().describe("Between 0 and 24, at most two decimals. Defaults to the shift duration.").meta({ example: 2.5 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      assignment: assignmentSchema,
    }).describe("Attendance recorded."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields, a shift that has not started, or a volunteer who left before it."),

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
