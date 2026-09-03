import { ArrowRight, GraduationCap, Stethoscope, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { ButtonLink } from "../../components/ui/button"
import { Card, CardBody } from "../../components/ui/card"
import { Container } from "../../components/ui/container"
import { ImageSlot } from "../../components/ui/image-slot"
import { Prose } from "../../components/ui/prose"
import { SectionHeading } from "../../components/ui/section"

const PROGRAMS: {
  title: string
  text: string
  icon: LucideIcon
  tone: string
  photo: string | null
  hint: string
}[] = [
  {
    title: "Ambulatório",
    text: "Atendimento clínico, terapêutico e de reabilitação, com acompanhamento contínuo da pessoa e da família.",
    icon: Stethoscope,
    tone: "bg-institutional-soft text-institutional-dark",
    photo: "/imagens/programa-ambulatorio.jpg",
    hint: "Atendimento no ambulatório, com profissional e usuário",
  },
  {
    title: "Escola de Educação Especial",
    text: "Ensino adaptado ao ritmo de cada estudante, construído junto com quem convive com ele todos os dias.",
    icon: GraduationCap,
    tone: "bg-primary-soft text-primary",
    photo: "/imagens/educacional.png", // "/imagens/programa-escola.jpg"
    hint: "Sala de aula da Escola de Educação Especial",
  },
  {
    title: "Programa de Oficina Terapêutica",
    text: "Autonomia, convivência e trabalho protegido para jovens e adultos atendidos pela associação.",
    icon: Users,
    tone: "bg-success-soft text-success-dark",
    photo: "/imagens/oficina.jpeg", // "/imagens/programa-oficina.jpg"
    hint: "Atividade na oficina terapêutica",
  },
]

const NEXT_PAGES = [
  { to: "/diretoria", title: "Diretoria", text: "Quem responde pela associação." },
  { to: "/conselho", title: "Conselho", text: "Quem fiscaliza e orienta as decisões." },
  { to: "/transparencia", title: "Transparência", text: "Estatuto, certificações e prestação de contas." },
]

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Quem somos"
        breadcrumb={[{ label: "Institucional" }, { label: "Quem somos" }]}
        scene="network"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Somos uma associação de Indaiatuba. Cuidamos de pessoas com deficiência intelectual.
                Também cuidamos das famílias delas.
              </p>
            }
          >
            <p>
              A Somos do Bem é uma associação beneficente de Indaiatuba que atua na defesa de direitos
              e na prestação de serviços para pessoas com Deficiência Intelectual e/ou Múltipla de
              causa neurológica e Transtornos Invasivos do Desenvolvimento, e para suas famílias.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="missao" className="py-16 sm:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal from="left">
            <SectionHeading
              id="missao"
              eyebrow="Nossa missão"
              title="Fazemos a diferença, juntos!"
              tone="primary"
            />

            <ReadingSwitch
              simple={
                <Prose className="mt-6">
                  <p>Nosso trabalho tem três partes.</p>
                  <p>A primeira é cuidar da saúde das pessoas.</p>
                  <p>A segunda é ensinar, na nossa escola.</p>
                  <p>A terceira é ajudar jovens e adultos a trabalhar e conviver.</p>
                  <p>Fazemos isso para todos terem os mesmos direitos.</p>
                </Prose>
              }
            >
              <Prose className="mt-6">
                <p>
                  Buscamos promover mais igualdade para todos. Isso acontece por meio de atividades e
                  projetos que melhoram a qualidade de vida de quem conta com o nosso apoio, e que
                  sustentam a rotina de quem cuida.
                </p>
                <p>
                  O trabalho se organiza em três frentes que funcionam de forma integrada: o
                  Ambulatório, a Escola de Educação Especial e o Programa de Oficina Terapêutica.
                  Juntos, eles atendem hoje mais de mil pessoas em Indaiatuba.
                </p>
              </Prose>
            </ReadingSwitch>
          </Reveal>

          <Reveal from="right" delay={0.1}>
            <div className="overflow-hidden rounded-card border border-line">
              <ImageSlot
                src="/imagens/institucional-missao.jpg"
                ratio="4/3"
                alt="Equipe e usuários da Somos do Bem"
                hint="Foto ampla da associação: equipe e usuários juntos, de preferência ao ar livre"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="programas" className="bg-surface-muted py-16 sm:py-24">
        <Container>
          <SectionHeading
            id="programas"
            eyebrow="O que fazemos"
            title="Três programas, um cuidado só"
            description="Cada frente atende uma necessidade diferente, e a mesma pessoa pode passar por mais de uma delas ao longo da vida."
            tone="institutional"
          />

          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {PROGRAMS.map((program, index) => (
              <li key={program.title}>
                <Reveal delay={index * 0.08} className="h-full">
                  <Card as="article" className="h-full">
                    <ImageSlot
                      src={program.photo}
                      ratio="4/3"
                      alt={program.hint}
                      hint={program.hint}
                    />

                    <CardBody>
                      <span className={`flex size-11 items-center justify-center rounded-pill ${program.tone}`}>
                        <program.icon className="size-5" aria-hidden="true" />
                      </span>

                      <h3 className="font-display text-xl leading-snug font-bold">{program.title}</h3>

                      <p className="text-sm leading-relaxed text-ink-soft">{program.text}</p>
                    </CardBody>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="historia" className="py-16 sm:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal from="left" className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-card border border-line">
              <ImageSlot
                // a mesma foto da coletiva que ilustra a notícia da mudança de nome
                src="/imagens/noticias/mudanca-de-nome.png"
                ratio="4/3"
                alt="Anúncio da nova marca da associação"
                hint="Foto do anúncio da nova marca, em 2023, ou uma imagem histórica da instituição"
              />
            </div>
          </Reveal>

          <Reveal from="right" delay={0.1} className="order-1 lg:order-2">
            <SectionHeading id="historia" eyebrow="Nossa história" title="De APAE de Indaiatuba a Somos do Bem" />

            <ReadingSwitch
              simple={
                <Prose className="mt-6">
                  <p>Antes, o nosso nome era APAE de Indaiatuba.</p>
                  <p>Em 2023, mudamos o nome para Somos do Bem.</p>
                  <p>Só o nome mudou. A equipe e o trabalho são os mesmos.</p>
                </Prose>
              }
            >
              <Prose className="mt-6">
                <p>
                  Em 14 de junho de 2023, a APAE de Indaiatuba realizou uma coletiva de imprensa para
                  anunciar seu novo nome e sua nova marca: Somos do Bem.
                </p>
                <p>
                  A mudança foi de identidade, não de instituição. A equipe, os programas e as pessoas
                  atendidas seguiram os mesmos, e é por isso que a navegação deste site continua
                  sendo a que a cidade já conhecia.
                </p>
              </Prose>
            </ReadingSwitch>
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="continue" className="border-t border-line bg-surface-muted py-16">
        <Container>
          <SectionHeading id="continue" eyebrow="Continue por aqui" title="Governança e prestação de contas" />

          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {NEXT_PAGES.map((page) => (
              <li key={page.to}>
                <Card interactive className="h-full">
                  <Link to={page.to} className="flex h-full flex-col gap-2 p-5">
                    <h3 className="flex items-center justify-between gap-2 font-display text-lg font-bold">
                      {page.title}
                      <ArrowRight className="size-5 text-primary" aria-hidden="true" />
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-soft">{page.text}</p>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/doe-agora" size="lg">
              Quero doar
            </ButtonLink>
            <ButtonLink to="/seja-voluntario" size="lg" tone="success" variant="outline">
              Seja voluntário
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}
