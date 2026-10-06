import { GovernanceRoles } from "../../components/institutional/governance-roles"
import type { GovernanceRole } from "../../components/institutional/governance-roles"
import { PeopleBoard } from "../../components/institutional/people-board"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"

const ROLES: GovernanceRole[] = [
  {
    position: "Presidência",
    text: "Representa a associação, responde por ela perante os órgãos públicos e conduz a execução do que a assembleia aprova.",
  },
  {
    position: "Vice-presidência",
    text: "Acompanha as frentes delegadas pela presidência e assume as funções dela nos impedimentos.",
  },
  {
    position: "Secretaria",
    text: "Cuida das atas, dos registros e da correspondência oficial, e mantém a documentação da associação em ordem.",
  },
  {
    position: "Tesouraria",
    text: "Responde pela guarda dos recursos, pelos pagamentos e pela apresentação das contas ao conselho e à assembleia.",
  },
]

export default function BoardPage() {
  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Diretoria"
        breadcrumb={[{ label: "Institucional", to: "/institucional" }, { label: "Diretoria" }]}
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                A diretoria é o grupo de pessoas que toma as decisões da associação. Elas são
                escolhidas pelos associados e não recebem salário por isso.
              </p>
            }
          >
            <p>
              A diretoria é o colegiado responsável pela condução da associação: representa a
              instituição, executa as decisões da assembleia e responde pela gestão no período do
              mandato.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="eleita" className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            id="eleita"
            eyebrow="Colegiado"
            title="Diretoria Eleita"
            description="Os cargos escolhidos em assembleia pelos associados."
            tone="institutional"
          />

          <div className="mt-10">
            <PeopleBoard board="diretoria-eleita" label="da diretoria eleita" />
          </div>
        </Container>
      </section>

      <section aria-labelledby="nomeada" className="border-t border-line bg-surface-muted py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="nomeada"
            eyebrow="Pastas"
            title="Diretoria Nomeada"
            description="As pastas que respondem por cada área de atuação da associação. A mesma pessoa pode ocupar um cargo eleito e uma pasta."
            tone="institutional"
          />

          <div className="mt-10">
            <PeopleBoard board="diretoria-nomeada" label="da diretoria nomeada" />
          </div>
        </Container>
      </section>

      <section aria-labelledby="cargos" className="border-t border-line py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="cargos"
            eyebrow="Estrutura"
            title="O que cada cargo responde"
            description="As atribuições dos cargos eleitos, conforme o estatuto."
            tone="institutional"
          />

          <div className="mt-10">
            <GovernanceRoles roles={ROLES} />
          </div>
        </Container>
      </section>
    </>
  )
}
