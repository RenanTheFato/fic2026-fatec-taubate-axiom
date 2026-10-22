import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError, NotFoundError } from "../../config/errors"
import type {
  MyProposal,
  PartnerApplicationInput,
  PartnerInterest,
  PartnerProfile,
  ProposalInput,
} from "../../types/partner-types"

// O lado da empresa: o pedido de parceria feito pelo site e o painel da empresa
// aprovada. As recusas de regra que a pessoa precisa ler chegam em português; o
// resto vira uma frase que não promete o que não aconteceu.

const REFUSALS: Record<string, string> = {
  "Email is already in use": "Este e-mail já tem uma conta. Entre com ele para acompanhar o pedido.",
  "Email or CNPJ is already in use": "Este e-mail ou este CNPJ já tem um pedido de parceria.",
  "This CNPJ already has a partnership request": "Este CNPJ já tem um pedido de parceria. Entre com o e-mail usado nele.",
  "Only an approved partner can send proposals": "As propostas abrem depois que a associação aprova a parceria.",
  "Only a proposal under review can be withdrawn": "Esta proposta já foi respondida e não pode mais ser retirada.",
  "This proposal has already been paid": "Esta proposta já foi paga.",
  "The payment of this proposal is being processed": "O pagamento desta proposta está sendo processado. Não é preciso pagar de novo.",
  "Only an accepted proposal can be paid": "Só a proposta aceita pela associação pode ser paga.",
  "Only a refused request can be sent again": "Só um pedido recusado pode ser enviado de novo.",
  "The campaign must be active to receive a proposal": "Esta campanha não está recebendo apoio agora.",
  "The event must be published to receive a proposal": "Este evento não está recebendo apoio agora.",
  "Only an active campaign can receive new transactions": "A campanha desta proposta não está mais recebendo pagamentos. Fale com a captação.",
  "Only a published event can receive new transactions": "O evento desta proposta não está mais recebendo pagamentos. Fale com a captação.",
}

function refusal(error: unknown, fallback: string): unknown {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { error?: string; errors?: { message: string; path: string }[] } | undefined

    if (error.response.status === 400 || error.response.status === 403) {
      const known = data?.error ? REFUSALS[data.error] : undefined
      const cnpj = data?.errors?.some((issue) => issue.path === "document")

      return new CheckoutError(known ?? (cnpj ? "O CNPJ não confere. Confira os números e tente de novo." : fallback))
    }

    if (error.response.status === 404) {
      return new NotFoundError()
    }
  }

  return error
}

export async function applyPartner(input: PartnerApplicationInput): Promise<void> {
  try {
    await api.post("/partner/apply", input)
  } catch (error: unknown) {
    throw refusal(error, "Algum campo não foi aceito. Confira os dados e tente de novo.")
  }
}

type ProfileResponse = { partner: PartnerProfile }

export async function getPartnerProfile(): Promise<PartnerProfile> {
  const { data } = await api.get<ProfileResponse>("/partner/profile")

  return data.partner
}

export async function resubmitPartner(input: { interests: PartnerInterest[]; message: string }): Promise<void> {
  try {
    await api.patch("/partner/resubmit", input)
  } catch (error: unknown) {
    throw refusal(error, "O pedido não foi reenviado. Confira o texto e tente de novo.")
  }
}

type ProposalsResponse = { proposals: MyProposal[] }

export async function listMyProposals(): Promise<MyProposal[]> {
  const { data } = await api.get<ProposalsResponse>("/partner-proposal/mine")

  return data.proposals
}

export async function createProposal(input: ProposalInput): Promise<void> {
  try {
    await api.post("/partner-proposal/create", input)
  } catch (error: unknown) {
    throw refusal(error, "A proposta não foi enviada. Confira os campos e tente de novo.")
  }
}

export async function withdrawProposal(id: string): Promise<void> {
  try {
    await api.patch(`/partner-proposal/withdraw/${encodeURIComponent(id)}`)
  } catch (error: unknown) {
    throw refusal(error, "A proposta não pôde ser retirada.")
  }
}

type PayResponse = { payment: { transaction_id: string; checkout_url: string | null } }

// Abre o pagamento do aporte aceito. É a mesma transação de qualquer doação: a
// tela leva a empresa ao checkout, e só o webhook confirma.
export async function payProposal(id: string): Promise<{ transaction_id: string; checkout_url: string | null }> {
  try {
    const { data } = await api.post<PayResponse>(`/partner-proposal/pay/${encodeURIComponent(id)}`)

    return data.payment
  } catch (error: unknown) {
    throw refusal(error, "O pagamento não abriu. Tente de novo em instantes.")
  }
}
