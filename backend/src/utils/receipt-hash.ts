import { createHash } from "node:crypto";

// A corrente de recibos: cada documento carrega o hash do anterior, então alterar um registro
// antigo muda o hash dele e quebra o elo de todos os que vieram depois. A verificação pública
// recalcula esta mesma função sobre o que está gravado e compara com o hash guardado: por isso
// a montagem da string canônica não pode mudar depois que o primeiro recibo for emitido.

export interface ReceiptHashPayload {
  sequence: number,
  number: string,
  transaction_id: string,
  transaction_type: string,
  amount: string,
  donor_name: string,
  donor_document: string | null,
  issued_at: Date,
  previous_hash: string | null,
}

// O MySQL guarda DATETIME com precisão de segundo e descarta os milissegundos na escrita. Se o
// hash fosse calculado sobre o instante cheio, o valor relido do banco seria outro e toda
// verificação falharia. A data é truncada antes de assinar e antes de gravar.
export function truncateToSecond(date: Date) {
  return new Date(Math.floor(date.getTime() / 1000) * 1000)
}

export function buildReceiptHash(payload: ReceiptHashPayload) {
  const canonical = [
    payload.sequence,
    payload.number,
    payload.transaction_id,
    payload.transaction_type,
    payload.amount,
    payload.donor_name,
    payload.donor_document ?? "",
    truncateToSecond(new Date(payload.issued_at)).toISOString(),
    payload.previous_hash ?? "",
  ].join("|")

  return createHash("sha256").update(canonical, "utf8").digest("hex")
}

// O número impresso deriva da sequence e não reinicia a cada ano: uma numeração que reinicia
// repetiria "2027/000001" depois de "2026/000001" e deixaria de identificar o documento sozinha.
export function buildReceiptNumber(sequence: number, issuedAt: Date) {
  return `${issuedAt.getUTCFullYear()}/${String(sequence).padStart(6, "0")}`
}
