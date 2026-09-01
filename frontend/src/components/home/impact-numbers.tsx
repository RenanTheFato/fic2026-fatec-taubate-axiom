import { ArrowRight } from "lucide-react"
import { useImpactSummary } from "../../hooks/use-impact-summary"
import { BrandCanvas } from "../motion/brand-canvas"
import { CountUp } from "../motion/count-up"
import { ButtonLink } from "../ui/button"
import { Container } from "../ui/container"
import { Skeleton, StateMessage } from "../ui/states"

export function ImpactNumbers() {
  const { data, isPending, isError, refetch } = useImpactSummary()

  return (
    <section aria-labelledby="numeros" className="bg-ink py-16 text-white sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-sm font-bold tracking-[0.18em] text-reward uppercase">
                Painel de impacto
              </p>
              <h2 id="numeros" className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
                Quem já é atendido pela Somos do Bem
              </h2>
            </div>

            <ButtonLink to="/impacto" variant="outline" tone="light">
              Ver painel completo
              <ArrowRight className="size-5" aria-hidden="true" />
            </ButtonLink>
          </div>

          {isError && (
            <div className="mt-10 max-w-md text-ink">
              <StateMessage
                tone="error"
                title="Não conseguimos carregar os números"
                description="Os dados do painel não responderam agora."
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
                  <Skeleton className="h-12 w-32 bg-white/15" />
                  <Skeleton className="h-4 w-40 bg-white/10" />
                </li>
              ))}
            </ul>
          )}

          {data && (
            <>
              <ul className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-6">
                {data.stats.map((stat) => (
                  <li key={stat.id} className="sm:border-l sm:border-white/15 sm:pl-6 sm:first:border-l-0 sm:first:pl-0">
                    <p className="font-display text-5xl leading-none font-extrabold text-reward">
                      <CountUp value={stat.value} />
                    </p>
                    <p className="mt-3 font-display text-lg font-bold text-white">{stat.label}</p>
                    <p className="mt-1 text-sm text-white/70">{stat.detail}</p>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-xs text-white/60">
                Números informados pela instituição. A atualização automática entra quando o Painel
                de Impacto for publicado pela API.
              </p>
            </>
          )}
        </div>

        {/* O símbolo da marca se formando a partir de partículas. Só aparece em
            tela grande e em aparelho capaz — por isso a coluna também some, em
            vez de reservar um vazio no celular. */}
        <div className="relative hidden min-h-80 lg:block">
          <BrandCanvas variant="symbol" className="absolute inset-0" />
        </div>
      </Container>
    </section>
  )
}
