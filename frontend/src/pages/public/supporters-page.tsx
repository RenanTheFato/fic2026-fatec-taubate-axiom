import { HeartHandshake, ShieldCheck, Shuffle } from "lucide-react"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { SupportersWall } from "../../components/supporter/supporters-wall"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"

const PROMISES = [
  {
    icon: Shuffle,
    title: "Sem ranking",
    text: "A ordem é sorteada a cada visita. Ninguém aparece na frente por ter doado mais, e nenhum valor é mostrado.",
  },
  {
    icon: ShieldCheck,
    title: "Só com o seu sim",
    text: "O nome só entra aqui se a pessoa marcou a opção do Mural do Bem ao contribuir. Quem não marcou é contado, mas não nomeado.",
  },
  {
    icon: HeartHandshake,
    title: "Todo apoio conta",
    text: "Doação para campanha, para o caixa geral, patrocínio, convite de evento e compra na loja solidária: tudo entra no mesmo mural.",
  },
]

// O mural do site inteiro: toda campanha, todo evento e toda doação avulsa. É a
// versão agregada do mural que cada campanha e cada evento têm na própria página.
export default function SupportersPage() {
  return (
    <>
      <PageHero
        eyebrow="Mural do Bem"
        title="Quem faz a Somos do Bem acontecer"
        breadcrumb={[{ label: "Mural do Bem" }]}
        tone="partner"
        scene="network"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Aqui estão os nomes de quem ajudou a associação. A ordem muda a cada visita. Ninguém
                vê quanto cada pessoa deu.
              </p>
            }
          >
            <p>
              O agradecimento a cada pessoa e empresa que apoiou uma campanha, um evento ou o caixa
              geral. Sem ranking e sem valores: todo nome tem o mesmo tamanho aqui.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="como-funciona" className="py-14 sm:py-16">
        <Container>
          <h2 id="como-funciona" className="sr-only">
            Como o mural funciona
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {PROMISES.map((promise, index) => (
              <li key={promise.title}>
                <Reveal delay={index * 0.06} className="h-full">
                  <div className="flex h-full flex-col gap-3 rounded-card border border-line p-6">
                    <promise.icon className="size-6 text-partner-dark" aria-hidden="true" />
                    <h3 className="font-display text-lg font-bold">{promise.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-soft">{promise.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="nomes" className="bg-surface-muted py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="nomes"
            eyebrow="Obrigado"
            title="Cada nome, uma ajuda"
            tone="partner"
          />
          <div className="mt-10">
            <SupportersWall
              scope={{ kind: "site" }}
              labelledBy="nomes"
              emptyAction={
                <ButtonLink to="/doe-agora" size="sm">
                  Fazer uma doação
                </ButtonLink>
              }
            />
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="flex flex-col items-start gap-5 rounded-card border border-line bg-partner/10 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Quer ver o seu nome aqui?</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
              Ao doar, marque a opção do Mural do Bem. O nome entra depois que o pagamento é confirmado,
              e você pode pedir a retirada a qualquer momento pelo Fale Conosco.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/doe-agora">Doar agora</ButtonLink>
            <ButtonLink to="/campanhas" variant="outline" tone="ink">
              Ver campanhas
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}
