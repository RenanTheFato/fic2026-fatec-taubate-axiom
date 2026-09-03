import { HeartHandshake, Receipt, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CampaignProgress } from "../../components/campaign/campaign-progress"
import { CheckoutForm } from "../../components/checkout/checkout-form"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { Container } from "../../components/ui/container"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useActiveCampaigns } from "../../hooks/use-campaigns"
import { cn } from "../../utils/cn"

// Valores sugeridos, não obrigatórios. O campo aberto continua ali: sugerir é
// ajudar quem não sabe quanto dar, travar é decidir pela pessoa.
const PRESETS = [50, 100, 200, 500]

const ASSURANCES = [
  { icon: ShieldCheck, text: "O pagamento acontece no ambiente do Stripe. A associação não recebe nem guarda o número do seu cartão." },
  { icon: Receipt, text: "Toda doação confirmada gera um recibo com código verificável por qualquer pessoa, sem login." },
  { icon: HeartHandshake, text: "Você escolhe se a doação vai para o caixa geral ou para uma frente específica." },
]

export default function DonatePage() {
  const [params] = useSearchParams()
  const { data: campaigns, isPending, isError } = useActiveCampaigns()

  // A campanha pode vir pela URL (link de uma campanha específica) ou ser
  // escolhida na tela. "Onde for mais necessário" é o padrão, e é o `null`.
  const [campaignId, setCampaignId] = useState<string | null>(params.get("campanha"))

  const selected = campaigns?.find((campaign) => campaign.id === campaignId) ?? null

  return (
    <>
      <PageHero
        eyebrow="Doe agora"
        title="Sua doação vira atendimento"
        breadcrumb={[{ label: "Doe agora" }]}
        tone="primary"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Você pode doar qualquer valor. Escolha para onde o dinheiro vai. Depois você recebe um
                recibo por e-mail.
              </p>
            }
          >
            <p>
              Qualquer valor ajuda, e você escolhe onde ele entra: no caixa que sustenta as três
              frentes ou em uma campanha específica. O recibo chega por e-mail e pode ser conferido
              por qualquer pessoa.
            </p>
          </ReadingSwitch>
        }
      />

      <section className="py-14 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <Reveal from="left">
            <h2 className="font-display text-2xl font-extrabold">Para onde vai a sua doação?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Deixe no caixa geral e a associação aplica onde a necessidade for maior no mês. Ou
              escolha uma campanha e acompanhe a meta subir.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setCampaignId(null)}
                aria-pressed={campaignId === null}
                className={cn(
                  "rounded-card border-2 p-5 text-left transition-colors",
                  campaignId === null ? "border-primary bg-primary-soft" : "border-line hover:border-ink-soft/40",
                )}
              >
                <span className="font-display font-bold">Onde for mais necessário</span>
                <span className="mt-1 block text-sm text-ink-soft">
                  A associação decide entre o Ambulatório, a Escola e a Oficina Terapêutica.
                </span>
              </button>

              {isPending && (
                <>
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </>
              )}

              {isError && (
                <StateMessage
                  tone="error"
                  title="As campanhas não carregaram"
                  description="Você ainda pode doar para o caixa geral, que é a opção acima e funciona normalmente."
                />
              )}

              {campaigns?.map((campaign) => {
                const active = campaignId === campaign.id

                return (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => setCampaignId(campaign.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col gap-3 rounded-card border-2 p-5 text-left transition-colors",
                      active ? "border-primary bg-primary-soft" : "border-line hover:border-ink-soft/40",
                    )}
                  >
                    <span className="font-display font-bold">{campaign.title}</span>
                    {campaign.description && (
                      <span className="line-clamp-2 text-sm text-ink-soft">{campaign.description}</span>
                    )}
                    <CampaignProgress campaign={campaign} />
                  </button>
                )
              })}

              {campaigns && campaigns.length === 0 && (
                <StateMessage
                  title="Nenhuma campanha aberta agora"
                  description="A doação para o caixa geral segue disponível e é aplicada nas três frentes."
                />
              )}
            </div>

            <ul className="mt-8 flex flex-col gap-3">
              {ASSURANCES.map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-sm text-ink-soft">
                  <item.icon className="mt-0.5 size-5 shrink-0 text-institutional-dark" aria-hidden="true" />
                  {item.text}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal from="right" delay={0.1}>
            <div className="rounded-card border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-8">
              <CheckoutForm
                type="donation"
                title={selected ? `Doação para ${selected.title}` : "Doação para onde for mais necessário"}
                presets={PRESETS}
                campaignId={campaignId}
                submitLabel="Ir para o pagamento"
              />
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
