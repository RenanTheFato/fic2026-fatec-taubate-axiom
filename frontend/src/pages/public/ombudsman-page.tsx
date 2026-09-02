import { ShieldCheck } from "lucide-react"
import { MessageForm } from "../../components/contact/message-form"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { Card } from "../../components/ui/card"
import { Container } from "../../components/ui/container"
import { Prose } from "../../components/ui/prose"
import { SectionHeading } from "../../components/ui/section"

const SUBJECTS = [
  { value: "elogio", label: "Elogio" },
  { value: "sugestao", label: "Sugestão" },
  { value: "reclamacao", label: "Reclamação" },
  { value: "denuncia", label: "Denúncia" },
]

export default function OmbudsmanPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Ouvidoria"
        tone="partner"
        breadcrumb={[{ label: "Contato" }, { label: "Ouvidoria" }]}
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                A ouvidoria é o lugar para reclamar, elogiar ou avisar sobre um problema. Você pode
                falar sem medo.
              </p>
            }
          >
            <p>
              A ouvidoria é o canal para elogios, sugestões, reclamações e denúncias sobre a
              associação. É um caminho separado do atendimento do dia a dia, justamente para que uma
              crítica não precise passar por quem está sendo criticado.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="como-funciona" className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Reveal>
            <SectionHeading
              id="como-funciona"
              eyebrow="Como funciona"
              title="O que acontece com a sua mensagem"
              tone="partner"
            />

            <Prose className="mt-6">
              <p>
                A mensagem chega ao endereço da ouvidoria e é lida pela coordenação da associação.
                Você recebe uma resposta no e-mail que informar.
              </p>
              <p>
                Se preferir, pode enviar sem se identificar — nesse caso, escreva direto para o
                e-mail da ouvidoria, porque o formulário abaixo pede nome e e-mail para que a
                resposta tenha para onde ir.
              </p>
            </Prose>

            <p className="mt-8 flex items-start gap-3 rounded-card border border-line bg-surface-muted p-5 text-sm leading-relaxed text-ink-soft">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-partner-dark" aria-hidden="true" />
              Denúncias envolvendo suspeita de crime devem ser levadas também aos órgãos
              competentes. A ouvidoria da associação não substitui a autoridade pública.
            </p>
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="manifestacao" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Reveal>
            <SectionHeading
              id="manifestacao"
              eyebrow="Mensagem"
              title="Falar com a ouvidoria"
              tone="partner"
            />
          </Reveal>

          <Reveal delay={0.08} className="mt-10">
            <Card>
              <div className="p-6 sm:p-8">
                <MessageForm
                  id="ouvidoria"
                  subjects={SUBJECTS}
                  subjectLabel="Tipo de manifestação"
                  mailTo="contato@somosdobem.org.br"
                  submitLabel="Enviar manifestação"
                  note="Descreva o que aconteceu com o máximo de detalhe possível: data, unidade e pessoas envolvidas ajudam a apurar."
                />
              </div>
            </Card>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
