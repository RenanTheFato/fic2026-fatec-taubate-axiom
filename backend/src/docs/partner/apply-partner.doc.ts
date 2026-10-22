import { z } from "zod/v4";
import { partnerInterests, validationErrorSchema } from "./partner-shape.doc.js";

export const applyPartnerDoc = {
  tags: ["partner"],
  summary: "Ask to join the partner network",
  description: "Public. Creates the company account (role partner) and the request under review, in one database transaction. With the password already set, the company signs in to follow the review; the full panel, where it suggests campaigns, contributions and sponsorships, opens once the association approves.",
  body: z.object({
    company_name: z.string().describe("Between 3 and 160 characters.").meta({ example: "Horizonte Embalagens Ltda" }),
    document: z.string().describe("CNPJ, with or without punctuation. The check digits are verified.").meta({ example: "11.222.333/0001-81" }),
    phone: z.string().meta({ example: "19 3875-1200" }),
    website: z.url().nullish().meta({ example: "https://www.horizonte-embalagens.com.br" }),
    interests: z.array(partnerInterests).describe("At least one way of supporting."),
    message: z.string().describe("Between 20 and 3000 characters.").meta({ example: "Queremos patrocinar um evento por semestre e levar nossa equipe para um dia de voluntariado." }),
    public_listing: z.boolean().optional().describe("Authorizes the brand on the public partners page. Defaults to false."),
    name: z.string().describe("Name of the person who answers for the partnership.").meta({ example: "Carla Mendes" }),
    email: z.email().describe("The login of the company account.").meta({ example: "parcerias@horizonte-embalagens.com.br" }),
    password: z.string().describe("At least 8 characters, with an uppercase letter, a number and one of @ # $ * &.").meta({ example: "Parceria@2026" }),
  }),
  response: {
    201: z.object({
      message: z.string(),
      partner: z.object({
        id: z.string(),
        company_name: z.string(),
        status: z.literal("pending"),
        created_at: z.iso.datetime(),
      }),
    }).describe("Request received."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields, invalid CNPJ, or e-mail or CNPJ already in use."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
