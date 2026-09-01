import axios from "axios"
import { env } from "./env"

// Instância única. Nenhum componente chama axios direto: a chamada vive em
// services/<dominio> e a tela consome pelo hook de query.
export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
})

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined
    if (data?.error) return data.error
    if (error.code === "ECONNABORTED") return "A conexão demorou demais. Tente de novo."
    if (!error.response) return "Não conseguimos falar com o servidor. Verifique sua conexão."
  }

  return fallback
}
