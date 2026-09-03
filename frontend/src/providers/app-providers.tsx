import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { BrowserRouter } from "react-router-dom"
import { queryClient } from "../config/query-client"
import { ReadingModeProvider } from "./reading-mode-provider"
import { SessionProvider } from "./session-provider"

type AppProvidersProps = {
  children: ReactNode
}

// A sessão fica dentro do QueryClientProvider porque ela é uma query, e fora do
// Router porque não depende de rota: o cabeçalho da área pública também precisa
// saber se há alguém logado, para mostrar "Painel" em vez de "Entrar".
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ReadingModeProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </ReadingModeProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
