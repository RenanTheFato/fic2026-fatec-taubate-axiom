import { SiFacebook, SiInstagram, SiYoutube } from "@icons-pack/react-simple-icons"
import { Mail, MapPin, Phone } from "lucide-react"
import type { ComponentType } from "react"
import { Link } from "react-router-dom"
import { Container } from "../ui/container"
import { Logo } from "./logo"

const SITE_LINKS = [
  { label: "Home", to: "/" },
  { label: "Institucional", to: "/institucional" },
  { label: "Parceiros", to: "/parceiros" },
  { label: "Notícias", to: "/noticias" },
  { label: "Eventos", to: "/eventos" },
  { label: "Perguntas Frequentes", to: "/perguntas-frequentes" },
  { label: "Transparência", to: "/transparencia" },
]

// O lucide não publica mais marca de terceiro (Facebook, Instagram, YouTube),
// então essas três — e só essas três — vêm do pacote Simple Icons.
const SOCIAL: { icon: ComponentType<{ className?: string }>; label: string; href: string }[] = [
  { icon: SiFacebook, label: "Facebook", href: "https://www.facebook.com/somosdobem.indaiatuba" },
  { icon: SiInstagram, label: "Instagram", href: "https://www.instagram.com/somosdobem.indaiatuba/" },
  { icon: SiYoutube, label: "YouTube", href: "https://www.youtube.com/@somosdobem.indaiatuba" },
]

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <Container className="grid gap-10 py-14 sm:py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Logo tone="light" className="h-16" />
          <p className="max-w-xs text-sm leading-relaxed text-white/75">
            Associação beneficente para pessoas com Deficiência Intelectual e/ou Múltipla de causa
            neurológica, em Indaiatuba.
          </p>
          <ul className="flex gap-3">
            {SOCIAL.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="inline-flex size-11 items-center justify-center rounded-pill border border-white/25 text-white transition-colors hover:border-reward hover:text-reward"
                >
                  <item.icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-labelledby="rodape-confira">
          <h2 id="rodape-confira" className="font-display text-lg font-bold text-white">
            Confira
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/75">
            {SITE_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-reward">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-lg font-bold text-white">Onde estamos</h2>
          <ul className="mt-4 flex flex-col gap-4 text-sm text-white/75">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-reward" aria-hidden="true" />
              <span>
                <strong className="block font-semibold text-white">Ambulatório e Administração</strong>
                Alameda da Criança, 100 — Vila Vitória I<br />
                Indaiatuba - SP, 13338-020
              </span>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-reward" aria-hidden="true" />
              <span>
                <strong className="block font-semibold text-white">Escola e Oficina</strong>
                Alameda Comendador Dr. Santoro Mirone Pimenta<br />
                Indaiatuba - SP, 13347-685
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold text-white">Fale com a gente</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-white/75">
            <li>
              <a href="tel:+551938018890" className="inline-flex items-center gap-3 hover:text-reward">
                <Phone className="size-5 text-reward" aria-hidden="true" />
                (19) 3801-8890
              </a>
            </li>
            <li>
              <a href="mailto:contato@somosdobem.org.br" className="inline-flex items-center gap-3 hover:text-reward">
                <Mail className="size-5 text-reward" aria-hidden="true" />
                contato@somosdobem.org.br
              </a>
            </li>
            <li className="pt-2">
              <Link to="/ouvidoria" className="hover:text-reward">
                Ouvidoria
              </Link>
            </li>
            <li>
              <Link to="/trabalhe-conosco" className="hover:text-reward">
                Trabalhe conosco
              </Link>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/15">
        <Container className="flex flex-col gap-2 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Somos do Bem — Associação Beneficente de Indaiatuba.</p>
          <Link to="/politica-de-privacidade" className="hover:text-reward">
            Política de Privacidade
          </Link>
        </Container>
      </div>
    </footer>
  )
}
