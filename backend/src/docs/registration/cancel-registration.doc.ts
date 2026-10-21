import { z } from "zod/v4";
import { idParams, protectedErrors, registrationSchema, validationErrorSchema } from "./registration-shape.doc.js";

export const cancelRegistrationDoc = {
  tags: ["registration"],
  summary: "Cancel a free registration",
  description: "Cancels the registration and gives the seat back, in one database transaction. A paid ticket is refused: it is cancelled by refunding its transaction, which also returns the money and cancels the receipt. A registration already checked in is refused too.",
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
    }).describe("Registration cancelled and seat released."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid id, paid ticket, already cancelled or already checked in."),

    404: z.object({
      error: z.string(),
    }).describe("Registration not found."),

    ...protectedErrors,
  },
}
