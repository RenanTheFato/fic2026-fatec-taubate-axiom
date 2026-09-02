import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { BrowserRouter } from "react-router-dom"
import { queryClient } from "../config/query-client"
import { ReadingModeProvider } from "./reading-mode-provider"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReadingModeProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </ReadingModeProvider>
    </QueryClientProvider>
  )
}
