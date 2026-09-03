import { ButtonLink } from "../../components/ui/button"
import { ArrowLeft, Heart } from "lucide-react"
import { Container } from "../../components/ui/container"

type ComingSoonPageProps = {
  title: string
  description: string
  phase: string
}

// Toda rota do mapa existe desde já, mesmo antes da tela. Link que leva a lugar
// nenhum é pior do que link que diz honestamente em que fase ele entra, e
// e a fase é a mesma que está em goals.md.
export default function ComingSoonPage({ title, description, phase }: ComingSoonPageProps) {
  return (
    <Container className="flex max-w-2xl flex-col items-start gap-5 py-20 sm:py-28">
      <span className="inline-flex items-center gap-2 rounded-pill bg-institutional/15 px-4 py-2 font-display text-sm font-bold text-ink">
        Em construção, {phase}
      </span>

      <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>

      <p className="text-lg leading-relaxed text-ink-soft">{description}</p>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <ButtonLink to="/">
          <ArrowLeft className="size-5" aria-hidden="true" />
          Voltar para a home
        </ButtonLink>

        <ButtonLink to="/doe-agora" variant="outline">
          <Heart className="size-5" aria-hidden="true" />
          Quero doar
        </ButtonLink>
      </div>
    </Container>
  )
}
