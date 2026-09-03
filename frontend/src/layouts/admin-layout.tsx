import { ExternalLink, LogOut, Menu, X } from "lucide-react"
import { Suspense, useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { navFor } from "../components/admin/admin-nav"
import { Logo } from "../components/layout/logo"
import { Skeleton } from "../components/ui/states"
import { useSession } from "../hooks/use-session"
import { ROLE_LABEL } from "../types/user-types"
import { cn } from "../utils/cn"

// Layout de propósito diferente do público: menu lateral fixo, densidade alta,
// foco em tarefa. O site institucional é para ler e decidir doar; isto é para
// trabalhar, e as duas coisas não pedem a mesma tela.

const LINK = "flex min-h-11 items-center gap-3 rounded-tile px-3 py-2 text-sm font-semibold transition-colors"

export default function AdminLayout() {
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  // O layout só é montado dentro de um `RequireRole`, então `user` existe. O
  // guarda evita um `?` espalhado por todo o arquivo.
  if (!user) return null

  const groups = navFor(user.role)

  function handleSignOut() {
    signOut()
    navigate("/entrar", { replace: true })
  }

  const menu = (
    <nav aria-label="Seções do painel" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.group}>
          <p className="px-3 font-display text-xs font-bold tracking-[0.16em] text-ink-soft uppercase">
            {group.group}
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(LINK, isActive ? "bg-primary text-white" : "text-ink hover:bg-surface-muted")
                  }
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-dvh flex-col bg-surface-muted lg:flex-row">
      <a
        href="#painel"
        className="sr-only rounded-pill focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:px-5 focus:py-3 focus:font-display focus:font-bold focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3 lg:hidden">
        <Logo to="/admin" alt="Somos do Bem, painel" className="h-9" />

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="menu-painel"
          className="inline-flex size-11 items-center justify-center rounded-tile border border-line"
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
        </button>
      </header>

      <div
        id="menu-painel"
        hidden={!open}
        className="border-b border-line bg-surface px-5 py-5 lg:hidden"
      >
        {menu}
      </div>

      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-line bg-surface p-5 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="flex flex-col gap-8">
          <Logo to="/admin" alt="Somos do Bem, painel" className="h-10" />
          {menu}
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold">{user.name}</p>
            <p className="truncate text-xs text-ink-soft">{ROLE_LABEL[user.role]}</p>
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-primary"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Ver o site público
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-11 items-center gap-2 rounded-tile px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      <main id="painel" className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:py-10">
        <Suspense
          fallback={
            <div className="flex flex-col gap-4">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-96" />
              <Skeleton className="mt-4 h-64 w-full" />
            </div>
          }
        >
          <Outlet />
        </Suspense>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 lg:hidden">
          <p className="font-display text-sm font-bold">{user.name}</p>
          <p className="text-xs text-ink-soft">{ROLE_LABEL[user.role]}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-tile px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      </main>
    </div>
  )
}
