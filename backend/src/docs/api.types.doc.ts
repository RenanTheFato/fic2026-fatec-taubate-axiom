import type { ZodObject, ZodType } from "zod/v4";

export interface ApiDoc<TBody extends ZodType | undefined = ZodType | undefined, 
  TResponses extends Record<number, ZodType> = Record<number, ZodType>> {
  tags: string[],
  summary: string,
  description: string,
  security?: { bearerAuth: string[] }[],
  contentType?: string,
  // Para a rara rota cujo corpo não é JSON, como o envio de imagem crua do certificado.
  bodyContentType?: string,
  params?: ZodObject,
  query?: ZodObject,
  body?: TBody,
  response: TResponses,
}
