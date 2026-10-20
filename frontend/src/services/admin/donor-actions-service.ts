import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { AdminDonor } from "./list-donors-service"

export type DonorInput = {
  name: string
  email: string
  phone: string | null
}

// Cadastrar à mão serve à doação que chegou por fora do site (transferência,
// evento presencial). O backend reaproveita o cadastro quando o documento ou o
// e-mail já existem, em vez de duplicar a pessoa.
export async function createDonor(input: DonorInput & { document: string | null }): Promise<{ donor: AdminDonor; created: boolean }> {
  try {
    const { data, status } = await api.post<{ donor: AdminDonor }>("/donor/create", input)

    return { donor: data.donor, created: status === 201 }
  } catch (error: unknown) {
    throw refusal(error, "O doador não pôde ser cadastrado.")
  }
}

// O documento não muda depois do cadastro: é ele que liga a pessoa aos recibos
// já emitidos.
export async function updateDonor(id: string, input: DonorInput): Promise<AdminDonor> {
  try {
    const { data } = await api.put<{ donor: AdminDonor }>(`/donor/update/${encodeURIComponent(id)}`, input)

    return data.donor
  } catch (error: unknown) {
    throw refusal(error, "O cadastro não pôde ser salvo.")
  }
}

// Responde só a `admin`. É o atendimento ao pedido de exclusão de dados: o
// nome, o e-mail, o documento e o telefone saem, e o histórico de doações fica,
// sem ninguém atrás dele.
export async function anonymizeDonor(id: string): Promise<AdminDonor> {
  try {
    const { data } = await api.patch<{ donor: AdminDonor }>(`/donor/anonymize/${encodeURIComponent(id)}`)

    return data.donor
  } catch (error: unknown) {
    throw refusal(error, "A anonimização não pôde ser concluída.")
  }
}

function refusal(error: unknown, fallback: string): unknown {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { error?: string; errors?: { message: string }[] } | undefined

    if (error.response.status === 403) {
      return new CheckoutError("Seu perfil não tem permissão para esta ação. Ela responde à administração.")
    }

    if (error.response.status === 400 || error.response.status === 404) {
      return new CheckoutError(data?.errors?.[0]?.message ?? data?.error ?? fallback)
    }
  }

  return error
}
