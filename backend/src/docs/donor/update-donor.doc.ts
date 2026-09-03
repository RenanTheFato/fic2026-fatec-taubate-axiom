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
}).describe("A business logic error occurred during donor update.")

export const updateDonorDoc = {
  tags: ["donor"],
  summary: "Update the contact data of a donor",
  description: "Updates the contact fields of a donor. The document, the document type and the linked account are never editable here: a different document means a different person, and the current record may already have a receipt issued in the stored name. An anonymized donor cannot be updated.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid()
      .describe("Identifier of the donor.")
      .meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  body: z.object({
    name: z.string()
      .optional()
      .describe("Full name of the person or company.")
      .meta({ example: "Maria Aparecida Souza" }),
    email: z.email()
      .optional()
      .describe("Contact email, used to send the receipt.")
      .meta({ example: "maria@email.com" }),
    phone: z.string()
      .nullish()
      .describe("Contact phone. Null clears it.")
      .meta({ example: "+55 15 99999-0000" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      donor: z.object({
        id: z.string(),
        user_id: z.string().nullable(),
        name: z.string(),
        email: z.string(),
        document: z.string().nullable(),
        document_type: z.string().nullable(),
        phone: z.string().nullable(),
        anonymized_at: z.iso.datetime().nullable(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      }),
    }).describe("Donor updated successfully."),

    400: z.union([validationErrorSchema, serviceErrorSchema])
      .describe("Bad Request: Validation failure, empty body or an already anonymized donor."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden: The authenticated user's role is not allowed to update donors."),

    404: z.object({
      error: z.string(),
    }).describe("Donor not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
