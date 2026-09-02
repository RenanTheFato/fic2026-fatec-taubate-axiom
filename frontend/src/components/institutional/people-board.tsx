import { Reveal } from "../motion/reveal"
import { usePeople } from "../../hooks/use-people"
import type { PersonBoard } from "../../types/institutional-types"
import { ButtonLink } from "../ui/button"
import { CardSkeleton, StateMessage } from "../ui/states"
import { PersonCard } from "./person-card"

type PeopleBoardProps = {
  board: PersonBoard
  /** Nome do colegiado como aparece na frase do estado vazio. */
  label: string
}

// Diretoria e conselhos compartilham a mesma tela; muda o colegiado e o texto.
// O estado vazio aqui não é um acidente: nome de pessoa e cargo estatutário são
// dados que só a associação tem, e a página prefere dizer isso a exibir uma
// composição inventada.
export function PeopleBoard({ board, label }: PeopleBoardProps) {
  const { data, isPending, isError, refetch } = usePeople(board)

  if (isPending) {
    return (
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={index}>
            <CardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (isError) {
    return (
      <div className="max-w-md">
        <StateMessage
          tone="error"
          title={`Não conseguimos carregar ${label}`}
          description="Os dados não responderam agora."
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
    )
  }

  if (data.length === 0) {
    return (
      <div className="max-w-2xl">
        <StateMessage
          title={`A composição ${label} ainda não foi publicada`}
          description={`Assim que a associação enviar a relação de nomes e cargos, ela aparece aqui — com mandato e retrato de cada pessoa. Enquanto isso, o estatuto e os documentos de governança ficam na página de Transparência.`}
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/transparencia" size="sm">
                Ver transparência
              </ButtonLink>
              <ButtonLink to="/fale-conosco" size="sm" variant="outline">
                Falar com a associação
              </ButtonLink>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((person, index) => (
        <li key={person.id}>
          <Reveal delay={index * 0.06} className="h-full">
            <PersonCard person={person} />
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
