import { z } from "zod/v4";
import { volunteerAreas, volunteerPeriods, validationErrorSchema } from "./volunteer-shape.doc.js";

export const applyVolunteerDoc = {
  tags: ["volunteer"],
  summary: "Sign up as a volunteer",
  description: "Public. Creates the account (role volunteer) and the registration under review, in one database transaction. The person signs in to follow the review; once the coordination approves, the open shifts show up in the panel.",
  body: z.object({
    name: z.string().meta({ example: "Lucas Ferreira" }),
    email: z.email().meta({ example: "lucas.ferreira@exemplo.com.br" }),
    password: z.string().describe("At least 8 characters, with an uppercase letter, a number and one of @ # $ * &.").meta({ example: "Parceria@2026" }),
    phone: z.string().describe("With the area code.").meta({ example: "19 99812-3344" }),
    city: z.string().nullish().meta({ example: "Indaiatuba" }),
    area: volunteerAreas,
    availability: z.array(volunteerPeriods).describe("At least one period."),
    about: z.string().describe("Between 20 and 2000 characters."),
  }),
  response: {
    201: z.object({
      message: z.string(),
      volunteer: z.object({
        id: z.string(),
        status: z.literal("pending"),
        created_at: z.iso.datetime(),
      }),
    }).describe("Registration received."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields or e-mail already in use."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
