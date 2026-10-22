import { z } from "zod/v4";

// O formato de um parceiro e do pedido de parceria, compartilhado pelas rotas do domínio.

export const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const partnerInterests = z.enum(["sponsorship", "contribution", "in_kind", "volunteering", "institutional"])

export const partnerSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable().describe("The account the company signs in with. Null for partners that joined before the platform."),
  company_name: z.string(),
  document: z.string().nullable().describe("CNPJ, digits only."),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  logo_url: z.string().nullable(),
  interests: z.array(partnerInterests),
  message: z.string().nullable(),
  public_listing: z.boolean().describe("The company authorized its brand on the public partners page."),
  status: z.enum(["pending", "approved", "refused"]),
  review_note: z.string().nullable(),
  reviewed_at: z.iso.datetime().nullable(),
  reviewed_by: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})
