import { HeartHandshake } from "lucide-react"
import { CampaignCard } from "../../components/campaign/campaign-card"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"
import { CardSkeleton, StateMessage } from "../../components/ui/states"
import { useCampaigns } from "../../hooks/use-campaigns"

export default function CampaignsPage() {
  const { data, isPending, isError, refetch } = useCampaigns()

  const active = data ? data.filter((campaign) => campaign.status === "active") : []
  const finished = data ? data.filter((campaign) => campaign.status === "finished") : []

  return (
    <>
      <PageHero
        eyebrow="Campanhas"
        title="O que a sua doação sustenta"
        breadcrumb={[{ label: "Campanhas" }]}
        tone="primary"
        scene="drift"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Cada campanha junta dinheiro para uma coisa. Você vê quanto já entrou e quem ajudou.
              </p>
            }
          >
            <p>
              Cada campanha dá destino à doação e mostra a meta subindo. As encerradas continuam aqui,
              com o mural de quem ajudou a fazer acontecer.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="abertas" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="abertas"
            eyebrow="Abertas"
            title="Recebendo doações agora"
            description="Escolha uma frente e acompanhe a meta, ou doe para onde for mais necessário."
          />

          {isPending && (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && (
            <div className="mt-10 max-w-md">
              <StateMessage
                tone="error"
                title="As campanhas não carregaram"
                description="Não conseguimos buscar as campanhas agora. A doação para o caixa geral continua funcionando."
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

          {data && active.length === 0 && (
            <div className="mt-10 max-w-md">
              <StateMessage
                title="Nenhuma campanha aberta agora"
                description="A doação para o caixa geral segue disponível e é aplicada nas três frentes."
                action={
                  <ButtonLink to="/doe-agora" size="sm">
                    Doar para o caixa geral
                  </ButtonLink>
                }
              />
            </div>
          )}

          {active.length > 0 && (
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {active.map((campaign, index) => (
                <li key={campaign.id}>
                  <Reveal delay={index * 0.06} className="h-full">
                    <CampaignCard campaign={campaign} />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {finished.length > 0 && (
        <section aria-labelledby="encerradas" className="bg-surface-muted py-16 sm:py-20">
          <Container>
            <SectionHeading
              id="encerradas"
              eyebrow="Histórico"
              title="Campanhas encerradas"
              description="O que já foi feito continua no ar, com o total arrecadado e o mural de quem apoiou."
              tone="institutional"
            />

            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {finished.map((campaign, index) => (
                <li key={campaign.id}>
                  <Reveal delay={index * 0.06} className="h-full">
                    <CampaignCard campaign={campaign} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col items-start gap-5 rounded-card border border-line bg-primary-soft p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <HeartHandshake className="mt-1 size-8 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-display text-xl font-bold">Todo mundo que ajudou, num lugar só</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
                O Mural do Bem reúne quem apoiou qualquer campanha, evento ou o caixa geral, em ordem
                aleatória e sem valor nenhum.
              </p>
            </div>
          </div>
          <ButtonLink to="/mural-do-bem" variant="outline" tone="ink">
            Ver o Mural do Bem
          </ButtonLink>
        </Container>
      </section>
    </>
  )
}
