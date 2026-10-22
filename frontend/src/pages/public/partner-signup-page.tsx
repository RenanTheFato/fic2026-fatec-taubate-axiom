import { ClipboardCheck, LayoutDashboard, ReceiptText } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { PartnerForm } from "../../components/partner/partner-form"
import { Card } from "../../components/ui/card"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "A associação analisa o pedido",
    text: "A captação confere os dados da empresa e responde pelo painel. Se faltar algo, o motivo aparece lá, e dá para mandar de novo.",
  },
  {
    icon: LayoutDashboard,
    title: "A empresa ganha um painel",
    text: "Aprovada a parceria, a empresa sugere campanhas, aportes, patrocínios de evento, doações e dias de voluntariado da equipe.",
  },
  {
    icon: ReceiptText,
    title: "Cada aporte tem recibo",
    text: "O aporte aceito é pago pelo site, e o recibo sai no nome e no CNPJ da empresa, com o mesmo código de conferência pública de qualquer doação.",
  },
]

export default function PartnerSignupPage() {
  return (
    <>
      <PageHero
        eyebrow="Rede de parceiros"
        title="Seja parceiro"
        tone="partner"
        breadcrumb={[{ label: "Parceiros", to: "/parceiros" }, { label: "Seja parceiro" }]}
        scene="network"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Preencha o pedido com os dados da empresa. A associação responde pelo painel que a empresa ganha ao enviar.
              </p>
            }
          >
            <p>
              Conte quem é a empresa e como ela quer apoiar. O pedido cria o acesso da empresa ao painel de parceiros,
              onde ela acompanha a análise e, depois de aprovada, propõe campanhas, aportes e patrocínios.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="como-funciona" className="py-16 sm:py-20">
        <Container>
          <h2 id="como-funciona" className="sr-only">
            Como funciona
          </h2>

          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Reveal delay={index * 0.06} className="h-full">
                  <div className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-6">
                    <span className="flex size-11 items-center justify-center rounded-pill bg-partner/12 text-partner-dark">
                      <step.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-lg font-bold">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-soft">{step.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="pedido" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Reveal>
            <SectionHeading
              id="pedido"
              eyebrow="Pedido de parceria"
              title="Dados da empresa"
              description="Os campos marcados com asterisco são obrigatórios."
              tone="partner"
            />
          </Reveal>

          <Reveal delay={0.08} className="mt-10">
            <Card>
              <div className="p-6 sm:p-8">
                <PartnerForm />
              </div>
            </Card>
          </Reveal>

          <p className="mt-8 text-sm leading-relaxed text-ink-soft">
            A empresa já fez o pedido?{" "}
            <Link to="/entrar" className="font-bold text-primary underline underline-offset-4">
              Entre no painel
            </Link>{" "}
            com o e-mail e a senha cadastrados.
          </p>
        </Container>
      </section>
    </>
  )
}
