import { CalendarCheck, ClipboardList, HandHeart, HeartHandshake, MessageCircle, Users } from "lucide-react"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { ButtonLink } from "../../components/ui/button"
import { Card, CardBody } from "../../components/ui/card"
import { Container } from "../../components/ui/container"
import { Prose } from "../../components/ui/prose"
import { SectionHeading } from "../../components/ui/section"

const AREAS = [
  {
    icon: HeartHandshake,
    title: "Apoio ao atendimento",
    text: "Acompanhar as equipes do Ambulatório na recepção, na organização das salas e no acolhimento das famílias que chegam.",
  },
  {
    icon: Users,
    title: "Escola e oficinas",
    text: "Apoiar as atividades pedagógicas e as oficinas terapêuticas junto com os profissionais responsáveis pela turma.",
  },
  {
    icon: CalendarCheck,
    title: "Eventos e campanhas",
    text: "Ajudar no Chefs do Bem, no Chocolate do Bem, nos bazares e nas ações de rua, da montagem ao encerramento.",
  },
  {
    icon: MessageCircle,
    title: "Comunicação e captação",
    text: "Registrar as atividades, escrever para os canais da associação e ajudar a aproximar novos parceiros.",
  },
]

const STEPS = [
  {
    title: "Você faz o cadastro",
    text: "Conta quem é, em qual área quer ajudar e quais períodos tem livres. Leva poucos minutos.",
  },
  {
    title: "A coordenação conversa com você",
    text: "Uma conversa para entender sua disponibilidade e apresentar as frentes que estão precisando de gente.",
  },
  {
    title: "Você recebe a orientação inicial",
    text: "Antes do primeiro dia, a equipe explica as rotinas da casa, o cuidado com quem é atendido e o que esperar da atividade.",
  },
  {
    title: "Sua escala começa",
    text: "Você entra no calendário da frente escolhida e passa a acompanhar seus turnos pelo painel do voluntariado.",
  },
]

export default function VolunteeringPage() {
  return (
    <>
      <PageHero
        eyebrow="Participe"
        title="Voluntariado"
        tone="success"
        breadcrumb={[{ label: "Voluntariado" }]}
        scene="network"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Voluntário é quem doa tempo para ajudar a associação. Você escolhe a área e os dias.
                A equipe explica tudo antes de você começar.
              </p>
            }
          >
            <p>
              Doar tempo é a forma mais direta de sustentar o trabalho da casa. O voluntariado da
              Somos do Bem tem frentes fixas, com orientação da equipe e escala combinada, para que
              a ajuda chegue onde ela faz diferença.
            </p>
          </ReadingSwitch>
        }
      >
        <ButtonLink to="/seja-voluntario" size="lg" tone="success">
          <HandHeart className="size-5" aria-hidden="true" />
          Quero me cadastrar
        </ButtonLink>
      </PageHero>

      <section aria-labelledby="areas" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="areas"
            eyebrow="Frentes"
            title="Onde o voluntariado atua"
            description="Quatro frentes, todas acompanhadas por um profissional da casa. Você escolhe a sua no cadastro e pode mudar depois."
            tone="success"
          />

          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {AREAS.map((area, index) => (
              <li key={area.title}>
                <Reveal delay={index * 0.06} className="h-full">
                  <Card className="h-full">
                    <CardBody className="gap-3">
                      <span className="flex size-11 items-center justify-center rounded-pill bg-success-soft text-success-dark">
                        <area.icon className="size-5" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-lg font-bold">{area.title}</h3>
                      <p className="text-sm leading-relaxed text-ink-soft">{area.text}</p>
                    </CardBody>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="como-funciona" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="como-funciona"
            eyebrow="Passo a passo"
            title="Como funciona, do cadastro ao primeiro turno"
            tone="success"
          />

          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Reveal delay={index * 0.06} className="h-full">
                  <div className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-6">
                    <span className="flex size-9 items-center justify-center rounded-pill bg-success text-sm font-bold text-ink">
                      {index + 1}
                    </span>
                    <h3 className="font-display text-lg font-bold">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-soft">{step.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="quem-pode" className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="quem-pode"
              eyebrow="Quem pode"
              title="O que a associação pede de quem entra"
              tone="success"
            />

            <Prose className="mt-6">
              <p>
                Não é preciso formação na área nem experiência anterior. O que a casa pede é
                compromisso com o horário combinado, respeito à privacidade de quem é atendido e
                disposição para seguir a orientação da equipe responsável pela frente.
              </p>
              <p>
                Cada frente tem exigências próprias, e a coordenação explica todas elas na conversa
                inicial. Atividades com contato direto com estudantes e pacientes pedem documentos
                que são solicitados nessa etapa.
              </p>
            </Prose>
          </div>

          <Card className="h-full">
            <CardBody className="gap-4">
              <span className="flex size-11 items-center justify-center rounded-pill bg-institutional-soft text-institutional-dark">
                <ClipboardList className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-xl font-bold">Já é voluntário da casa?</h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                Quem já tem cadastro acompanha a própria escala, as horas e as atividades abertas
                pelo painel do voluntariado, com o mesmo login do sistema.
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to="/entrar" size="sm" tone="ink" variant="outline">
                  Entrar no painel
                </ButtonLink>
                <ButtonLink to="/perguntas-frequentes" size="sm" variant="outline">
                  Perguntas frequentes
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        </Container>
      </section>

      <section className="border-t border-line py-16">
        <Container className="flex flex-col gap-4 sm:flex-row">
          <ButtonLink to="/seja-voluntario" size="lg" tone="success">
            <HandHeart className="size-5" aria-hidden="true" />
            Seja voluntário
          </ButtonLink>
          <ButtonLink to="/doe-agora" size="lg" variant="outline">
            Prefiro doar
          </ButtonLink>
        </Container>
      </section>
    </>
  )
}
