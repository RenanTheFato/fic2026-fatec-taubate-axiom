import type { ReactNode } from "react"
import { cn } from "../../utils/cn"

export type Column<T> = {
  key: string
  header: string
  cell: (row: T) => ReactNode
  /** A coluna que identifica a linha. No cartão ela vira o título, sem rótulo. */
  primary?: boolean
  align?: "left" | "right"
  /** Colunas de apoio somem antes das outras quando a tabela aperta. */
  hideBelow?: "lg" | "xl"
  /** Valor curto que nunca deve quebrar em duas linhas: data, dinheiro, número. */
  nowrap?: boolean
}

export type DataListBreakpoint = "md" | "lg" | "xl"

type DataListProps<T> = {
  caption: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Ações da linha. No cartão elas vão para o rodapé, com área de toque cheia. */
  actions?: (row: T) => ReactNode
  /**
   * A partir de qual largura a tabela aparece. Uma tabela com botões na linha
   * precisa de mais espaço do que uma só de leitura, e forçá-la a caber é o que
   * faz coluna encavalar em coluna.
   */
  breakpoint?: DataListBreakpoint
}

// Tabela no desktop, cartões empilhados no celular. **Nunca** tabela com rolagem
// horizontal: é a causa mais comum de abandono de painel no telefone.
//
// As duas versões são o mesmo dado escrito duas vezes no DOM, e é `display:none`
// que decide qual vale. Isso também tira a escondida da árvore de acessibilidade,
// então um leitor de tela nunca ouve o conteúdo em dobro.
//
// **Uma tabela não encolhe abaixo do conteúdo dela.** Com `table-layout: auto`,
// se a soma das larguras mínimas passar do container, a tabela vaza para fora em
// vez de espremer, e é isso que aparece como texto por cima de botão. Por isso
// aqui: a coluna de ações recebe `w-px`, que em tabela significa "o mínimo
// possível", sobrando o resto para as colunas de dado; as células alinham pelo
// topo, para que uma linha alta não deixe as vizinhas flutuando no meio; e cada
// página escolhe o ponto em que a tabela vira cartão, em vez de todas herdarem o
// mesmo `md`.
const TABLE_FROM: Record<DataListBreakpoint, string> = {
  md: "hidden md:block",
  lg: "hidden lg:block",
  xl: "hidden xl:block",
}

const CARDS_UNTIL: Record<DataListBreakpoint, string> = {
  md: "md:hidden",
  lg: "lg:hidden",
  xl: "xl:hidden",
}

export function DataList<T>({
  caption,
  columns,
  rows,
  rowKey,
  actions,
  breakpoint = "md",
}: DataListProps<T>) {
  return (
    <>
      <div className={TABLE_FROM[breakpoint]}>
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line text-left">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-3 py-3 font-display text-xs font-bold tracking-wide text-ink-soft uppercase",
                    column.align === "right" && "text-right",
                    column.nowrap && "whitespace-nowrap",
                    column.hideBelow === "lg" && "hidden lg:table-cell",
                    column.hideBelow === "xl" && "hidden xl:table-cell",
                  )}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th scope="col" className="w-px px-3 py-3 text-right">
                  <span className="sr-only">Ações</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line/70 align-top hover:bg-surface-muted">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 py-4",
                      column.align === "right" && "text-right",
                      column.primary && "font-semibold",
                      column.nowrap && "whitespace-nowrap",
                      column.hideBelow === "lg" && "hidden lg:table-cell",
                      column.hideBelow === "xl" && "hidden xl:table-cell",
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {actions && (
                  <td className="w-px px-3 py-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={cn("flex flex-col gap-4", CARDS_UNTIL[breakpoint])}>
        {rows.map((row) => (
          <li key={rowKey(row)} className="rounded-card border border-line bg-surface p-4">
            {columns
              .filter((column) => column.primary)
              .map((column) => (
                <p key={column.key} className="font-display text-base font-bold">
                  {column.cell(row)}
                </p>
              ))}

            <dl className="mt-3 flex flex-col gap-2">
              {columns
                .filter((column) => !column.primary)
                .map((column) => (
                  <div key={column.key} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <dt className="text-xs font-bold tracking-wide text-ink-soft uppercase">{column.header}</dt>
                    <dd className="min-w-0 text-sm break-words">{column.cell(row)}</dd>
                  </div>
                ))}
            </dl>

            {actions && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                {actions(row)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
