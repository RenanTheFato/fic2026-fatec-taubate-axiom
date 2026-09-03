import { HandHeart, Heart } from "lucide-react"
import { BrandCanvas } from "../motion/brand-canvas"
import { Reveal } from "../motion/reveal"
import { ButtonLink } from "../ui/button"
import { Container } from "../ui/container"

// Fecho da home: as duas ações competem de propósito aqui, e só aqui. Em
// qualquer outra seção existe um único botão primário.
export function PartnerCta() {
  return (
    <section aria-labelledby="seja-parceiro" className="relative isolate overflow-hidden bg-primary py-16 text-white sm:py-24">
      <BrandCanvas variant="drift" className="pointer-events-none absolute inset-0 -z-10 opacity-40" />

      <Container>
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-display text-sm font-bold tracking-[0.18em] text-white/85 uppercase">Faça parte</p>

          <h2 id="seja-parceiro" className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            Seja um parceiro
          </h2>

          <p className="mt-4 text-lg leading-relaxed text-white/90">
            A sua ajuda tem um peso enorme para diversas vidas. Doe uma vez, doe todo mês ou doe o
            seu tempo, tudo chega no mesmo lugar.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/doe-agora" size="lg" tone="light">
              <Heart className="size-5" aria-hidden="true" />
              Quero doar
            </ButtonLink>

            <ButtonLink to="/seja-voluntario" size="lg" variant="outline" tone="light">
              <HandHeart className="size-5" aria-hidden="true" />
              Seja voluntário
            </ButtonLink>
          </div>

          <p className="mt-6 text-sm text-white/85">
            Empresas que querem patrocinar um programa podem falar direto pelo{" "}
            <a href="mailto:contato@somosdobem.org.br" className="font-bold underline underline-offset-4">
              contato@somosdobem.org.br
            </a>
            .
          </p>
        </Reveal>
      </Container>
    </section>
  )
}
