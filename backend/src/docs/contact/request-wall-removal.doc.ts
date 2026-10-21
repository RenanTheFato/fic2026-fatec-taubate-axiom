import { z } from "zod/v4";
import { receivedSchema, validationErrorSchema } from "./contact-shape.doc.js";

export const requestWallRemovalDoc = {
  tags: ["contact"],
  summary: "Ask for a name to leave the supporters wall",
  description: "Public. Stores the request for the team; it never says whether the e-mail belongs to a donor, so the route cannot be used to find out who gave. The team matches the e-mail in the panel and withdraws the name through /contact/withdraw-from-wall/{id}.",
  body: z.object({
    name: z.string().describe("The name as it appears on the wall.").meta({ example: "Maria Oliveira" }),
    email: z.email().describe("The e-mail used in the contribution.").meta({ example: "maria@exemplo.com.br" }),
    message: z.string().nullish().describe("Optional note, at most 2000 characters.").meta({ example: "Doei pela campanha de Natal." }),
  }),
  response: {
    201: z.object({
      message: z.string(),
      contact: receivedSchema,
    }).describe("Request stored."),

    400: validationErrorSchema.describe("Bad Request: invalid fields."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
