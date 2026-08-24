import { TransactionType } from "../models/transaction-model.js";

// Vocabulário compartilhado pelos dois templates de recibo. Fica num arquivo só para o documento
// institucional e o certificado nunca chamarem a mesma doação por nomes diferentes.

export const RECEIPT_TITLE_BY_TYPE: Record<TransactionType, string> = {
  donation: "RECIBO DE DOAÇÃO",
  sponsorship: "RECIBO DE PATROCÍNIO",
  ticket: "RECIBO DE INGRESSO",
  product: "RECIBO DE COMPRA",
}

export const CERTIFICATE_TITLE_BY_TYPE: Record<TransactionType, string> = {
  donation: "Certificado de Doação",
  sponsorship: "Certificado de Patrocínio",
  ticket: "Certificado de Participação",
  product: "Certificado de Apoio",
}

export const RECEIPT_SUBJECT_BY_TYPE: Record<TransactionType, string> = {
  donation: "doação",
  sponsorship: "patrocínio",
  ticket: "compra de ingresso",
  product: "compra de produto",
}

export const CERTIFICATE_DEED_BY_TYPE: Record<TransactionType, string> = {
  donation: "contribuiu com a doação de",
  sponsorship: "apoiou nossas ações como patrocinador, com",
  ticket: "esteve presente conosco, com a aquisição de ingresso no valor de",
  product: "apoiou nossas ações pela loja solidária, com",
}
