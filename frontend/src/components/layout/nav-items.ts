export type NavLink = {
  label: string
  to: string
}

export type NavItem = {
  label: string
  to?: string
  children?: NavLink[]
}

// A navegação do site atual é mantida inteira: quem já conhece a ONG precisa
// continuar se orientando. Eventos, Voluntariado e Loja entram como abas de
// primeiro nível porque são as três coisas que a ONG pediu e que hoje não
// existem; o que é leitura e transparência entra no dropdown Institucional,
// que já é onde o visitante procura esse tipo de conteúdo.
export const MAIN_NAV: NavItem[] = [
  { label: "Home", to: "/" },
  {
    label: "Institucional",
    children: [
      { label: "Quem somos", to: "/institucional" },
      { label: "Diretoria", to: "/diretoria" },
      { label: "Conselho", to: "/conselho" },
      { label: "Transparência", to: "/transparencia" },
      { label: "Painel de Impacto", to: "/impacto" },
      { label: "Verificar documento", to: "/recibo/verificar" },
    ],
  },
  { label: "Notícias", to: "/noticias" },
  { label: "Eventos", to: "/eventos" },
  { label: "Parceiros", to: "/parceiros" },
  { label: "Voluntariado", to: "/voluntariado" },
  { label: "Loja", to: "/loja" },
  {
    label: "Contato",
    children: [
      { label: "Fale conosco", to: "/fale-conosco" },
      { label: "Ouvidoria", to: "/ouvidoria" },
      { label: "Trabalhe conosco", to: "/trabalhe-conosco" },
    ],
  },
]

// Barra fina acima do menu principal. Existe para o menu principal caber em
// 1024px sem encolher nome de página nem esconder transparência.
export const UTILITY_NAV: NavLink[] = [
  { label: "Transparência", to: "/transparencia" },
  { label: "Verificar documento", to: "/recibo/verificar" },
  { label: "Perguntas Frequentes", to: "/perguntas-frequentes" },
]
