import { ButtonLink } from "../../components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Container } from "../../components/ui/container"

export default function NotFoundPage() {
  return (
    <Container className="flex max-w-2xl flex-col items-start gap-5 py-20 sm:py-28">
      <p className="font-display text-6xl font-extrabold text-primary">404</p>

      <h1 className="text-4xl font-extrabold sm:text-5xl">Esta página não existe</h1>

      <p className="text-lg leading-relaxed text-ink-soft">
        O endereço pode ter mudado ou o conteúdo pode ter saído do ar. A home continua no lugar de
        sempre.
      </p>

      <ButtonLink to="/">
        <ArrowLeft className="size-5" aria-hidden="true" />
        Voltar para a home
      </ButtonLink>
    </Container>
  )
}
