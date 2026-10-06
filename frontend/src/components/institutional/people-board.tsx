import { Reveal } from "../motion/reveal"
import { usePeople } from "../../hooks/use-people"
import type { PersonBoard } from "../../types/institutional-types"
import { CardSkeleton, StateMessage } from "../ui/states"
import { PersonCard } from "./person-card"

type PeopleBoardProps = {
  board: PersonBoard
  /** Nome do colegiado como aparece na mensagem de falha de carga. */
  label: string
}

// Diretoria e conselhos compartilham a mesma tela; muda o colegiado e o texto.
// Nome e retrato de pessoa são dados que só a associação tem, então enquanto a
// relação nominal não chega o bloco simplesmente não ocupa espaço: quem explica
// o colegiado ao visitante é a estrutura de cargos, logo abaixo, em
// `GovernanceRoles`. Inventar uma composição está fora de questão.
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
    return null
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
