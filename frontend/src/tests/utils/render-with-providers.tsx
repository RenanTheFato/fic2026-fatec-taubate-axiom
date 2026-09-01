import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import type { ReactElement } from "react"
import { MemoryRouter } from "react-router-dom"

// Os testes montam a árvore real de providers. O que é dublado são os módulos
// de services/, nunca o axios — é lá que a fronteira do sistema fica.
export function renderWithProviders(ui: ReactElement, route = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}
