import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import { RequireRole } from "./components/auth/require-role"
import { ScrollToTop } from "./components/layout/scroll-to-top"
import PublicLayout from "./layouts/public-layout"
import { PageFallback } from "./components/layout/page-fallback"
import ComingSoonPage from "./pages/public/coming-soon-page"
import HomePage from "./pages/public/home-page"
import NotFoundPage from "./pages/public/not-found-page"

// A home e as duas telas curtas ficam no pacote de entrada, porque são o que a
// maioria das visitas carrega. Toda página interna vem em pedaço próprio: quem
// entra pela home não deve baixar o código da ouvidoria junto. O `Suspense` que
// segura a troca está no `public-layout`, envolvendo o `Outlet`.
const AboutPage = lazy(() => import("./pages/public/about-page"))
const DonatePage = lazy(() => import("./pages/public/donate-page"))
const EventPage = lazy(() => import("./pages/public/event-page"))
const EventsPage = lazy(() => import("./pages/public/events-page"))
const OrderStatusPage = lazy(() => import("./pages/public/order-status-page"))
const ProductPage = lazy(() => import("./pages/public/product-page"))
const StorePage = lazy(() => import("./pages/public/store-page"))
const LoginPage = lazy(() => import("./pages/public/login-page"))

// A metade privada sai inteira do pacote de entrada: quem visita o site para
// doar nunca baixa o painel financeiro, que é o maior bloco de código do
// projeto e não serve a ninguém de fora da associação.
const AdminLayout = lazy(() => import("./layouts/admin-layout"))
const AdminEventsPage = lazy(() => import("./pages/admin/admin-events-page"))
const CampaignsPage = lazy(() => import("./pages/admin/campaigns-page"))
const DashboardPage = lazy(() => import("./pages/admin/dashboard-page"))
const DonorsPage = lazy(() => import("./pages/admin/donors-page"))
const ProductsPage = lazy(() => import("./pages/admin/products-page"))
const ReceiptsPage = lazy(() => import("./pages/admin/receipts-page"))
const ReconciliationPage = lazy(() => import("./pages/admin/reconciliation-page"))
const TransactionsPage = lazy(() => import("./pages/admin/transactions-page"))
const VolunteerPanelPage = lazy(() => import("./pages/volunteer/volunteer-panel-page"))
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
// pt-BR: id numérico nunca aparece em URL pública. Conteúdo publicado é :slug,
// documento verificável é :hash, assinatura é :token.
//
// As telas que ainda não existem já respondem no caminho definitivo, dizendo em
// que fase de goals.md elas entram.
const SOON: { path: string; title: string; description: string; phase: string }[] = [
  { path: "/noticias", title: "Notícias", description: "Tudo o que a associação publica, com filtro por categoria.", phase: "fase 3" },
  { path: "/noticias/:slug", title: "Notícia", description: "A publicação completa.", phase: "fase 3" },
  { path: "/assinaturas/gerenciar/:token", title: "Gerenciar doação recorrente", description: "Alterar ou cancelar a doação mensal sem precisar de login.", phase: "fase 4" },
  { path: "/voluntariado", title: "Voluntariado", description: "Como funciona o programa de voluntariado da associação.", phase: "fase 6" },
  { path: "/seja-voluntario", title: "Seja voluntário", description: "Cadastro por área, habilidade e disponibilidade.", phase: "fase 6" },
  { path: "/parceiros", title: "Parceiros", description: "As empresas que sustentam os programas e o acesso ao portal do parceiro.", phase: "fase 8" },
]

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* O login fica fora do PublicLayout: cabeçalho e rodapé do site só
            atrapalhariam uma tela cujo único trabalho é receber duas linhas. */}
        <Route
          path="/entrar"
          element={
            <Suspense fallback={<PageFallback />}>
              <LoginPage />
            </Suspense>
          }
        />

        {/* Área privada. O RequireRole envolve o layout inteiro, e não cada
            página: assim ninguém consegue ver a barra lateral sem ter passado
            pela checagem de papel. Cada módulo repete a checagem com o seu
            próprio conjunto, porque financeiro e comunicação não se alcançam. */}
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <RequireRole roles={["admin", "finance", "communication"]}>
                <AdminLayout />
              </RequireRole>
            </Suspense>
          }
        >
          <Route path="/admin" element={<DashboardPage />} />

          <Route
            path="/admin/financeiro/transacoes"
            element={
              <RequireRole roles={["admin", "finance"]}>
                <TransactionsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/financeiro/reconciliacao"
            element={
              <RequireRole roles={["admin", "finance"]}>
                <ReconciliationPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/financeiro/recibos"
            element={
              <RequireRole roles={["admin", "finance"]}>
                <ReceiptsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/financeiro/doadores"
            element={
              <RequireRole roles={["admin", "finance"]}>
                <DonorsPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/comunicacao/campanhas"
            element={
              <RequireRole roles={["admin", "communication"]}>
                <CampaignsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/comunicacao/eventos"
            element={
              <RequireRole roles={["admin", "communication"]}>
                <AdminEventsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/comunicacao/produtos"
            element={
              <RequireRole roles={["admin", "communication"]}>
                <ProductsPage />
              </RequireRole>
            }
          />
        </Route>

        {/* O voluntariado tem a sua própria porta na mesma casca. Ele não entra
            no bloco acima porque as telas de lá são de dinheiro e de catálogo, e
            um voluntário não alcança nenhuma das duas. A Administração entra nos
            dois porque é quem demonstra o sistema inteiro. */}
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <RequireRole roles={["volunteer", "admin"]}>
                <AdminLayout />
              </RequireRole>
            </Suspense>
          }
        >
          <Route path="/voluntario/painel" element={<VolunteerPanelPage />} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />

          <Route path="/institucional" element={<AboutPage />} />
          <Route path="/diretoria" element={<BoardPage />} />
          <Route path="/conselho" element={<CouncilPage />} />
          <Route path="/transparencia" element={<TransparencyPage />} />
          <Route path="/impacto" element={<ImpactPage />} />
          <Route path="/recibo/verificar" element={<VerifyReceiptPage />} />
          <Route path="/perguntas-frequentes" element={<FaqPage />} />

          <Route path="/eventos" element={<EventsPage />} />
          <Route path="/eventos/:slug" element={<EventPage />} />
          <Route path="/loja" element={<StorePage />} />
          <Route path="/loja/:produto" element={<ProductPage />} />
          <Route path="/doe-agora" element={<DonatePage />} />
          <Route path="/pedido/:transacaoId/status" element={<OrderStatusPage />} />

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
