import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import { RequireRole } from "./components/auth/require-role"
import { ScrollToTop } from "./components/layout/scroll-to-top"
import PublicLayout from "./layouts/public-layout"
import { PageFallback } from "./components/layout/page-fallback"
import HomePage from "./pages/public/home-page"
import NotFoundPage from "./pages/public/not-found-page"

// A home e as duas telas curtas ficam no pacote de entrada, porque são o que a
// maioria das visitas carrega. Toda página interna vem em pedaço próprio: quem
// entra pela home não deve baixar o código da ouvidoria junto. O `Suspense` que
// segura a troca está no `public-layout`, envolvendo o `Outlet`.
const AboutPage = lazy(() => import("./pages/public/about-page"))
const CampaignPage = lazy(() => import("./pages/public/campaign-page"))
const CertificatePage = lazy(() => import("./pages/public/certificate-page"))
const CampaignListPage = lazy(() => import("./pages/public/campaigns-page"))
const DonatePage = lazy(() => import("./pages/public/donate-page"))
const EventPage = lazy(() => import("./pages/public/event-page"))
const EventsPage = lazy(() => import("./pages/public/events-page"))
const NewsPage = lazy(() => import("./pages/public/news-page"))
const OrderStatusPage = lazy(() => import("./pages/public/order-status-page"))
const PartnersPage = lazy(() => import("./pages/public/partners-page"))
const PostPage = lazy(() => import("./pages/public/post-page"))
const ProductPage = lazy(() => import("./pages/public/product-page"))
const StorePage = lazy(() => import("./pages/public/store-page"))
const SubscriptionPage = lazy(() => import("./pages/public/subscription-page"))
const SupportersPage = lazy(() => import("./pages/public/supporters-page"))
const VolunteeringPage = lazy(() => import("./pages/public/volunteering-page"))
const VolunteerSignupPage = lazy(() => import("./pages/public/volunteer-signup-page"))
const LoginPage = lazy(() => import("./pages/public/login-page"))

// A metade privada sai inteira do pacote de entrada: quem visita o site para
// doar nunca baixa o painel financeiro, que é o maior bloco de código do
// projeto e não serve a ninguém de fora da associação.
const AdminLayout = lazy(() => import("./layouts/admin-layout"))
const AdminEventsPage = lazy(() => import("./pages/admin/admin-events-page"))
const CampaignsPage = lazy(() => import("./pages/admin/campaigns-page"))
const CertificateEditorPage = lazy(() => import("./pages/admin/certificate-editor-page"))
const CertificatesPage = lazy(() => import("./pages/admin/certificates-page"))
const DashboardPage = lazy(() => import("./pages/admin/dashboard-page"))
const DonorsPage = lazy(() => import("./pages/admin/donors-page"))
const PostsPage = lazy(() => import("./pages/admin/posts-page"))
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
// documento verificável é :hash, doação recorrente é :token.
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

        {/* O editor de certificado ocupa a tela inteira, como um editor de
            slides: fica fora da casca do painel, com a mesma checagem de papel
            da tela de certificados. */}
        <Route
          path="/admin/comunicacao/certificados/editor"
          element={
            <Suspense fallback={<PageFallback />}>
              <RequireRole roles={["admin", "communication"]}>
                <CertificateEditorPage />
              </RequireRole>
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
          <Route
            path="/admin/comunicacao/noticias"
            element={
              <RequireRole roles={["admin", "communication"]}>
                <PostsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/comunicacao/certificados"
            element={
              <RequireRole roles={["admin", "communication"]}>
                <CertificatesPage />
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
          <Route path="/certificado" element={<CertificatePage />} />
          <Route path="/certificado/:hash" element={<CertificatePage />} />
          <Route path="/perguntas-frequentes" element={<FaqPage />} />

          <Route path="/noticias" element={<NewsPage />} />
          <Route path="/noticias/:slug" element={<PostPage />} />

          <Route path="/eventos" element={<EventsPage />} />
          <Route path="/eventos/:slug" element={<EventPage />} />
          <Route path="/loja" element={<StorePage />} />
          <Route path="/loja/:produto" element={<ProductPage />} />
          <Route path="/doe-agora" element={<DonatePage />} />
          <Route path="/campanhas" element={<CampaignListPage />} />
          <Route path="/campanhas/:slug" element={<CampaignPage />} />
          <Route path="/mural-do-bem" element={<SupportersPage />} />
          <Route path="/pedido/:transacaoId/status" element={<OrderStatusPage />} />
          <Route path="/assinaturas/gerenciar/:token" element={<SubscriptionPage />} />

          <Route path="/parceiros" element={<PartnersPage />} />
          <Route path="/voluntariado" element={<VolunteeringPage />} />
          <Route path="/seja-voluntario" element={<VolunteerSignupPage />} />

          <Route path="/fale-conosco" element={<ContactPage />} />
          <Route path="/ouvidoria" element={<OmbudsmanPage />} />
          <Route path="/trabalhe-conosco" element={<WorkWithUsPage />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
