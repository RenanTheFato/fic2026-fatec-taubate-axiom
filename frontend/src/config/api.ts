import axios from "axios"
import { env } from "./env"
import { clearToken, readToken } from "./session-storage"

// Instância única. Nenhum componente chama axios direto: a chamada vive em
// services/<dominio> e a tela consome pelo hook de query.
export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
})

// O token entra aqui e em nenhum outro lugar. Toda rota pública ignora o
// cabeçalho, então mandá-lo sempre é mais simples (e mais seguro) do que cada
// serviço lembrar de anexá-lo.
api.interceptors.request.use((config) => {
  const token = readToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Um 401 depois de a sessão existir significa token expirado ou revogado: o JWT
// do backend vale 2h. Apagar aqui evita que a interface fique tentando de novo
// com uma credencial morta. Quem manda para o login é o `RequireRole`, porque
// redirecionar de dentro do interceptor tiraria o controle da rota.
//
// O 403 não limpa nada: a sessão é válida, o papel é que não alcança a tela.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && readToken()) {
      clearToken()
    }

    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined
    if (data?.error) return data.error
    if (error.code === "ECONNABORTED") return "A conexão demorou demais. Tente de novo."
    if (!error.response) return "Não conseguimos falar com o servidor. Verifique sua conexão."
  }

  return fallback
}
