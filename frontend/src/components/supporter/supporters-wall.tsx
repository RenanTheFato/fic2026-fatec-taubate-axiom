import { HeartHandshake, Loader2, Shuffle } from "lucide-react"
import type { ReactNode } from "react"
import { NotFoundError } from "../../config/errors"
import { useSupporters } from "../../hooks/use-supporters"
import type { SupporterScope } from "../../types/supporter-types"
import { cn } from "../../utils/cn"
import { formatNumber } from "../../utils/format"
import { Button } from "../ui/button"
import { Skeleton, StateMessage } from "../ui/states"

type SupportersWallProps = {
  scope: SupporterScope
  /** Id do título da seção que envolve o mural, para nomear a lista. */
  labelledBy: string
  /** O que oferecer quando ninguém pediu para aparecer ainda. */
  emptyAction?: ReactNode
}

// As cores alternam pela posição na lista, que já é aleatória. Nenhuma delas
// significa nada: todo nome tem o mesmo tamanho, o mesmo peso e o mesmo
// destaque, porque o mural agradece pessoas e não ordena contribuições. Todos
// os fundos são suaves e carregam texto ink, que passa em AA sobre qualquer um.
const TONES = [
  "bg-institutional-soft",
  "bg-primary-soft",
  "bg-success-soft",
  "bg-partner/10",
  "bg-reward/25",
]

function contributorsLine(contributors: number, listed: number): string {
  const people = contributors === 1 ? "pessoa ou empresa apoiou" : "pessoas e empresas apoiaram"
  const names = listed === 1 ? "1 pediu para ter o nome aqui" : `${formatNumber(listed)} pediram para ter o nome aqui`

  return `${formatNumber(contributors)} ${people}, e ${names}.`
}

// O mural de quem apoiou. A ordem vem embaralhada da API, que nunca devolve
// valor nem quantas vezes alguém contribuiu: não há como esta tela ordenar por
// dinheiro, e é de propósito. Quem não marcou a opção ao doar não aparece aqui,
// mas entra na contagem, como número.
export function SupportersWall({ scope, labelledBy, emptyAction }: SupportersWallProps) {
  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useSupporters(scope)

  if (isPending) {
    return (
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, index) => (
          <Skeleton key={index} className={cn("h-10 rounded-pill", index % 3 === 0 ? "w-44" : index % 3 === 1 ? "w-32" : "w-36")} />
        ))}
      </div>
    )
  }

  if (isError) {
    if (error instanceof NotFoundError) {
      return null
    }

    return (
      <StateMessage
        tone="error"
        title="O mural não carregou"
        description="Não conseguimos buscar os nomes agora. Os nomes continuam guardados: falhou só a leitura."
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
    )
  }

  const first = data.pages[0]
  const names = data.pages.flatMap((page) => page.supporters)

  if (first.total === 0) {
    return (
      <StateMessage
        title={first.contributors > 0 ? "Quem apoiou preferiu não aparecer, por enquanto" : "O mural ainda está em branco"}
        description={
          first.contributors > 0
            ? `${contributorsLine(first.contributors, 0)} Ao contribuir, marque a opção do Mural do Bem para ter o seu nome aqui.`
            : "Nenhuma contribuição foi confirmada aqui ainda. Ao contribuir, marque a opção do Mural do Bem para ter o seu nome aqui."
        }
        action={emptyAction}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-ink-soft">
          <HeartHandshake className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{contributorsLine(first.contributors, first.total)}</span>
        </p>
        <p className="flex items-center gap-2 text-xs text-ink-soft">
          <Shuffle className="size-4 shrink-0" aria-hidden="true" />
          Ordem aleatória a cada visita, nunca por valor.
        </p>
      </div>

      <ul aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
        {names.map((supporter, index) => (
          <li
            key={`${index}-${supporter.name}`}
            className={cn(
              "inline-flex min-h-10 max-w-full items-center rounded-pill px-4 py-2 font-display text-sm font-bold break-words text-ink",
              TONES[index % TONES.length],
            )}
          >
            {supporter.name}
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-soft" aria-live="polite">
          Mostrando {formatNumber(names.length)} de {formatNumber(first.total)} nomes.
        </p>

        {hasNextPage && (
          <Button size="sm" variant="outline" tone="ink" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Carregando nomes
              </>
            ) : (
              "Mostrar mais nomes"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
