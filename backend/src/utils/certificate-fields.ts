import { organization } from "../config/organization.js";
import { ReceiptInterface } from "../interfaces/receipt-interface.js";
import type { CertificateField } from "./certificate-layout.js";
import { formatDate, formatMoney } from "./pdf-document.js";
import { CERTIFICATE_DEED_BY_TYPE, CERTIFICATE_TITLE_BY_TYPE } from "./receipt-labels.js";

export type CertificateReceipt = Pick<ReceiptInterface,
  "number" | "sequence" | "status" | "donor_name" | "amount" | "transaction_type" | "issued_at" | "hash"
>

// O valor de cada campo do certificado para um recibo. É daqui que saem o PDF e a página pública
// de segunda via, então o nome, o valor e a data aparecem escritos do mesmo jeito nos dois.
// O documento do doador nunca vira campo: o certificado é a peça que circula.
export function certificateFields(receipt: CertificateReceipt, destination: string | null): Record<CertificateField, string> {
  return {
    nome: receipt.donor_name,
    valor: formatMoney(receipt.amount),
    titulo: CERTIFICATE_TITLE_BY_TYPE[receipt.transaction_type],
    acao: CERTIFICATE_DEED_BY_TYPE[receipt.transaction_type],
    destino: destination ?? `às atividades da ${organization.name}`,
    numero: receipt.number,
    data: formatDate(receipt.issued_at),
    registro: String(receipt.sequence),
    codigo: receipt.hash,
    associacao: organization.name,
    cnpj: organization.document,
  }
}
