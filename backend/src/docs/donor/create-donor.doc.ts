import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

const serviceErrorSchema = z.object({
  error: z.string(),
}).describe("A business logic error occurred during donor creation.")

const donorSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable(),
  name: z.string(),
  email: z.string(),
  document: z.string().nullable(),
  document_type: z.string().nullable(),
  phone: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const createDonorDoc = {
  tags: ["donor"],
  summary: "Register a donor",
  description: "Registers a donor for the negotiated donation flow, deriving the document type from the document itself. If a donor with the same document (or the same email, when no document is given) already exists, the existing record is returned instead of a duplicate. Restricted to users with the admin or staff role.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    name: z.string()
      .describe("Full name of the person or company.")
      .meta({ example: "Maria Aparecida Souza" }),
    email: z.email()
      .describe("Contact email, used to send the receipt.")
      .meta({ example: "maria@email.com" }),
    document: z.string()
      .nullish()
      .describe("CPF or CNPJ. Formatting characters are stripped before storing.")
      .meta({ example: "123.456.789-09" }),
    phone: z.string()
      .nullish()
      .describe("Contact phone.")
      .meta({ example: "+55 15 99999-0000" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Informs that the donor was already registered."),
      donor: donorSchema,
    }).describe("Donor already existed and was returned unchanged."),

    201: z.object({
      message: z.string().describe("Success message."),
      donor: donorSchema,
    }).describe("Donor registered successfully."),

    400: z.union([validationErrorSchema, serviceErrorSchema])
      .describe("Bad Request — Validation failure or invalid document."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to register donors."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
