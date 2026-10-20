import { ContactChannels } from "../../components/contact/contact-channels"
import { MessageForm } from "../../components/contact/message-form"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Card } from "../../components/ui/card"
import { Reveal } from "../../components/motion/reveal"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Fale conosco"
        breadcrumb={[{ label: "Contato" }, { label: "Fale conosco" }]}
        scene="network"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Quer falar com a gente? Ligue para (19) 3801-8890. Ou escreva uma mensagem no
                formulário abaixo.
              </p>
            }
          >
            <p>
              Dúvida sobre atendimento, doação, voluntariado ou parceria: escolha o canal mais
              confortável. O telefone é o caminho mais rápido para assuntos de atendimento.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="canais" className="py-16 sm:py-20">
        <Container>
          <Reveal>
            <SectionHeading
              id="canais"
              eyebrow="Canais diretos"
              title="Onde nos encontrar"
              description="Para assunto de atendimento, o telefone é o caminho mais rápido."
              tone="institutional"
            />
          </Reveal>

          <Reveal delay={0.08} className="mt-10">
            <ContactChannels />
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="mensagem" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Reveal>
            <SectionHeading
              id="mensagem"
              eyebrow="Mensagem"
              title="Escreva para a associação"
              description="A mensagem chega à equipe da associação, que responde no e-mail informado."
            />
          </Reveal>

          <Reveal delay={0.08} className="mt-10">
            <Card>
              <div className="p-6 sm:p-8">
                <MessageForm id="contato" channel="contact" subjectLabel="Assunto" submitLabel="Enviar mensagem" />
              </div>
            </Card>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
