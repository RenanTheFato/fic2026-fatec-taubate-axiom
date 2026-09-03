import { Clock } from "lucide-react"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { BrandCanvas } from "../../components/motion/brand-canvas"
import { CountUp } from "../../components/motion/count-up"
import { Reveal } from "../../components/motion/reveal"
import { ButtonLink } from "../../components/ui/button"
import { Card, CardBody } from "../../components/ui/card"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useImpactPanel } from "../../hooks/use-impact-panel"

export default function ImpactPage() {
  const { data, isPending, isError, refetch } = useImpactPanel()

  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Painel de Impacto"
        breadcrumb={[{ label: "Institucional", to: "/institucional" }, { label: "Painel de Impacto" }]}
        scene="care"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Aqui você vê quantas pessoas a associação atende. Os números são de cada programa.
              </p>
            }
          >
            <p>
              Quantas pessoas a associação atende, em qual programa, e o que a sua doação vira dentro
              de cada um deles. Sem gráfico bonito e número vago: pessoa atendida é a única unidade
              que importa aqui.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="atendidos" className="relative isolate overflow-hidden bg-ink py-16 text-white sm:py-20">
        <BrandCanvas
          variant="drift"
          minWidth={320}
          className="pointer-events-none absolute inset-0 -z-10 opacity-35"
        />

        <Container>
          <SectionHeading id="atendidos" eyebrow="Hoje" title="Pessoas atendidas" tone="primary" />

          {isError && (
            <div className="mt-10 max-w-md text-ink">
              <StateMessage
                tone="error"
                title="O painel não carregou"
                description="Não conseguimos buscar os números agora."
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

          {isPending && (
            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <li key={index} className="flex flex-col gap-3">
                  <Skeleton className="h-14 w-32 bg-white/15" />
                  <Skeleton className="h-4 w-40 bg-white/10" />
                </li>
              ))}
            </ul>
          )}

          {data && (
            <ul className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-6">
              {data.summary.stats.map((stat) => (
                <li key={stat.id} className="sm:border-l sm:border-white/15 sm:pl-6 sm:first:border-l-0 sm:first:pl-0">
                  <p className="font-display text-6xl leading-none font-extrabold text-reward">
                    <CountUp value={stat.value} />
                  </p>
                  <p className="mt-3 font-display text-lg font-bold text-white">{stat.label}</p>
                  <p className="mt-1 text-sm text-white/70">{stat.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {data && (
        <section aria-labelledby="programas" className="py-16 sm:py-24">
          <Container>
            <SectionHeading
              id="programas"
              eyebrow="Onde a doação chega"
              title="O que cada programa entrega"
              tone="institutional"
            />

            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {data.programs.map((program, index) => (
                <li key={program.id}>
                  <Reveal delay={index * 0.08} className="h-full">
                    <Card className="h-full">
                      <CardBody>
                        <p className="font-display text-4xl leading-none font-extrabold text-primary">
                          <CountUp value={program.people} />
                        </p>
                        <p className="text-sm text-ink-soft">pessoas atendidas</p>

                        <h3 className="mt-2 font-display text-xl font-bold">{program.name}</h3>
                        <p className="text-sm leading-relaxed text-ink-soft">{program.description}</p>

                        <p className="mt-auto border-t border-line pt-4 text-sm text-ink-soft">
                          Sua doação vira <strong className="text-ink">{program.turns_into}</strong>.
                        </p>
                      </CardBody>
                    </Card>
                  </Reveal>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {data && (
        <section aria-labelledby="em-breve" className="border-t border-line bg-surface-muted py-16">
          <Container className="grid gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                id="em-breve"
                eyebrow="Honestidade"
                title="O que ainda não é tempo real"
                description="Os números acima são informados pela instituição e conferidos por ela. Os indicadores abaixo dependem do sistema de doações estar em operação, e só aparecem aqui quando forem reais."
              />
            </div>

            <ul className="flex flex-col gap-3">
              {data.pending.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-card border border-dashed border-line bg-surface p-4">
                  <Clock className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden="true" />
                  <span className="text-sm leading-relaxed text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section className="py-16">
        <Container className="flex flex-col gap-4 sm:flex-row">
          <ButtonLink to="/doe-agora" size="lg">
            Quero doar
          </ButtonLink>
          <ButtonLink to="/transparencia" size="lg" variant="outline">
            Ver prestação de contas
          </ButtonLink>
        </Container>
      </section>
    </>
  )
}
