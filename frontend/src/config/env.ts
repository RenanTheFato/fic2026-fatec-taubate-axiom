// Único lugar do projeto que lê import.meta.env. Falha na importação, como o
// config/env.ts do backend, para o erro aparecer ao subir e não numa tela.

type Env = {
  apiUrl: string
  isDevelopment: boolean
}

function readUrl(value: string | undefined, fallback: string, name: string): string {
  const raw = value ?? fallback

  try {
    new URL(raw)
  } catch {
    throw new Error(`[env] ${name} não é uma URL válida: "${raw}"`)
  }

  return raw.replace(/\/+$/, "")
}

export const env: Env = {
  apiUrl: readUrl(import.meta.env.VITE_API_URL, "http://localhost:3000/api/v1", "VITE_API_URL"),
  isDevelopment: import.meta.env.DEV,
}
