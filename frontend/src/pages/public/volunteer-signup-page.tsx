import { CalendarClock, ShieldCheck, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { VolunteerForm } from "../../components/volunteer/volunteer-form"
import { Card } from "../../components/ui/card"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"

const NOTES = [
  {
    icon: CalendarClock,
    title: "Você escolhe os períodos",
    text: "Marque quantos períodos quiser. A escala é combinada depois, junto com a coordenação.",
  },
  {
    icon: ShieldCheck,
    title: "Seus dados ficam com a associação",
    text: "Nome, telefone e e-mail são usados só para falar com você sobre voluntariado, como diz a política de privacidade.",
  },
  {
    icon: Sparkles,
    title: "Não é preciso experiência",
    text: "A orientação inicial acontece antes do primeiro turno, com a equipe da frente que você escolher.",
  },
]

export default function VolunteerSignupPage() {
  return (
    <>
      <PageHero
        eyebrow="Voluntariado"
        title="Seja voluntário"
        tone="success"
        breadcrumb={[{ label: "Voluntariado", to: "/voluntariado" }, { label: "Seja voluntário" }]}
        scene="drift"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Preencha o formulário abaixo. A coordenação liga ou escreve para combinar os dias e
                explicar como funciona.
              </p>
            }
          >
            <p>
              Conte quem você é, onde quer ajudar e quando tem tempo livre. A coordenação do
              voluntariado entra em contato para combinar a conversa inicial e o começo da escala.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="antes" className="py-16 sm:py-20">
        <Container>
          <h2 id="antes" className="sr-only">
            Antes de preencher
          </h2>

          <ul className="grid gap-6 md:grid-cols-3">
            {NOTES.map((note, index) => (
              <li key={note.title}>
                <Reveal delay={index * 0.06} className="h-full">
                  <div className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-6">
                    <span className="flex size-11 items-center justify-center rounded-pill bg-success-soft text-success-dark">
                      <note.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-lg font-bold">{note.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-soft">{note.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="cadastro" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Reveal>
            <SectionHeading
              id="cadastro"
              eyebrow="Cadastro"
              title="Seus dados"
              description="Os campos marcados com asterisco são obrigatórios."
              tone="success"
            />
          </Reveal>

          <Reveal delay={0.08} className="mt-10">
            <Card>
              <div className="p-6 sm:p-8">
                <VolunteerForm />
              </div>
            </Card>
          </Reveal>

          <p className="mt-8 text-sm leading-relaxed text-ink-soft">
            Quer conhecer as frentes antes de decidir? A página de{" "}
            <Link to="/voluntariado" className="font-bold text-primary underline underline-offset-4">
              voluntariado
            </Link>{" "}
            explica o que cada uma faz.
          </p>
        </Container>
      </section>
    </>
  )
}
