import { z } from "zod/v4";
import { receivedSchema, validationErrorSchema } from "./contact-shape.doc.js";

export const createContactMessageDoc = {
  tags: ["contact"],
  summary: "Send a message to the association",
  description: "Public. What the contact, ombudsman and job application forms of the site send. The message is stored open and shows up in the panel inbox: contact for admin and communication, ombudsman and work for admin only. The answer goes to the e-mail informed.",
  body: z.object({
    channel: z.enum(["contact", "ombudsman", "work"]).describe("Which form sent the message."),
    subject: z.string()
      .describe("Option key of the form. contact: atendimento, doacao, voluntariado, parceria, documento, outro. ombudsman: elogio, sugestao, reclamacao, denuncia. work: clinico, educacao, administrativo, comunicacao, apoio, outra.")
      .meta({ example: "doacao" }),
    name: z.string().describe("Full name, at least 3 characters.").meta({ example: "Maria Oliveira" }),
    email: z.email().describe("Where the answer goes.").meta({ example: "maria@exemplo.com.br" }),
    phone: z.string().nullish().describe("Optional phone.").meta({ example: "19 99876-5432" }),
    message: z.string().describe("Between 20 and 5000 characters.").meta({ example: "Gostaria de saber se a doação pode ser feita em nome da empresa." }),
  }),
  response: {
    201: z.object({
      message: z.string(),
      contact: receivedSchema,
    }).describe("Message stored."),

    400: validationErrorSchema.describe("Bad Request: invalid fields or a subject that is not an option of the channel."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
