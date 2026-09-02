import { FaqAccordion } from "../../components/institutional/faq-accordion"
import { Reveal } from "../../components/motion/reveal"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useFaq } from "../../hooks/use-faq"
import type { FaqCategory } from "../../types/institutional-types"

const GROUPS: { id: FaqCategory; title: string; description: string }[] = [
  {
    id: "atendimento",
    title: "Atendimento",
    description: "Quem é atendido, como começar e onde ficam as unidades.",
  },
  {
    id: "doacao",
    title: "Doação",
    description: "Como doar, o que acontece depois e como conferir o recibo.",
  },
  {
    id: "voluntariado",
    title: "Voluntariado",
    description: "Como se cadastrar e o que o voluntário recebe de volta.",
  },
  {
    id: "institucional",
    title: "A instituição",
    description: "História, nome e prestação de contas.",
  },
]

export default function FaqPage() {
  const { data, isPending, isError, refetch } = useFaq()

  return (
    <>
      <PageHero
        eyebrow="Ajuda"
        title="Perguntas frequentes"
        breadcrumb={[{ label: "Perguntas frequentes" }]}
        scene="drift"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <p>
            As dúvidas que mais chegam pelo telefone e pelo e-mail, respondidas aqui. Se a sua não
            estiver na lista, fale com a gente — a resposta pode virar uma pergunta desta página.
          </p>
        }
      />

      <section className="py-16 sm:py-20">
        <Container className="max-w-4xl">
          {isPending && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <div className="max-w-md">
              <StateMessage
                tone="error"
                title="As perguntas não carregaram"
                description="Não conseguimos buscar o conteúdo agora."
                action={
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="font-display font-bold text-primary underline underline-offset-4"
                  >
                    Tentar de novo
                  </button>
                }
              />
            </div>
          )}

          {data && (
            <div className="flex flex-col gap-14">
              {GROUPS.map((group) => {
                const items = data.filter((item) => item.category === group.id)

                if (items.length === 0) return null

                return (
                  <Reveal key={group.id}>
                    <SectionHeading
                      id={`faq-${group.id}`}
                      title={group.title}
                      description={group.description}
                      tone="institutional"
                    />

                    <div className="mt-6">
                      <FaqAccordion items={items} />
                    </div>
                  </Reveal>
                )
              })}
            </div>
          )}
        </Container>
      </section>

      <section className="border-t border-line bg-surface-muted py-16">
        <Container className="flex max-w-4xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold">Não achou a sua pergunta?</h2>
            <p className="mt-2 text-base text-ink-soft">
              Fale com a associação pelo telefone (19) 3801-8890 ou mande uma mensagem.
            </p>
          </div>

          <ButtonLink to="/fale-conosco" size="lg" className="shrink-0">
            Fale conosco
          </ButtonLink>
        </Container>
      </section>
    </>
  )
}
