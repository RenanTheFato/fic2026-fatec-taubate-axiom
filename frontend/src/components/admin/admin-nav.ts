import {
  Award,
  CalendarDays,
  FileCheck2,
  HandHeart,
  LayoutDashboard,
  Megaphone,
  Newspaper,
  Package,
  ReceiptText,
  Scale,
  Users,
  Wallet,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { UserRole } from "../../types/user-types"

export type AdminNavItem = {
  label: string
  to: string
  icon: LucideIcon
  roles: UserRole[]
  /** O módulo: vira um item da barra de cima, e os itens dele a barra de baixo. */
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
  {
    label: "Notícias",
    to: "/admin/comunicacao/noticias",
    icon: Newspaper,
    roles: ["admin", "communication"],
    group: "Comunicação",
  },
  {
    label: "Certificados",
    to: "/admin/comunicacao/certificados",
    icon: Award,
    roles: ["admin", "communication"],
    group: "Comunicação",
  },
  // A Administração também alcança o painel do voluntariado, porque é ela quem
  // apresenta o sistema inteiro e precisa ver o que o voluntário vê.
  {
    label: "Meu painel",
    to: "/voluntario/painel",
    icon: HandHeart,
    roles: ["volunteer", "admin"],
    group: "Voluntariado",
    end: true,
  },
]

export type AdminNavGroup = {
  group: string
  icon: LucideIcon
  items: AdminNavItem[]
}

// O ícone do módulo na barra de cima. Módulo de uma tela só usa o da própria
// tela, porque ali o módulo e a tela são a mesma coisa.
const GROUP_ICON: Record<string, LucideIcon> = {
  Início: LayoutDashboard,
  Financeiro: Wallet,
  Comunicação: Megaphone,
  Voluntariado: HandHeart,
}

export function navFor(role: UserRole): AdminNavGroup[] {
  const allowed = ADMIN_NAV.filter((item) => item.roles.includes(role))
  const groups: AdminNavGroup[] = []

  for (const item of allowed) {
    const existing = groups.find((entry) => entry.group === item.group)

    if (existing) {
      existing.items.push(item)
    } else {
      groups.push({ group: item.group, icon: GROUP_ICON[item.group] ?? item.icon, items: [item] })
    }
  }

  return groups
}

// Em que módulo a pessoa está. A tela de edição de certificado mora abaixo do
// caminho da lista, então casar por prefixo mantém o módulo aceso nela também.
export function activeGroup(groups: AdminNavGroup[], pathname: string): AdminNavGroup | null {
  return (
    groups.find((group) =>
      group.items.some((item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`))),
    ) ?? null
  )
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
