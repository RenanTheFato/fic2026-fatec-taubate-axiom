import { ArrowRight, GraduationCap, Stethoscope, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Reveal } from "../motion/reveal"
import { ButtonLink } from "../ui/button"
import { Container } from "../ui/container"
import { ImageSlot } from "../ui/image-slot"

const PILLARS: { title: string; text: string; icon: LucideIcon; tone: string }[] = [
  {
    title: "Ambulatório",
    text: "Atendimento clínico, terapêutico e de reabilitação.",
    icon: Stethoscope,
    tone: "bg-institutional-soft text-institutional-dark",
  },
  {
    title: "Escola de Educação Especial",
    text: "Ensino adaptado a cada estudante e à sua família.",
    icon: GraduationCap,
    tone: "bg-primary-soft text-primary",
  },
  {
    title: "Oficina Terapêutica",
    text: "Autonomia, convivência e trabalho protegido.",
    icon: Users,
    tone: "bg-success-soft text-success-dark",
  },
]

export function AboutSection() {
  return (
    <section aria-labelledby="sobre-nos" className="py-16 sm:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal from="left">
            <p className="font-display text-sm font-bold tracking-[0.18em] text-primary uppercase">Sobre nós</p>

            <h2 id="sobre-nos" className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Fazemos a diferença, juntos!
            </h2>

            <p className="mt-5 text-base leading-relaxed text-ink-soft sm:text-lg">
              Atuando na defesa de direitos e na prestação de serviços para pessoas com Deficiência
              Intelectual e/ou Múltipla de causa neurológica e Transtornos Invasivos do
              Desenvolvimento, buscamos promover mais igualdade para todos.
            </p>

            <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">
              Através de atividades e projetos, buscamos a satisfação e a melhora da qualidade de
              vida de quem conta com o nosso apoio.
            </p>

            <ButtonLink to="/institucional" variant="outline" className="mt-8">
              Saiba mais
              <ArrowRight className="size-5" aria-hidden="true" />
            </ButtonLink>
          </Reveal>

          <Reveal from="right" delay={0.1}>
            <div className="overflow-hidden rounded-card border border-line">
              <ImageSlot
                src={null} // "/imagens/sobre-nos.jpg"
                ratio="4/3"
                alt="Atividade em grupo na Somos do Bem"
                hint="Foto de uma atividade em grupo — oficina, sala de aula ou terapia — mostrando convivência"
              />
            </div>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <li key={pillar.title}>
              <Reveal delay={index * 0.08} className="h-full">
                <div className="flex h-full gap-4 rounded-card border border-line bg-surface p-5">
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-pill ${pillar.tone}`}>
                    <pillar.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <strong className="block font-display text-lg font-bold">{pillar.title}</strong>
                    <span className="text-sm leading-relaxed text-ink-soft">{pillar.text}</span>
                  </span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
