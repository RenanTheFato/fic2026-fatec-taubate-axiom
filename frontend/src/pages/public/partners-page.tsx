import { Building2, FileText, HandHeart, Handshake, Megaphone, Package } from "lucide-react"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { ButtonLink } from "../../components/ui/button"
import { Card, CardBody } from "../../components/ui/card"
import { Container } from "../../components/ui/container"
import { Prose } from "../../components/ui/prose"
import { SectionHeading } from "../../components/ui/section"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { usePartners } from "../../hooks/use-partners"
import type { Partner } from "../../types/partner-types"

const WAYS = [
  {
    icon: Handshake,
    title: "Patrocínio de eventos",
    text: "Apoiar o Chefs do Bem, o Chocolate do Bem e as demais ações do calendário, com presença da marca no material do evento.",
  },
  {
    icon: Package,
    title: "Doação de produtos e serviços",
    text: "Insumos das oficinas, material pedagógico, manutenção predial e serviços que a associação contrataria de outra forma.",
  },
  {
    icon: HandHeart,
    title: "Voluntariado corporativo",
    text: "Times da empresa em ações combinadas com a coordenação, dentro do calendário da casa.",
  },
  {
    icon: Megaphone,
    title: "Apoio institucional",
    text: "Divulgação das campanhas nos canais da empresa e aproximação de novos parceiros da rede.",
  },
]

// Formato fixo, pela mesma razão dos cartões da grade: o quadro tem a altura e a
// largura definidas por ele mesmo, então logo alto, logo largo e parceiro sem
// arquivo ocupam exatamente o mesmo espaço, e a grade nunca fica irregular.
function PartnerTile({ partner }: { partner: Partner }) {
  const content = partner.logo ? (
    <img src={partner.logo} alt={partner.name} loading="lazy" className="max-h-14 w-auto object-contain" />
  ) : (
    <span className="text-center font-display text-base leading-tight font-bold text-ink-soft">
      {partner.name}
    </span>
  )

  return (
    <li className="flex h-28 items-center justify-center rounded-card border border-line bg-surface px-5 transition-colors hover:border-institutional">
      {partner.site ? (
        <a
          href={partner.site}
          target="_blank"
          rel="noreferrer noopener"
          className="flex size-full items-center justify-center"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </li>
  )
}

export default function PartnersPage() {
  const { data, isPending, isError, refetch } = usePartners()

  return (
    <>
      <PageHero
        eyebrow="Rede"
        title="Parceiros"
        tone="partner"
        breadcrumb={[{ label: "Parceiros" }]}
        scene="network"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Empresas parceiras ajudam a associação com dinheiro, produtos e serviços. Sem elas,
                muita coisa não aconteceria.
              </p>
            }
          >
            <p>
              As empresas que caminham com a associação sustentam parte do que acontece aqui todo
              mês: atendimento, material, eventos e manutenção. Esta página é o reconhecimento de
              quem já está na rede e o convite para quem quer entrar.
            </p>
          </ReadingSwitch>
        }
      >
        <ButtonLink to="/fale-conosco" size="lg" tone="partner">
          <Building2 className="size-5" aria-hidden="true" />
          Quero ser parceiro
        </ButtonLink>
      </PageHero>

      <section aria-labelledby="rede" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="rede"
            eyebrow="Quem caminha junto"
            title="Nossos parceiros"
            description="Empresas e instituições que apoiam os programas da associação."
            tone="partner"
          />

          {isPending && (
            <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <li key={index}>
                  <Skeleton className="h-28 w-full" />
                </li>
              ))}
            </ul>
          )}

          {isError && (
            <div className="mt-10 max-w-md">
              <StateMessage
                tone="error"
                title="A lista de parceiros não carregou"
                description="Não conseguimos montar a rede agora."
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

          {data && data.length > 0 && (
            <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.map((partner) => (
                <PartnerTile key={partner.id} partner={partner} />
              ))}
            </ul>
          )}
        </Container>
      </section>

      <section aria-labelledby="como-apoiar" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="como-apoiar"
            eyebrow="Formas de apoiar"
            title="Como uma empresa entra na rede"
            description="A parceria é desenhada junto com a associação, a partir do que a empresa pode oferecer."
            tone="partner"
          />

          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {WAYS.map((way, index) => (
              <li key={way.title}>
                <Reveal delay={index * 0.06} className="h-full">
                  <Card className="h-full">
                    <CardBody className="gap-3">
                      <span className="flex size-11 items-center justify-center rounded-pill bg-partner/12 text-partner-dark">
                        <way.icon className="size-5" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-lg font-bold">{way.title}</h3>
                      <p className="text-sm leading-relaxed text-ink-soft">{way.text}</p>
                    </CardBody>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="prestacao" className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="prestacao"
              eyebrow="Compromisso"
              title="O que o parceiro recebe de volta"
              tone="partner"
            />

            <Prose className="mt-6">
              <p>
                Toda contribuição de empresa entra na mesma prestação de contas que a associação
                publica para qualquer doador: o que entrou, para qual programa foi e o que aquilo
                virou no atendimento.
              </p>
              <p>
                Quem patrocina um evento recebe o retorno daquela edição, com o resultado da
                arrecadação e o registro das ações apoiadas.
              </p>
            </Prose>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/transparencia" tone="partner">
                <FileText className="size-5" aria-hidden="true" />
                Ver a transparência
              </ButtonLink>
              <ButtonLink to="/impacto" variant="outline">
                Painel de impacto
              </ButtonLink>
            </div>
          </div>

          <Card className="h-full">
            <CardBody className="justify-center gap-4">
              <h3 className="font-display text-xl font-bold">Falar com a captação</h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                A equipe de captação apresenta os programas, os eventos do calendário e as formas de
                apoio que cabem no perfil da sua empresa.
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to="/fale-conosco" tone="partner" size="sm">
                  Fale conosco
                </ButtonLink>
                <ButtonLink to="/doe-agora" size="sm" variant="outline">
                  Doar como empresa
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        </Container>
      </section>
    </>
  )
}
