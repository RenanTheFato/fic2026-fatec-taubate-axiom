import { ChevronDown, Heart, Mail, Menu, Phone, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { NavLink as RouterNavLink, useLocation } from "react-router-dom"
import { cn } from "../../utils/cn"
import { ButtonLink } from "../ui/button"
import { Container } from "../ui/container"
import { Logo } from "./logo"
import { MAIN_NAV, UTILITY_NAV } from "./nav-items"
import type { NavItem, NavLink } from "./nav-items"

const LINK_BASE =
  "rounded-pill px-3 py-2 font-display text-[0.9375rem] font-bold transition-colors hover:text-primary"

function activeClasses({ isActive }: { isActive: boolean }) {
  return cn(LINK_BASE, isActive ? "text-primary" : "text-ink")
}

type DropdownProps = {
  label: string
  links: NavLink[]
}

function NavDropdown({ label, links }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("mousedown", onPointerDown)

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onPointerDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(LINK_BASE, "flex items-center gap-1", open ? "text-primary" : "text-ink")}
      >
        {label}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <ul className="absolute top-full left-0 z-50 mt-2 w-60 rounded-card border border-line bg-surface p-2 shadow-xl">
          {links.map((link) => (
            <li key={link.to}>
              <RouterNavLink
                to={link.to}
                className="block rounded-xl px-3 py-2.5 text-[0.9375rem] text-ink transition-colors hover:bg-primary-soft hover:text-primary"
              >
                {link.label}
              </RouterNavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function renderItem(item: NavItem) {
  if (item.children) return <NavDropdown key={item.label} label={item.label} links={item.children} />

  return (
    <RouterNavLink key={item.label} to={item.to ?? "/"} end={item.to === "/"} className={activeClasses}>
      {item.label}
    </RouterNavLink>
  )
}

type MobileMenuProps = {
  open: boolean
  onClose: () => void
}

function MobileMenu({ open, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div id="menu-principal" className="border-t border-line bg-surface lg:hidden">
      <Container className="max-h-[70vh] overflow-y-auto py-4">
        <ul className="flex flex-col gap-1">
          {MAIN_NAV.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <div className="py-2">
                  <p className="px-3 font-display text-xs font-bold tracking-[0.16em] text-ink-soft uppercase">
                    {item.label}
                  </p>
                  <ul className="mt-1">
                    {item.children.map((link) => (
                      <li key={link.to}>
                        <RouterNavLink
                          to={link.to}
                          onClick={onClose}
                          className="block rounded-xl px-3 py-3 text-base text-ink hover:bg-surface-muted"
                        >
                          {link.label}
                        </RouterNavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <RouterNavLink
                  to={item.to ?? "/"}
                  end={item.to === "/"}
                  onClick={onClose}
                  className="block rounded-xl px-3 py-3 font-display font-bold text-ink hover:bg-surface-muted"
                >
                  {item.label}
                </RouterNavLink>
              )}
            </li>
          ))}

          <li className="mt-2 border-t border-line pt-2">
            <ul>
              {UTILITY_NAV.map((link) => (
                <li key={link.to}>
                  <RouterNavLink
                    to={link.to}
                    onClick={onClose}
                    className="block rounded-xl px-3 py-3 text-base text-ink-soft hover:bg-surface-muted"
                  >
                    {link.label}
                  </RouterNavLink>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </Container>
    </div>
  )
}

export function SiteHeader() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8)

  // O menu guarda em que caminho foi aberto. Assim ele fecha sozinho ao navegar
  // sem precisar de um efeito sincronizando estado com a rota.
  const [menu, setMenu] = useState({ open: false, path: location.pathname })
  const menuOpen = menu.open && menu.path === location.pathname

  const openMenu = () => setMenu({ open: true, path: location.pathname })
  const closeMenu = () => setMenu({ open: false, path: location.pathname })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)

    window.addEventListener("scroll", onScroll, { passive: true })

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-surface/95 backdrop-blur transition-shadow",
        scrolled && "shadow-[0_1px_0_0_var(--color-line),0_8px_24px_-16px_rgba(0,0,0,0.35)]",
      )}
    >
      <div className="hidden bg-ink text-white lg:block">
        <Container className="flex items-center justify-between py-2 text-[0.8125rem]">
          <p className="flex items-center gap-4">
            <a href="tel:+551938018890" className="inline-flex items-center gap-2 hover:text-reward">
              <Phone className="size-4" aria-hidden="true" />
              (19) 3801-8890
            </a>
            <a href="mailto:contato@somosdobem.org.br" className="inline-flex items-center gap-2 hover:text-reward">
              <Mail className="size-4" aria-hidden="true" />
              contato@somosdobem.org.br
            </a>
          </p>

          <nav aria-label="Links institucionais">
            <ul className="flex items-center gap-5">
              {UTILITY_NAV.map((link) => (
                <li key={link.to}>
                  <RouterNavLink to={link.to} className="hover:text-reward">
                    {link.label}
                  </RouterNavLink>
                </li>
              ))}
              <li>
                <RouterNavLink to="/entrar" className="font-bold hover:text-reward">
                  Entrar
                </RouterNavLink>
              </li>
            </ul>
          </nav>
        </Container>
      </div>

      <Container className="flex items-center justify-between gap-4 py-3">
        <Logo />

        <nav aria-label="Navegação principal" className="hidden lg:block">
          <div className="flex items-center gap-1 xl:gap-2">{MAIN_NAV.map(renderItem)}</div>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink to="/doe-agora" size="md" className="hidden sm:inline-flex">
            <Heart className="size-5" aria-hidden="true" />
            Quero doar
          </ButtonLink>

          <button
            type="button"
            onClick={() => (menuOpen ? closeMenu() : openMenu())}
            aria-expanded={menuOpen}
            aria-controls="menu-principal"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            className="inline-flex size-11 items-center justify-center rounded-pill border-2 border-line text-ink lg:hidden"
          >
            {menuOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>
        </div>
      </Container>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </header>
  )
}
