import { ExternalLink, LogOut, Menu, X } from "lucide-react"
import { Suspense, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { activeGroup, navFor } from "../components/admin/admin-nav"
import { Logo } from "../components/layout/logo"
import { Skeleton } from "../components/ui/states"
import { useSession } from "../hooks/use-session"
import { ROLE_LABEL } from "../types/user-types"
import { cn } from "../utils/cn"

// Layout de propósito diferente do público: densidade alta, foco em tarefa. O
// site institucional é para ler e decidir doar; isto é para trabalhar, e as
// duas coisas não pedem a mesma tela.
//
// A navegação é horizontal e tem dois andares. Em cima ficam os módulos
// (Início, Financeiro, Comunicação, Voluntariado); embaixo, as telas do módulo
// em que a pessoa está. A largura inteira fica para as tabelas, que são o que
// mais precisa de espaço aqui, e quem trabalha num módulo só vê as abas dele em
// vez de uma coluna com todas as telas do sistema.

const MODULE =
  "inline-flex min-h-11 items-center gap-2 rounded-pill px-4 font-display text-sm font-bold whitespace-nowrap transition-colors"

const TAB =
  "inline-flex min-h-12 items-center gap-2 border-b-[3px] px-1 font-display text-sm font-bold whitespace-nowrap transition-colors"

export default function AdminLayout() {
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // O layout só é montado dentro de um `RequireRole`, então `user` existe. O
  // guarda evita um `?` espalhado por todo o arquivo.
  if (!user) return null

  const groups = navFor(user.role)
  const current = activeGroup(groups, pathname)

  function handleSignOut() {
    signOut()
    navigate("/entrar", { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface-muted">
      <a
        href="#painel"
        className="sr-only rounded-pill focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:px-5 focus:py-3 focus:font-display focus:font-bold focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center gap-4 px-5 sm:px-8">
          <Logo to="/admin" alt="Somos do Bem, painel" className="h-9 shrink-0" />

          <nav aria-label="Módulos do painel" className="hidden min-w-0 flex-1 lg:block">
            <ul className="flex items-center gap-1">
              {groups.map((group) => {
                const selected = current?.group === group.group
                const label = group.items.length === 1 ? group.items[0].label : group.group

                return (
                  <li key={group.group}>
                    {/* `Link`, e não `NavLink`: o módulo aponta para a primeira tela
                        dele, mas fica aceso em qualquer uma, e o `NavLink` só
                        marcaria a primeira. */}
                    <Link
                      to={group.items[0].to}
                      aria-current={selected ? "page" : undefined}
                      className={cn(
                        MODULE,
                        selected ? "bg-primary text-white" : "text-ink hover:bg-surface-muted",
                      )}
                    >
                      <group.icon className="size-4 shrink-0" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden min-w-0 text-right xl:block">
              <p className="truncate font-display text-sm font-bold">{user.name}</p>
              <p className="truncate text-xs text-ink-soft">{ROLE_LABEL[user.role]}</p>
            </div>

            <Link
              to="/"
              className="hidden min-h-11 items-center gap-2 rounded-pill px-3 text-sm font-semibold text-ink-soft hover:bg-surface-muted hover:text-ink sm:inline-flex"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden md:inline">Ver o site</span>
              <span className="sr-only md:hidden">Ver o site público</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="hidden min-h-11 items-center gap-2 rounded-pill px-3 text-sm font-semibold text-primary hover:bg-primary-soft lg:inline-flex"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </button>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="menu-painel"
              className="inline-flex size-11 items-center justify-center rounded-tile border border-line lg:hidden"
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
              <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
            </button>
          </div>
        </div>

        {/* O segundo andar só existe quando o módulo tem mais de uma tela: aba
            sozinha não é escolha, é ruído. */}
        {current && current.items.length > 1 && (
          <nav aria-label={`Telas de ${current.group}`} className="hidden border-t border-line lg:block">
            <ul className="mx-auto flex w-full max-w-[90rem] items-center gap-6 px-5 sm:px-8">
              {current.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(TAB, isActive ? "border-primary text-primary" : "border-transparent text-ink-soft hover:text-ink")
                    }
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div id="menu-painel" hidden={!open} className="max-h-[75vh] overflow-y-auto border-t border-line bg-surface px-5 py-5 lg:hidden">
          <nav aria-label="Seções do painel" className="flex flex-col gap-6">
            {groups.map((group) => (
              <div key={group.group}>
                <p className="px-3 font-display text-xs font-bold tracking-[0.16em] text-ink-soft uppercase">{group.group}</p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      {/* Trocar de tela fecha o menu: ele cobre o conteúdo, e deixá-lo
                          aberto obrigaria um segundo toque para ver o que se pediu. */}
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex min-h-11 items-center gap-3 rounded-tile px-3 py-2 text-sm font-semibold transition-colors",
                            isActive ? "bg-primary text-white" : "text-ink hover:bg-surface-muted",
                          )
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

            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold">{user.name}</p>
                <p className="truncate text-xs text-ink-soft">{ROLE_LABEL[user.role]}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-tile px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sair
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main id="painel" className="mx-auto w-full max-w-[90rem] min-w-0 flex-1 px-5 py-8 sm:px-8 lg:py-10">
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
      </main>
    </div>
  )
}
