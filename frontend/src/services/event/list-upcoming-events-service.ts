import type { Event } from "../../types/event-types"

// PROVISÓRIO — a rota `GET /event/list` existe no backend, mas ainda não filtra
// "próximos" nem devolve o recorte que a home usa. Enquanto isso o dado mora
// aqui, isolado, e nunca no JSX: quando a chamada real entrar, só este arquivo
// muda e a home continua igual.
const PLACEHOLDER: Event[] = [
  {
    id: "1",
    campaign_id: null,
    title: "6ª edição do Chefs do Bem",
    slug: "chefs-do-bem-6a-edicao",
    description:
      "Três noites de jantar beneficente com chefs convidados de Indaiatuba. Toda a renda sustenta o Ambulatório.",
    location: "Espaço Viber, Indaiatuba",
    starts_at: "2026-08-21T19:00:00.000Z",
    ends_at: "2026-08-23T23:00:00.000Z",
    ticket_price: "120.00",
    capacity: 300,
    taken_seats: 214,
    status: "published",
    image: null, // "/imagens/eventos/chefs-do-bem-6a-edicao.jpg"
  },
  {
    id: "2",
    campaign_id: null,
    title: "Chocolate do Bem 2026",
    slug: "chocolate-do-bem-2026",
    description:
      "A campanha de Páscoa que já virou tradição na cidade. Cada caixa vendida vira material da Escola de Educação Especial.",
    location: "Alameda da Criança, 100",
    starts_at: "2026-03-14T13:00:00.000Z",
    ends_at: null,
    ticket_price: "45.00",
    capacity: null,
    taken_seats: 0,
    status: "published",
    image: null, // "/imagens/eventos/chocolate-do-bem-2026.jpg"
  },
  {
    id: "3",
    campaign_id: null,
    title: "Dia de Portas Abertas",
    slug: "dia-de-portas-abertas",
    description:
      "Visita guiada pelo Ambulatório e pela Oficina Terapêutica, com as famílias contando o que muda no dia a dia.",
    location: "Escola e Oficina, Indaiatuba",
    starts_at: "2026-05-09T09:00:00.000Z",
    ends_at: "2026-05-09T12:00:00.000Z",
    ticket_price: "0.00",
    capacity: 80,
    taken_seats: 31,
    status: "published",
    image: null, // "/imagens/eventos/dia-de-portas-abertas.jpg"
  },
]

export async function listUpcomingEvents(limit = 3): Promise<Event[]> {
  return PLACEHOLDER.slice(0, limit)
}
