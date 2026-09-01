import { Outlet } from "react-router-dom"
import { ScrollProgress } from "../components/motion/scroll-progress"
import { MobileDonateBar } from "../components/layout/mobile-donate-bar"
import { SiteFooter } from "../components/layout/site-footer"
import { SiteHeader } from "../components/layout/site-header"

export default function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only rounded-pill focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:px-5 focus:py-3 focus:font-display focus:font-bold focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <ScrollProgress />
      <SiteHeader />

      <main id="conteudo" className="flex-1 pb-20 sm:pb-0">
        <Outlet />
      </main>

      <SiteFooter />
      <MobileDonateBar />
    </div>
  )
}
