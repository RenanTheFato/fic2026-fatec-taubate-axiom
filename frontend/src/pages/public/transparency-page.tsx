import { BadgeCheck, FileText, HandCoins, Scale } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { DocumentCard } from "../../components/institutional/document-card"
import { Reveal } from "../../components/motion/reveal"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { ButtonLink } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"
import { CardSkeleton, StateMessage } from "../../components/ui/states"
import { useDocuments } from "../../hooks/use-documents"
import type { DocumentCategory } from "../../types/institutional-types"

const CATEGORIES: { id: DocumentCategory; title: string; text: string; icon: LucideIcon }[] = [
  {
    id: "estatuto",
    title: "Estatuto e atas",
    text: "O documento que define como a associação é governada, e os registros das assembleias.",
    icon: Scale,
  },
  {
    id: "certificacoes",
    title: "Certificações",
    text: "CEBAS, utilidade pública e demais títulos que habilitam a instituição.",
    icon: BadgeCheck,
  },
  {
    id: "financeiro",
    title: "Demonstrações financeiras",
    text: "Balanços e demonstrações contábeis de cada exercício.",
    icon: HandCoins,
  },
  {
    id: "atividades",
    title: "Relatórios de atividades",
    text: "O que foi feito no ano, com números por programa.",
    icon: FileText,
  },
]

export default function TransparencyPage() {
  const { data, isPending, isError, refetch } = useDocuments()

  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Transparência"
        breadcrumb={[{ label: "Institucional", to: "/institucional" }, { label: "Transparência" }]}
        scene="archive"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Aqui você vê os documentos da associação. Eles mostram como o dinheiro é usado.
                Qualquer pessoa pode baixar e conferir.
              </p>
            }
          >
            <p>
              Quem doa tem o direito de saber para onde o dinheiro foi. Esta página reúne os
              documentos que a associação publica (estatuto, certificações, demonstrações
              financeiras e relatórios de atividades) para download livre, sem cadastro.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="categorias" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="categorias"
            eyebrow="O acervo"
            title="O que é publicado aqui"
            tone="institutional"
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((category, index) => (
              <li key={category.id}>
                <Reveal delay={index * 0.06} className="h-full">
                <Card className="h-full">
                  <div className="flex h-full flex-col gap-3 p-5">
                    <span className="flex size-11 items-center justify-center rounded-tile bg-institutional-soft text-institutional-dark">
                      <category.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-lg leading-snug font-bold">{category.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-soft">{category.text}</p>
                  </div>
                </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="documentos" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <SectionHeading id="documentos" eyebrow="Download" title="Documentos disponíveis" />

          {isPending && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && (
            <div className="mt-10 max-w-md">
              <StateMessage
                tone="error"
                title="Os documentos não carregaram"
                description="Não conseguimos buscar o acervo agora."
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

          {data && data.length === 0 && (
            <div className="mt-10 max-w-2xl">
              <StateMessage
                title="Nenhum documento publicado ainda"
                description="Os arquivos das quatro categorias acima serão disponibilizados aqui para download assim que a associação os enviar. Enquanto isso, é possível pedir qualquer um deles diretamente pelos canais de contato."
                action={
                  <ButtonLink to="/fale-conosco" size="sm">
                    Pedir um documento
                  </ButtonLink>
                }
              />
            </div>
          )}

          {data && data.length > 0 && (
            <div className="mt-10 flex flex-col gap-12">
              {CATEGORIES.map((category) => {
                const documents = data
                  .filter((document) => document.category === category.id)
                  .sort((first, second) => second.year - first.year)

                if (documents.length === 0) return null

                return (
                  <div key={category.id}>
                    <h3 className="font-display text-xl font-bold">{category.title}</h3>

                    <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {documents.map((document, index) => (
                        <li key={document.id}>
                          <Reveal delay={index * 0.06} className="h-full">
                            <DocumentCard document={document} />
                          </Reveal>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </Container>
      </section>

      <section aria-labelledby="verificar" className="py-16 sm:py-20">
        <Container className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="verificar"
              eyebrow="Conferência"
              title="Recebeu um recibo? Confira se é verdadeiro"
              description="Todo recibo e todo certificado emitido pela associação carrega um código próprio. Qualquer pessoa pode conferir esse código, sem login e sem cadastro."
            />

            <ButtonLink to="/recibo/verificar" className="mt-8">
              Verificar documento
            </ButtonLink>
          </div>

          <div>
            <SectionHeading
              eyebrow="Números"
              title="Veja o impacto em pessoas"
              description="Quantas pessoas são atendidas em cada programa, e o que a doação vira dentro de cada um deles."
              tone="institutional"
            />

            <ButtonLink to="/impacto" variant="outline" className="mt-8">
              Abrir painel de impacto
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}
