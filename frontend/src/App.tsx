import { lazy } from "react"
import { Route, Routes } from "react-router-dom"
import { ScrollToTop } from "./components/layout/scroll-to-top"
import PublicLayout from "./layouts/public-layout"
import ComingSoonPage from "./pages/public/coming-soon-page"
import HomePage from "./pages/public/home-page"
import NotFoundPage from "./pages/public/not-found-page"

// A home e as duas telas curtas ficam no pacote de entrada, porque são o que a
// maioria das visitas carrega. Toda página interna vem em pedaço próprio: quem
// entra pela home não deve baixar o código da ouvidoria junto. O `Suspense` que
// segura a troca está no `public-layout`, envolvendo o `Outlet`.
const AboutPage = lazy(() => import("./pages/public/about-page"))
const BoardPage = lazy(() => import("./pages/public/board-page"))
const ContactPage = lazy(() => import("./pages/public/contact-page"))
const CouncilPage = lazy(() => import("./pages/public/council-page"))
const FaqPage = lazy(() => import("./pages/public/faq-page"))
const ImpactPage = lazy(() => import("./pages/public/impact-page"))
const OmbudsmanPage = lazy(() => import("./pages/public/ombudsman-page"))
const PrivacyPage = lazy(() => import("./pages/public/privacy-page"))
const TransparencyPage = lazy(() => import("./pages/public/transparency-page"))
const VerifyReceiptPage = lazy(() => import("./pages/public/verify-receipt-page"))
const WorkWithUsPage = lazy(() => import("./pages/public/work-with-us-page"))

// Único lugar com a árvore de rotas. Os caminhos são os do frontend-plan.md, em
// pt-BR: id numérico nunca aparece em URL pública — conteúdo publicado é :slug,
// documento verificável é :hash, assinatura é :token.
//
// As telas que ainda não existem já respondem no caminho definitivo, dizendo em
// que fase de goals.md elas entram.
const SOON: { path: string; title: string; description: string; phase: string }[] = [
  { path: "/noticias", title: "Notícias", description: "Tudo o que a associação publica, com filtro por categoria.", phase: "fase 3" },
  { path: "/noticias/:slug", title: "Notícia", description: "A publicação completa.", phase: "fase 3" },
  { path: "/eventos", title: "Eventos", description: "A agenda completa, com inscrição e convite por evento.", phase: "fase 3" },
  { path: "/eventos/:slug", title: "Evento", description: "Detalhe do evento, com convite.", phase: "fase 3" },
  { path: "/doe-agora", title: "Doe agora", description: "Doação livre ou destinada a uma necessidade específica da associação.", phase: "fase 4" },
  { path: "/pedido/:transacaoId/status", title: "Status do pedido", description: "Acompanhamento da confirmação do pagamento.", phase: "fase 4" },
  { path: "/assinaturas/gerenciar/:token", title: "Gerenciar doação recorrente", description: "Alterar ou cancelar a doação mensal sem precisar de login.", phase: "fase 4" },
  { path: "/loja", title: "Loja", description: "Produtos da associação: cada compra vira programa.", phase: "fase 5" },
  { path: "/loja/:produto", title: "Produto", description: "Detalhe do produto.", phase: "fase 5" },
  { path: "/voluntariado", title: "Voluntariado", description: "Como funciona o programa de voluntariado da associação.", phase: "fase 6" },
  { path: "/seja-voluntario", title: "Seja voluntário", description: "Cadastro por área, habilidade e disponibilidade.", phase: "fase 6" },
  { path: "/parceiros", title: "Parceiros", description: "As empresas que sustentam os programas e o acesso ao portal do parceiro.", phase: "fase 8" },
  { path: "/entrar", title: "Entrar", description: "Acesso da equipe, dos voluntários e dos parceiros.", phase: "fase 7" },
]

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />

          <Route path="/institucional" element={<AboutPage />} />
          <Route path="/diretoria" element={<BoardPage />} />
          <Route path="/conselho" element={<CouncilPage />} />
          <Route path="/transparencia" element={<TransparencyPage />} />
          <Route path="/impacto" element={<ImpactPage />} />
          <Route path="/recibo/verificar" element={<VerifyReceiptPage />} />
          <Route path="/perguntas-frequentes" element={<FaqPage />} />

          <Route path="/fale-conosco" element={<ContactPage />} />
          <Route path="/ouvidoria" element={<OmbudsmanPage />} />
          <Route path="/trabalhe-conosco" element={<WorkWithUsPage />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPage />} />

          {SOON.map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={<ComingSoonPage title={page.title} description={page.description} phase={page.phase} />}
            />
          ))}

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
