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

// O mesmo gesto sem o valor, para o certificado que leva uma mensagem no lugar dele. A frase da
// `acao` termina pedindo o número ("com a doação de"), e por isso não serve ali.
export const CERTIFICATE_GESTURE_BY_TYPE: Record<TransactionType, string> = {
  donation: "contribuiu com uma doação",
  sponsorship: "apoiou nossas ações como patrocinador",
  ticket: "esteve presente conosco",
  product: "apoiou nossas ações pela loja solidária",
}

// O complemento de "destinada" no certificado. Evento vem antes de campanha porque é o mais
// específico: um convite do Chefs do Bem também aponta para a campanha que o evento sustenta.
export function destinationPhrase(destination: { event?: string | null, campaign?: string | null }) {
  if (destination.event) {
    return `ao evento ${destination.event}`
  }

  if (destination.campaign) {
    return `à campanha ${destination.campaign}`
  }

  return null
}
