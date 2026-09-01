import { Route, Routes } from "react-router-dom"
import { ScrollToTop } from "./components/layout/scroll-to-top"
import PublicLayout from "./layouts/public-layout"
import ComingSoonPage from "./pages/public/coming-soon-page"
import HomePage from "./pages/public/home-page"
import NotFoundPage from "./pages/public/not-found-page"

// Único lugar com a árvore de rotas em pt-BR: 
// id numérico nunca aparece em URL pública 
// conteúdo publicado é :slug,
// documento verificável é :hash, assinatura é :token.
// As telas que ainda não existem já respondem no caminho definitivo
const SOON: { path: string; title: string; description: string; phase: string }[] = [
  { path: "/institucional", title: "Quem somos", description: "A história, a missão e o trabalho da associação em Indaiatuba.", phase: "fase 2" },
  { path: "/diretoria", title: "Diretoria", description: "Quem responde pela associação e por quanto tempo.", phase: "fase 2" },
  { path: "/conselho", title: "Conselho", description: "A composição do conselho fiscal e consultivo.", phase: "fase 2" },
  { path: "/transparencia", title: "Transparência", description: "Estatuto, CEBAS, balanços e prestação de contas, organizados por categoria.", phase: "fase 2" },
  { path: "/impacto", title: "Painel de Impacto", description: "Arrecadação, pessoas atendidas e voluntários ativos em tempo real.", phase: "fase 2" },
  { path: "/recibo/verificar", title: "Verificar documento", description: "Confira a autenticidade de um recibo ou certificado pelo código ou pelo QR.", phase: "fase 2" },
  { path: "/perguntas-frequentes", title: "Perguntas frequentes", description: "As dúvidas mais comuns sobre doação, voluntariado e atendimento.", phase: "fase 2" },
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
  { path: "/fale-conosco", title: "Fale conosco", description: "Canal direto com a associação.", phase: "fase 2" },
  { path: "/ouvidoria", title: "Ouvidoria", description: "Canal de manifestações, elogios e denúncias.", phase: "fase 2" },
  { path: "/trabalhe-conosco", title: "Trabalhe conosco", description: "Vagas e banco de currículos.", phase: "fase 2" },
  { path: "/politica-de-privacidade", title: "Política de Privacidade", description: "Como a associação trata os dados de quem doa e se cadastra.", phase: "fase 2" },
]

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />

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
