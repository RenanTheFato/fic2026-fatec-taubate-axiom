import { api } from "../../config/api"

export type AdminDonor = {
  id: string
  user_id: string | null
  name: string
  email: string
  document: string | null
  document_type: "cpf" | "cnpj" | null
  phone: string | null
  anonymized_at: string | null
  created_at: string
  updated_at: string
}

type ListDonorsResponse = {
  donors: AdminDonor[]
  total: number
}

export async function listDonors(page = 1) {
  const { data } = await api.get<ListDonorsResponse>("/donor/list", {
    params: { limit: 20, page },
  })

  return { donors: data.donors, total: data.total }
}
