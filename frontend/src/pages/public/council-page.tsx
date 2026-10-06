import { GovernanceRoles } from "../../components/institutional/governance-roles"
import type { GovernanceRole } from "../../components/institutional/governance-roles"
import { PeopleBoard } from "../../components/institutional/people-board"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"

const FISCAL: GovernanceRole[] = [
  {
    position: "Exame das contas",
    text: "Analisa os balancetes, o balanço anual e a execução do orçamento ao longo do exercício.",
  },
  {
    position: "Parecer anual",
    text: "Emite parecer sobre as demonstrações financeiras antes de elas irem à assembleia para aprovação.",
  },
  {
    position: "Acesso aos documentos",
    text: "Pode pedir à diretoria, a qualquer tempo, os documentos e os esclarecimentos que julgar necessários.",
  },
]

const ADVISORY: GovernanceRole[] = [
  {
    position: "Orientação estratégica",
    text: "Assessora a diretoria nas decisões de longo prazo, sem poder de execução sobre o dia a dia.",
  },
  {
    position: "Articulação",
    text: "Aproxima a associação de empresas, instituições e do poder público, ampliando a rede de apoio.",
  },
  {
    position: "Memória institucional",
    text: "Traz a experiência de quem já conduziu a casa, para que as decisões novas conheçam o que veio antes.",
  },
]

export default function CouncilPage() {
  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Conselho"
        breadcrumb={[{ label: "Institucional", to: "/institucional" }, { label: "Conselho" }]}
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                O conselho confere se o dinheiro da associação está sendo bem usado. Ele também dá
                conselhos para a diretoria.
              </p>
            }
          >
            <p>
              O conselho acompanha e fiscaliza a aplicação dos recursos da associação e assessora a
              diretoria nas decisões de longo prazo. É a instância que garante que a prestação de
              contas seja conferida por quem não executa o gasto.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="conselho-fiscal" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="conselho-fiscal"
            eyebrow="Fiscalização"
            title="Conselho Fiscal"
            description="Examina as contas da associação e emite parecer sobre as demonstrações financeiras."
            tone="institutional"
          />

          <div className="mt-10 flex flex-col gap-10">
            <PeopleBoard board="conselho-fiscal" label="do conselho fiscal" />
            <GovernanceRoles roles={FISCAL} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="conselho-consultivo" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="conselho-consultivo"
            eyebrow="Orientação"
            title="Conselho Consultivo"
            description="Assessora a diretoria em temas estratégicos, sem poder de execução."
            tone="institutional"
          />

          <div className="mt-10 flex flex-col gap-10">
            <PeopleBoard board="conselho-consultivo" label="do conselho consultivo" />
            <GovernanceRoles roles={ADVISORY} />
          </div>
        </Container>
      </section>
    </>
  )
}
