import { Container } from "../ui/container"
import { Skeleton } from "../ui/states"

// O que aparece entre clicar num link e o pedaço daquela página chegar. Repete
// a forma do cabeçalho de página real (migalha, título, linha de apoio), para
// a troca não parecer um salto, e nunca uma tela em branco.
export function PageFallback() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando a página</span>

      <div className="border-b border-line bg-surface-muted">
        <Container className="flex flex-col gap-4 py-10 sm:py-14">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </Container>
      </div>

      <Container className="flex flex-col gap-4 py-16">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-40 w-full" />
      </Container>
    </div>
  )
}
