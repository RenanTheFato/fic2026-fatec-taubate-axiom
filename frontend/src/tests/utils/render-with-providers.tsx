import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import type { ReactElement } from "react"
import { MemoryRouter } from "react-router-dom"
import { ReadingModeProvider } from "../../providers/reading-mode-provider"
import { SessionProvider } from "../../providers/session-provider"

// Os testes montam a árvore real de providers. O que é dublado são os módulos
// de services/, nunca o axios, porque é lá que a fronteira do sistema fica.
//
// O `SessionProvider` entra sempre. Sem token guardado ele não consulta nada,
// então as telas públicas continuam sendo testadas sem rede; as telas privadas
// ganham a sessão de verdade guardando um token e dublando `getProfile`.
export function renderWithProviders(ui: ReactElement, route = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ReadingModeProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </ReadingModeProvider>
      </SessionProvider>
    </QueryClientProvider>,
  )
}
