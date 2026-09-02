import { PeopleBoard } from "../../components/institutional/people-board"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Container } from "../../components/ui/container"

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

      <section className="py-16 sm:py-24">
        <Container>
          <PeopleBoard board="diretoria" label="da diretoria" />
        </Container>
      </section>
    </>
  )
}
