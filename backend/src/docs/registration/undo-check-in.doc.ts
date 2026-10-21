import { z } from "zod/v4";
import { idParams, protectedErrors, registrationSchema, validationErrorSchema } from "./registration-shape.doc.js";

export const undoCheckInDoc = {
  tags: ["registration"],
  summary: "Undo a check-in",
  description: "Clears an entry recorded on the wrong line, so the attendance list does not count someone who did not come.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: idParams,
  response: {
    200: z.object({
      message: z.string(),
      registration: registrationSchema,
    }).describe("Entry cleared."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid id or the ticket was not checked in."),

    404: z.object({
      error: z.string(),
    }).describe("Registration not found."),

    ...protectedErrors,
  },
}
