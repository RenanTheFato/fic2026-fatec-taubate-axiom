import { CalendarDays, HeartHandshake, Target } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { CampaignProgress } from "../../components/campaign/campaign-progress"
import { CheckoutForm } from "../../components/checkout/checkout-form"
import { PageHero } from "../../components/layout/page-hero"
import { Reveal } from "../../components/motion/reveal"
import { SupportersWall } from "../../components/supporter/supporters-wall"
import { Badge } from "../../components/ui/badge"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { ImageSlot } from "../../components/ui/image-slot"
import { Prose } from "../../components/ui/prose"
import { SectionHeading } from "../../components/ui/section"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { NotFoundError } from "../../config/errors"
import { useCampaign } from "../../hooks/use-campaigns"
import { useEvents } from "../../hooks/use-events"
import { byStartDate } from "../../services/event/list-events-service"
import type { Campaign } from "../../types/campaign-types"
import { formatDate } from "../../utils/format"

const PRESETS = [50, 100, 200, 500]

// Os eventos que sustentam a campanha. Quem comprou convite de um deles também
// está no mural dela, então a página mostra de onde mais o apoio veio.
function CampaignEvents({ campaign }: { campaign: Campaign }) {
  const { data } = useEvents()
  const related = data ? data.events.filter((event) => event.campaign_id === campaign.id).sort(byStartDate("asc")) : []

  if (related.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="font-display text-xl font-bold">Eventos desta campanha</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {related.map((event) => (
          <li key={event.id}>
            <Link
              to={`/eventos/${event.slug}`}
              className="flex items-start gap-3 rounded-card border border-line p-4 transition-colors hover:border-primary"
            >
              <CalendarDays className="mt-0.5 size-5 shrink-0 text-institutional-dark" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-display font-bold">{event.title}</span>
                <span className="block text-sm text-ink-soft">
                  {formatDate(event.starts_at)}
                  {event.location ? `, ${event.location}` : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function CampaignPage() {
  const { slug = "" } = useParams()
  const { data: campaign, isPending, isError, error, refetch } = useCampaign(slug)

  if (isPending) {
    return (
      <Container className="py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-4 h-5 w-1/3" />
        <Skeleton className="mt-10 h-72 w-full" />
      </Container>
    )
  }

  if (isError) {
    const missing = error instanceof NotFoundError

    return (
      <Container className="py-16">
        <div className="max-w-lg">
          <StateMessage
            tone={missing ? "neutral" : "error"}
            title={missing ? "Campanha não encontrada" : "A campanha não carregou"}
            description={
              missing
                ? "Este endereço não corresponde a nenhuma campanha publicada. Ela pode ter sido retirada, ou o link pode estar incompleto."
                : "Não conseguimos buscar esta campanha agora."
            }
            action={
              missing ? (
                <ButtonLink to="/campanhas" size="sm">
                  Ver as campanhas
                </ButtonLink>
              ) : (
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="font-display font-bold text-primary underline underline-offset-4"
                >
                  Tentar de novo
                </button>
              )
            }
          />
        </div>
      </Container>
    )
  }

  const active = campaign.status === "active"

  return (
    <>
      <PageHero
        eyebrow="Campanha"
        title={campaign.title}
        tone="primary"
        breadcrumb={[{ label: "Campanhas", to: "/campanhas" }, { label: campaign.title }]}
        lead={
          <p>
            {active ? "Recebendo doações desde " : "Realizada de "}
            {formatDate(campaign.starts_at)}
            {campaign.ends_at ? `${active ? ", até " : " a "}${formatDate(campaign.ends_at)}` : ""}.
          </p>
        }
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {active ? <Badge tone="success">Recebendo doações</Badge> : <Badge tone="institutional">Encerrada</Badge>}
        </div>
      </PageHero>

      <section className="py-14 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <Reveal from="left">
            <div className="overflow-hidden rounded-card border border-line">
              <ImageSlot src={campaign.image_url} ratio="16/9" alt={campaign.title} hint={`Foto da campanha "${campaign.title}"`} eager />
            </div>

            <div className="mt-8 rounded-card border border-line p-5">
              <p className="mb-3 flex items-center gap-2 font-display text-xs font-bold tracking-wide text-ink-soft uppercase">
                <Target className="size-4 text-primary" aria-hidden="true" />
                Meta da campanha
              </p>
              <CampaignProgress campaign={campaign} />
            </div>

            {campaign.description && (
              <Prose className="mt-8">
                <p>{campaign.description}</p>
              </Prose>
            )}

            <CampaignEvents campaign={campaign} />
          </Reveal>

          <Reveal from="right" delay={0.1}>
            <div id="doar" className="rounded-card border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-8">
              {active ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <HeartHandshake className="size-6 text-primary" aria-hidden="true" />
                    <h2 className="font-display text-2xl font-extrabold">Doe para esta campanha</h2>
                  </div>
                  <CheckoutForm
                    type="donation"
                    title={`Doação para ${campaign.title}`}
                    presets={PRESETS}
                    campaignId={campaign.id}
                    submitLabel="Ir para o pagamento"
                  />
                </div>
              ) : (
                <StateMessage
                  title="Esta campanha já foi encerrada"
                  description="A página fica no ar como registro do que foi feito e de quem ajudou. Você pode apoiar uma campanha aberta ou o caixa geral."
                  action={
                    <ButtonLink to="/campanhas" size="sm">
                      Ver campanhas abertas
                    </ButtonLink>
                  }
                />
              )}
            </div>
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="mural-campanha" className="bg-surface-muted py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="mural-campanha"
            eyebrow="Mural do Bem"
            title={active ? "Quem está fazendo esta campanha acontecer" : "Quem fez esta campanha acontecer"}
            description="Os nomes de quem doou, patrocinou ou foi a um evento desta campanha e pediu para aparecer aqui."
          />
          <div className="mt-10">
            <SupportersWall
              scope={{ kind: "campaign", slug: campaign.slug }}
              labelledBy="mural-campanha"
              emptyAction={
                active ? (
                  <a href="#doar" className="font-display font-bold text-primary underline underline-offset-4">
                    Doar e ser o primeiro nome
                  </a>
                ) : undefined
              }
            />
          </div>
        </Container>
      </section>
    </>
  )
}
