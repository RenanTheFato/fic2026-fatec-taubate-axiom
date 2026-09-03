import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Badge } from "../ui/badge"
import { STATUS_TONE, STATUS_LABEL } from "./transaction-labels"
import type { TransactionStatus } from "../../types/transaction-types"

type AdminPageProps = {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}

// O topo repetido da área privada. Tem o mesmo papel do `PageHero` no site
// público, que é fazer telas diferentes parecerem um sistema só, mas sem cascata
// nem cena 3D: aqui a pessoa vem trabalhar, e animação de abertura em tela que
// se abre trinta vezes por dia vira atrito.
export function AdminPage({ title, description, action, children }: AdminPageProps) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>

      {children}
    </div>
  )
}

type StatTileProps = {
  label: string
  value: string
  hint: string
  icon: LucideIcon
}

// O `hint` é obrigatório de propósito: um número sozinho num painel financeiro
// não diz de que período é nem do que é soma, e é assim que alguém lê "total da
// página" como "arrecadação do ano".
export function StatTile({ label, value, hint, icon: Icon }: StatTileProps) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-5">
      <div className="flex items-center gap-2 text-ink-soft">
        <Icon className="size-4" aria-hidden="true" />
        <span className="font-display text-xs font-bold tracking-wide uppercase">{label}</span>
      </div>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs leading-snug text-ink-soft">{hint}</p>
    </div>
  )
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
}
