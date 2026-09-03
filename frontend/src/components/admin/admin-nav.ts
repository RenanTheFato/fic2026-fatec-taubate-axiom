import {
  CalendarDays,
  FileCheck2,
  HandHeart,
  LayoutDashboard,
  Megaphone,
  Package,
  ReceiptText,
  Scale,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { UserRole } from "../../types/user-types"

export type AdminNavItem = {
  label: string
  to: string
  icon: LucideIcon
  roles: UserRole[]
  /** Agrupador na barra lateral. Módulos separam Financeiro de Comunicação. */
  group: string
  end?: boolean
}

// Esconder um item não é segurança, porque o backend continua sendo a autoridade e
// responde 403 de qualquer forma. É para não frustrar: ninguém deve clicar num
// menu para descobrir que não podia entrar.
//
// Os papéis são os do backend: dinheiro (transação, doador, recibo) responde a
// `finance`, divulgação (campanha, evento, produto) a `communication`, e o
// `admin` alcança as duas metades.
export const ADMIN_NAV: AdminNavItem[] = [
  {
    label: "Painel geral",
    to: "/admin",
    icon: LayoutDashboard,
    roles: ["admin", "finance", "communication"],
    group: "Início",
    end: true,
  },
  {
    label: "Transações",
    to: "/admin/financeiro/transacoes",
    icon: ReceiptText,
    roles: ["admin", "finance"],
    group: "Financeiro",
  },
  {
    label: "Reconciliação",
    to: "/admin/financeiro/reconciliacao",
    icon: Scale,
    roles: ["admin", "finance"],
    group: "Financeiro",
  },
  {
    label: "Recibos",
    to: "/admin/financeiro/recibos",
    icon: FileCheck2,
    roles: ["admin", "finance"],
    group: "Financeiro",
  },
  {
    label: "Doadores",
    to: "/admin/financeiro/doadores",
    icon: Users,
    roles: ["admin", "finance"],
    group: "Financeiro",
  },
  {
    label: "Campanhas",
    to: "/admin/comunicacao/campanhas",
    icon: Megaphone,
    roles: ["admin", "communication"],
    group: "Comunicação",
  },
  {
    label: "Eventos",
    to: "/admin/comunicacao/eventos",
    icon: CalendarDays,
    roles: ["admin", "communication"],
    group: "Comunicação",
  },
  {
    label: "Produtos",
    to: "/admin/comunicacao/produtos",
    icon: Package,
    roles: ["admin", "communication"],
    group: "Comunicação",
  },
  // O voluntariado ainda não tem vertical no backend, então esta é uma tela de
  // protótipo, alimentada por dado simulado e por eventos reais. A Administração
  // também a alcança, porque é ela quem demonstra o sistema inteiro.
  {
    label: "Meu painel",
    to: "/voluntario/painel",
    icon: HandHeart,
    roles: ["volunteer", "admin"],
    group: "Voluntariado",
    end: true,
  },
]

export function navFor(role: UserRole): { group: string; items: AdminNavItem[] }[] {
  const allowed = ADMIN_NAV.filter((item) => item.roles.includes(role))
  const groups: { group: string; items: AdminNavItem[] }[] = []

  for (const item of allowed) {
    const existing = groups.find((entry) => entry.group === item.group)

    if (existing) {
      existing.items.push(item)
    } else {
      groups.push({ group: item.group, items: [item] })
    }
  }

  return groups
}

// Para onde cada papel vai depois de entrar. Quem cuida de dinheiro cai na
// tela de transações; quem cuida de divulgação, na de campanhas. Abrir todo
// mundo no mesmo painel geral faria metade da equipe navegar duas vezes por dia.
//
// Todo destino aqui precisa existir na árvore de rotas: um login que termina em
// "não encontrado" é lido como login quebrado, e não como tela faltando.
export const HOME_BY_ROLE: Record<UserRole, string> = {
  admin: "/admin",
  finance: "/admin/financeiro/transacoes",
  communication: "/admin/comunicacao/campanhas",
  volunteer: "/voluntario/painel",
}
