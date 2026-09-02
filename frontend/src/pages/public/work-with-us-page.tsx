import { HandHeart, HeartHandshake, Paperclip } from "lucide-react"
import { MessageForm } from "../../components/contact/message-form"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { ButtonLink } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Reveal } from "../../components/motion/reveal"
import { Container } from "../../components/ui/container"
import { Prose } from "../../components/ui/prose"
import { SectionHeading } from "../../components/ui/section"

const SUBJECTS = [
  { value: "clinico", label: "Área clínica e terapêutica" },
  { value: "educacao", label: "Educação" },
  { value: "administrativo", label: "Administrativo e financeiro" },
  { value: "comunicacao", label: "Comunicação e captação" },
  { value: "apoio", label: "Serviços de apoio" },
  { value: "outra", label: "Outra área" },
]

export default function WorkWithUsPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Trabalhe conosco"
        tone="success"
        breadcrumb={[{ label: "Contato" }, { label: "Trabalhe conosco" }]}
        scene="drift"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Quer trabalhar na associação? Mande seu currículo por e-mail. A gente guarda e chama
                quando abrir uma vaga.
              </p>
            }
          >
            <p>
              As vagas da associação são divulgadas conforme a necessidade de cada programa. Envie
              seu currículo para o banco de talentos e ele fica disponível para a equipe quando uma
              posição da sua área abrir.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="como-enviar" className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Reveal>
            <SectionHeading
              id="como-enviar"
              eyebrow="Banco de talentos"
              title="Como enviar seu currículo"
              tone="success"
            />

            <Prose className="mt-6">
              <p>
                Preencha o formulário ao lado escolhendo a área em que você atua e contando um pouco
                da sua trajetória. Ao enviar, o seu programa de e-mail abre com a mensagem pronta.
              </p>
            </Prose>

            <p className="mt-6 flex items-start gap-3 rounded-card border border-line bg-surface-muted p-5 text-sm leading-relaxed text-ink-soft">
              <Paperclip className="mt-0.5 size-5 shrink-0 text-success-dark" aria-hidden="true" />
              <span>
                <strong className="block font-display text-ink">Não esqueça o anexo</strong>
                O formulário monta o texto, mas não consegue anexar arquivo por você. Anexe o
                currículo em PDF antes de enviar o e-mail.
              </span>
            </p>

            <Card className="mt-8">
              <div className="flex gap-4 p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-success-soft text-success-dark">
                  <HandHeart className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold">Também existe o caminho do voluntariado</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    Se a sua intenção é contribuir com tempo e não buscar uma vaga, o cadastro de
                    voluntariado é o lugar certo.
                  </p>
                  <ButtonLink to="/seja-voluntario" size="sm" tone="success" variant="outline" className="mt-4">
                    <HeartHandshake className="size-4" aria-hidden="true" />
                    Seja voluntário
                  </ButtonLink>
                </div>
              </div>
            </Card>
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="candidatura" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Reveal>
            <SectionHeading
              id="candidatura"
              eyebrow="Candidatura"
              title="Enviar meus dados"
              tone="success"
            />
          </Reveal>

          <Reveal delay={0.08} className="mt-10">
            <Card>
              <div className="p-6 sm:p-8">
                <MessageForm
                  id="trabalhe"
                  subjects={SUBJECTS}
                  subjectLabel="Área de atuação"
                  mailTo="contato@somosdobem.org.br"
                  submitLabel="Enviar candidatura"
                  note="Conte sua formação, sua experiência e sua disponibilidade. Lembre-se de anexar o currículo ao e-mail."
                />
              </div>
            </Card>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
