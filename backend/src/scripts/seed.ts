import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hash as hashPassword } from "bcryptjs";
import { QueryTypes } from "sequelize";
import { sequelize } from "../models/index.js";
import { Campaign } from "../models/campaign-model.js";
import { Donor } from "../models/donor-model.js";
import { Event } from "../models/event-model.js";
import { Product } from "../models/product-model.js";
import { Receipt } from "../models/receipt-model.js";
import { ReceiptSequence, RECEIPT_SEQUENCE_ID } from "../models/receipt-sequence-model.js";
import { Transaction } from "../models/transaction-model.js";
import { TransactionAuditLog } from "../models/transaction-audit-log-model.js";
import { TransactionItem } from "../models/transaction-item-model.js";
import { User } from "../models/user-model.js";
import { Post } from "../models/post-model.js";
import type { PostCategory, PostStatus } from "../models/post-model.js";
import { CertificateAsset } from "../models/certificate-asset-model.js";
import { CertificateDesign, folderKey } from "../models/certificate-design-model.js";
import type { CertificateScope, CertificateVariant } from "../models/certificate-design-model.js";
import { FACTORY_DESIGN, FACTORY_MESSAGE, FACTORY_MESSAGE_DESIGN, FACTORY_PALETTE, classicDesign } from "../utils/certificate-classic.js";
import type { ClassicOptions, ClassicSticker } from "../utils/certificate-classic.js";
import type { CertificateDesignSpec, CertificateElement, CertificateText } from "../utils/certificate-design.js";
import { readImageInfo } from "../utils/image-size.js";
import { buildReceiptHash, buildReceiptNumber, truncateToSecond } from "../utils/receipt-hash.js";
import type { PaymentMethod, TransactionStatus, TransactionType } from "../models/transaction-model.js";
import { Registration } from "../models/registration-model.js";
import { ContactMessage } from "../models/contact-message-model.js";
import type { ContactChannel, ContactStatus } from "../models/contact-message-model.js";
import { formatTicketCode, generateTicketCode } from "../utils/ticket-code.js";
import { Partner } from "../models/partner-model.js";
import type { PartnerInterest, PartnerStatus } from "../models/partner-model.js";
import { PartnerProposal } from "../models/partner-proposal-model.js";
import type { ProposalKind, ProposalStatus } from "../models/partner-proposal-model.js";
import { Volunteer } from "../models/volunteer-model.js";
import type { VolunteerArea, VolunteerPeriod, VolunteerStatus } from "../models/volunteer-model.js";
import { VolunteerShift } from "../models/volunteer-shift-model.js";
import { VolunteerAssignment } from "../models/volunteer-assignment-model.js";
import type { AssignmentStatus } from "../models/volunteer-assignment-model.js";
import { SocialPost } from "../models/social-post-model.js";
import type { SocialNetwork } from "../models/social-post-model.js";

// Carga de demonstração. Não é migration e não é fixture de teste: é o conteúdo com que a
// interface é avaliada, então precisa sair do banco com as mesmas invariantes que os serviços
// produzem em produção: arrecadação da campanha somada, vaga do evento debitada, estoque
// debitado e, sobretudo, a corrente de recibos encadeada de verdade.
//
// Por isso o recibo é montado com `buildReceiptHash`, o mesmo utilitário que a emissão real usa e
// que a verificação pública recalcula. Reescrever o algoritmo aqui produziria recibos que a tela
// `/recibo/verificar` classificaria como adulterados.
//
// O conteúdo institucional (campanhas, eventos, produtos) é o da ONG. Doador e pagamento são
// fictícios, porque dado pessoal real não entra em base de demonstração. As notícias novas falam
// dos programas reais sem inventar número: resultado de atendimento é dado que só a associação tem.
//
// As versões de certificado seguem a mesma regra da corrente: cada recibo grava a versão que valia
// na pasta mais específica no instante em que foi emitido, exatamente como a emissão real decide.

const PASSWORD = "Somos@2026"

const NOW = new Date("2026-10-08T12:00:00.000Z")

// Gerador determinístico: valores, datas e a distribuição entre os estados são os mesmos em toda
// execução, senão comparar duas rodadas do painel vira adivinhação. O que muda de uma rodada para
// a outra são os identificadores, e, por tabela, o hash dos recibos, que é calculado sobre o id da
// transação. Por isso o resumo no fim imprime os hashes: eles nascem novos a cada carga.
function createRandom(seed: number) {
  let state = seed

  return function random() {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const random = createRandom(20260903)

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]
}

function daysAgo(days: number, hour = 10) {
  const date = new Date(NOW)
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(hour, Math.floor(random() * 60), 0, 0)
  return date
}

function daysAhead(days: number, hour = 19) {
  const date = new Date(NOW)
  date.setUTCDate(date.getUTCDate() + days)
  date.setUTCHours(hour, 0, 0, 0)
  return date
}

function money(value: number) {
  return value.toFixed(2)
}

// As cargas acrescentadas depois da primeira (parceiros, voluntariado, redes sociais e a variação
// com mensagem do certificado) não sorteiam nada: uma chamada a mais ao `random()` deslocaria o
// sorteio de todas as transações, e a carga deixaria de ser a mesma de antes.
function fixedDaysAgo(days: number, hour = 13, minute = 0) {
  const date = new Date(NOW)
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(hour, minute, 0, 0)
  return date
}

// A escala do voluntariado é a exceção à data fixa: ela é contada a partir do dia em que a carga
// roda, no horário local, para o painel nunca abrir com todos os turnos já vencidos.
function fromToday(days: number, hour: number, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date
}

// Truncate ignora chave estrangeira, então a checagem é desligada só para a limpeza. A ordem
// continua sendo a das dependências para o dia em que isto virar DELETE.
async function wipe() {
  const tables = [
    "social_posts",
    "volunteer_assignments",
    "volunteer_shifts",
    "volunteers",
    "partner_proposals",
    "partners",
    "registrations",
    "contact_messages",
    "photos",
    "transaction_audit_logs",
    "receipts",
    "certificate_designs",
    "certificate_assets",
    "posts",
    "receipt_sequences",
    "transaction_items",
    "transactions",
    "donors",
    "events",
    "products",
    "campaigns",
    "users",
  ]

  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { type: QueryTypes.RAW })

  for (const table of tables) {
    await sequelize.query(`TRUNCATE TABLE \`${table}\``, { type: QueryTypes.RAW })
  }

  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { type: QueryTypes.RAW })
}

// Equipe

async function seedUsers() {
  const hashed = await hashPassword(PASSWORD, 10)

  const people = [
    { name: "Direção Somos do Bem", email: "admin@somosdobem.org.br", role: "admin" as const },
    { name: "Financeiro Somos do Bem", email: "financeiro@somosdobem.org.br", role: "finance" as const },
    { name: "Comunicação Somos do Bem", email: "comunicacao@somosdobem.org.br", role: "communication" as const },
    { name: "Ana Vieira", email: "voluntario@somosdobem.org.br", role: "volunteer" as const },
  ]

  return await User.bulkCreate(
    people.map((person) => ({ ...person, hashed_password: hashed })),
    { returning: true }
  )
}

// Campanhas: as três frentes que a associação sustenta, as duas edições do Natal do Bem (a de 2025
// encerrada, a de 2026 no ar), a Páscoa encerrada e uma em rascunho. A foto mora no banco agora:
// o caminho aponta para `frontend/public/imagens/`, que é de onde o site a serve.

async function seedCampaigns() {
  return await Campaign.bulkCreate([
    {
      title: "Ambulatório: atendimento contínuo",
      slug: "ambulatorio-atendimento-continuo",
      image_url: "/imagens/programa-ambulatorio.jpg",
      description:
        "O Ambulatório atende de forma clínica, terapêutica e de reabilitação, com acompanhamento contínuo da pessoa e da família. Esta campanha cobre o custo fixo da equipe e dos insumos ao longo do ano.",
      goal_amount: money(180000),
      starts_at: daysAgo(240, 9),
      ends_at: daysAhead(120, 23),
      status: "active",
    },
    {
      title: "Escola de Educação Especial",
      slug: "escola-de-educacao-especial",
      image_url: "/imagens/educacional.png",
      description:
        "Ensino adaptado ao ritmo de cada estudante, construído junto com a família. A campanha sustenta material pedagógico, transporte e a equipe docente.",
      goal_amount: money(240000),
      starts_at: daysAgo(210, 9),
      ends_at: daysAhead(150, 23),
      status: "active",
    },
    {
      title: "Oficina Terapêutica: autonomia e trabalho",
      slug: "oficina-terapeutica-autonomia-e-trabalho",
      image_url: "/imagens/oficina.jpeg",
      description:
        "Autonomia, convivência e trabalho protegido para jovens e adultos atendidos pela associação. A campanha cobre insumos das oficinas e acompanhamento profissional.",
      goal_amount: money(96000),
      starts_at: daysAgo(180, 9),
      ends_at: daysAhead(90, 23),
      status: "active",
    },
    {
      title: "Chocolate do Bem 2026",
      slug: "chocolate-do-bem-2026",
      image_url: "/imagens/eventos/chocolate-do-bem-2026.png",
      description:
        "A campanha de Páscoa que já virou tradição na cidade. Cada caixa vendida vira material da Escola de Educação Especial.",
      goal_amount: money(60000),
      starts_at: daysAgo(320, 9),
      ends_at: daysAgo(160, 23),
      status: "finished",
    },
    {
      title: "Reforma da sala de fisioterapia",
      slug: "reforma-da-sala-de-fisioterapia",
      description:
        "Adequação do piso, da iluminação e dos equipamentos da sala de fisioterapia do Ambulatório.",
      goal_amount: money(45000),
      starts_at: daysAhead(30, 9),
      ends_at: daysAhead(210, 23),
      status: "draft",
    },
    {
      title: "Natal do Bem 2026",
      slug: "natal-do-bem-2026",
      image_url: "/imagens/campanhas/natal-do-bem-2026.jpg",
      description:
        "O Natal das famílias atendidas pela associação: cestas, presentes escolhidos pelas próprias crianças e a ceia de fim de ano na sede. O que sobra da meta reforça o caixa dos três programas no começo do ano, quando a arrecadação mais cai.",
      goal_amount: money(120000),
      starts_at: daysAgo(20, 9),
      ends_at: daysAhead(77, 23),
      status: "active",
    },
    {
      title: "Natal do Bem 2025",
      slug: "natal-do-bem-2025",
      image_url: "/imagens/campanhas/natal-do-bem-2025.jpg",
      description:
        "A edição de 2025 do Natal do Bem, com cestas e presentes para as famílias atendidas pelo Ambulatório, pela Escola e pela Oficina Terapêutica.",
      goal_amount: money(90000),
      starts_at: daysAgo(341, 9),
      ends_at: daysAgo(288, 23),
      status: "finished",
    },
  ])
}

// Eventos: os que têm foto em `frontend/public/imagens/eventos/` levam o caminho em `image_url`

async function seedEvents(campaigns: Campaign[]) {
  const escola = campaigns.find((campaign) => campaign.slug === "escola-de-educacao-especial")
  const ambulatorio = campaigns.find((campaign) => campaign.slug === "ambulatorio-atendimento-continuo")
  const chocolate = campaigns.find((campaign) => campaign.slug === "chocolate-do-bem-2026")
  const natal2026 = campaigns.find((campaign) => campaign.slug === "natal-do-bem-2026")
  const natal2025 = campaigns.find((campaign) => campaign.slug === "natal-do-bem-2025")

  return await Event.bulkCreate([
    {
      campaign_id: ambulatorio?.id ?? null,
      title: "6ª edição do Chefs do Bem",
      slug: "chefs-do-bem-6a-edicao",
      image_url: "/imagens/eventos/chefs-do-bem-6a-edicao.png",
      description:
        "Três noites de jantar beneficente com chefs convidados de Indaiatuba. Cada noite tem um menu próprio, harmonização e leilão de experiências, e toda a renda sustenta o Ambulatório.",
      location: "Espaço Viber, Av. Presidente Kennedy, Indaiatuba",
      starts_at: daysAhead(42, 19),
      ends_at: daysAhead(44, 23),
      ticket_price: money(120),
      capacity: 300,
      status: "published",
    },
    {
      campaign_id: null,
      title: "Dia de Portas Abertas",
      slug: "dia-de-portas-abertas",
      image_url: "/imagens/eventos/dia-de-portas-abertas.jpg",
      description:
        "Visita guiada pelo Ambulatório e pela Oficina Terapêutica, com as famílias contando o que muda no dia a dia. Entrada gratuita, com inscrição para organizar os grupos.",
      location: "Sede da Somos do Bem, Indaiatuba",
      starts_at: daysAhead(19, 9),
      ends_at: daysAhead(19, 12),
      ticket_price: money(0),
      capacity: 80,
      status: "published",
    },
    {
      campaign_id: escola?.id ?? null,
      title: "Bazar Solidário de Primavera",
      slug: "bazar-solidario-de-primavera",
      description:
        "Dois dias de bazar com roupas, livros e artesanato produzido na Oficina Terapêutica. A renda vai para o material pedagógico da Escola.",
      location: "Salão de eventos da sede, Indaiatuba",
      starts_at: daysAhead(23, 9),
      ends_at: daysAhead(24, 17),
      ticket_price: money(0),
      capacity: 200,
      status: "published",
    },
    {
      campaign_id: null,
      title: "Jantar dos Parceiros 2026",
      slug: "jantar-dos-parceiros-2026",
      description:
        "Encontro anual com as empresas que sustentam os programas, com prestação de contas do ano e apresentação das metas do ano seguinte.",
      location: "Espaço Viber, Indaiatuba",
      starts_at: daysAhead(78, 20),
      ends_at: daysAhead(78, 23),
      ticket_price: money(250),
      capacity: 120,
      status: "published",
    },
    {
      campaign_id: ambulatorio?.id ?? null,
      title: "Corrida e Caminhada Somos do Bem",
      slug: "corrida-e-caminhada-somos-do-bem",
      description:
        "Percursos de 3 km e 8 km pelo Parque Ecológico, abertos a todas as idades. A inscrição inclui camiseta e chip de cronometragem.",
      location: "Parque Ecológico de Indaiatuba",
      starts_at: daysAhead(94, 7),
      ends_at: daysAhead(94, 12),
      ticket_price: money(60),
      capacity: 500,
      status: "published",
    },
    {
      campaign_id: chocolate?.id ?? null,
      title: "Chocolate do Bem 2026",
      slug: "chocolate-do-bem-2026",
      image_url: "/imagens/eventos/chocolate-do-bem-2026.png",
      description:
        "A campanha de Páscoa que já virou tradição na cidade. Cada caixa vendida vira material da Escola de Educação Especial.",
      location: "Alameda da Criança, 100, Indaiatuba",
      starts_at: daysAgo(173, 13),
      ends_at: daysAgo(166, 18),
      ticket_price: money(45),
      capacity: null,
      status: "finished",
    },
    {
      campaign_id: null,
      title: "Festa Junina do Bem 2026",
      slug: "festa-junina-do-bem-2026",
      description:
        "Quadrilha, comidas típicas e barracas conduzidas pelos jovens da Oficina Terapêutica, com as famílias atendidas pela associação.",
      location: "Sede da Somos do Bem, Indaiatuba",
      starts_at: daysAgo(82, 16),
      ends_at: daysAgo(82, 22),
      ticket_price: money(25),
      capacity: 400,
      status: "finished",
    },
    {
      campaign_id: null,
      title: "7ª edição do Chefs do Bem",
      slug: "chefs-do-bem-7a-edicao",
      description: "Edição de 2027, ainda em planejamento com os chefs convidados.",
      location: "A definir",
      starts_at: daysAhead(380, 19),
      ends_at: daysAhead(382, 23),
      ticket_price: money(130),
      capacity: 300,
      status: "draft",
    },
    {
      campaign_id: natal2026?.id ?? null,
      title: "Cantata de Natal do Bem 2026",
      slug: "cantata-de-natal-do-bem-2026",
      image_url: "/imagens/eventos/cantata-de-natal-2026.jpg",
      description:
        "O coral dos estudantes da Escola de Educação Especial e convidados da cidade numa noite de músicas de Natal. A renda dos convites entra no Natal do Bem 2026.",
      location: "Salão de eventos da sede, Indaiatuba",
      starts_at: daysAhead(65, 19),
      ends_at: daysAhead(65, 22),
      ticket_price: money(40),
      capacity: 250,
      status: "published",
    },
    {
      campaign_id: natal2025?.id ?? null,
      title: "Ceia Solidária de Natal 2025",
      slug: "ceia-solidaria-de-natal-2025",
      image_url: "/imagens/eventos/ceia-solidaria-de-natal-2025.jpg",
      description:
        "A ceia de fim de ano com as famílias atendidas, os voluntários e quem apoia a associação ao longo do ano.",
      location: "Sede da Somos do Bem, Indaiatuba",
      starts_at: daysAgo(299, 20),
      ends_at: daysAgo(299, 23),
      ticket_price: money(80),
      capacity: 180,
      status: "finished",
    },
  ])
}

// Loja: um produto esgotado e um inativo de propósito, porque as duas telas precisam ser vistas

async function seedProducts() {
  return await Product.bulkCreate([
    {
      name: "Camiseta Somos do Bem branca",
      sku: "SDB-CAM-BR",
      description:
        "Camiseta de algodão com a marca da associação bordada no peito. Modelagem unissex, do P ao GG.",
      price: money(59.9),
      stock: 42,
      active: true,
      activated_at: daysAgo(300),
    },
    {
      name: "Camiseta Somos do Bem preta",
      sku: "SDB-CAM-PR",
      description:
        "A mesma camiseta de algodão, na versão preta com a marca em turquesa. Modelagem unissex, do P ao GG.",
      price: money(59.9),
      stock: 27,
      active: true,
      activated_at: daysAgo(300),
    },
    {
      name: "Caneca Somos do Bem",
      sku: "SDB-CAN-350",
      description: "Caneca de cerâmica de 350 ml com o símbolo da associação. Pode ir ao micro-ondas.",
      price: money(39.9),
      stock: 63,
      active: true,
      activated_at: daysAgo(300),
    },
    {
      name: "Ecobag Somos do Bem",
      sku: "SDB-ECO-01",
      description:
        "Sacola de algodão cru costurada na Oficina Terapêutica. Cada peça é feita por um jovem do programa.",
      price: money(34.9),
      stock: 88,
      active: true,
      activated_at: daysAgo(240),
    },
    {
      name: "Caixa Chocolate do Bem de 500 g",
      sku: "SDB-CHO-500",
      description:
        "Bombons sortidos embalados pelos jovens da Oficina Terapêutica. Produção sob encomenda na Páscoa.",
      price: money(89.9),
      stock: 120,
      active: true,
      activated_at: daysAgo(200),
    },
    {
      name: "Kit Páscoa do Bem",
      sku: "SDB-KIT-PAS",
      description: "Caixa de 500 g, caneca e cartão escrito à mão pelos estudantes da Escola.",
      price: money(149.9),
      stock: 24,
      active: true,
      activated_at: daysAgo(200),
    },
    {
      name: "Chaveiro Símbolo",
      sku: "SDB-CHA-01",
      description: "Chaveiro de acrílico com o símbolo da associação, produzido na Oficina Terapêutica.",
      price: money(19.9),
      stock: 210,
      active: true,
      activated_at: daysAgo(160),
    },
    {
      name: "Agenda 2027 Somos do Bem",
      sku: "SDB-AGE-2027",
      description:
        "Agenda de mesa com ilustrações feitas pelos estudantes da Escola de Educação Especial.",
      price: money(64.9),
      stock: 0,
      active: true,
      activated_at: daysAgo(60),
    },
    {
      name: "Camiseta Chefs do Bem da 5ª edição",
      sku: "SDB-CAM-CHEF5",
      description: "Camiseta da edição de 2025 do Chefs do Bem. Fora de linha, mantida para histórico.",
      price: money(49.9),
      stock: 6,
      active: false,
      activated_at: null,
    },
  ])
}

// Doadores: nomes fictícios, porque dado pessoal real não entra em base de demonstração

const FIRST_NAMES = [
  "Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique",
  "Isabela", "João", "Larissa", "Marcelo", "Natália", "Otávio", "Patrícia", "Rafael",
  "Simone", "Thiago", "Vanessa", "William",
]

const LAST_NAMES = [
  "Almeida", "Barbosa", "Cardoso", "Duarte", "Esteves", "Ferreira", "Gomes",
  "Herrera", "Iglesias", "Junqueira", "Lima", "Moraes", "Nogueira", "Oliveira",
  "Pereira", "Queiroz", "Ramos", "Santos", "Teixeira", "Vasconcelos",
]

const COMPANIES = [
  "Mann + Hummel Brasil", "Cobreq Indústria", "Dayco do Brasil", "Sew Eurodrive",
  "Lógica Sistemas", "Power Fiber Telecom",
]

function buildDocument(digits: number) {
  let value = ""

  for (let index = 0; index < digits; index += 1) {
    value += String(Math.floor(random() * 10))
  }

  return value
}

async function seedDonors() {
  const rows: {
    name: string,
    email: string,
    document: string,
    document_type: "cpf" | "cnpj",
    phone: string,
  }[] = []

  const used = new Set<string>()

  while (rows.length < 44) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`

    if (used.has(name)) {
      continue
    }

    used.add(name)

    rows.push({
      name,
      email: `${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".")}@exemplo.com.br`,
      document: buildDocument(11),
      document_type: "cpf",
      phone: `19 9${buildDocument(4)}-${buildDocument(4)}`,
    })
  }

  for (const company of COMPANIES) {
    rows.push({
      name: company,
      email: `parcerias@${company.toLowerCase().replace(/[^a-z]+/g, "")}.com.br`,
      document: buildDocument(14),
      document_type: "cnpj",
      phone: `19 3${buildDocument(3)}-${buildDocument(4)}`,
    })
  }

  return await Donor.bulkCreate(rows)
}

// Transações: o coração da carga. Cada linha nasce com o efeito colateral que o serviço real
// produziria, e é por isso que arrecadação, vaga e estoque são acumulados aqui e escritos no fim.

type PlannedTransaction = {
  id: string,
  type: TransactionType,
  status: TransactionStatus,
  amount: string,
  payment_method: PaymentMethod | null,
  donor: Donor,
  campaign_id: string | null,
  event_id: string | null,
  public_recognition: boolean,
  created_at: Date,
  confirmed_at: Date | null,
  refunded_at: Date | null,
  notes: string | null,
  items: { product_id: string, description: string, quantity: number, unit_price: string }[],
}

const DONATION_AMOUNTS = [30, 50, 50, 75, 100, 100, 100, 150, 200, 250, 300, 500, 1000]

const SPONSORSHIP_AMOUNTS = [2500, 3000, 5000, 7500, 10000]

const PAYMENT_METHODS: PaymentMethod[] = ["pix", "credit_card", "debit_card", "boleto"]

// Quem marca a caixa do mural. A maioria marca, mas não todo mundo: o mural precisa mostrar que a
// escolha existe, e a contagem de "apoiou sem aparecer" precisa ter o que contar.
function consents(chance = 0.78) {
  return random() < chance
}

function between(from: Date, to: Date, hour: number) {
  const span = Math.max(to.getTime() - from.getTime(), 0)
  const date = new Date(from.getTime() + Math.floor(random() * span))
  date.setUTCHours(hour, Math.floor(random() * 60), 0, 0)
  return date
}

function plan(donors: Donor[], campaigns: Campaign[], events: Event[], products: Product[]) {
  const planned: PlannedTransaction[] = []

  const sellableEvents = events.filter((event) =>
    Number(event.ticket_price) > 0 && event.status !== "draft" && event.slug !== "cantata-de-natal-do-bem-2026" && event.slug !== "ceia-solidaria-de-natal-2025"
  )
  const sellableProducts = products.filter((product) => product.active && product.stock > 0)
  const individuals = donors.filter((donor) => donor.document_type === "cpf")
  const companies = donors.filter((donor) => donor.document_type === "cnpj")

  // Uma doação destinada só cai numa campanha que estava aberta naquele dia. Sem isso, a carga
  // produzia doação para o Natal de 2026 feita em março, e o certificado dela sairia com a roupa de
  // uma versão que ainda não existia.
  function campaignOpenAt(date: Date) {
    const open = campaigns.filter((campaign) =>
      (campaign.status === "active" || campaign.status === "finished")
      && campaign.starts_at <= date
      && (!campaign.ends_at || campaign.ends_at >= date)
    )

    return open.length > 0 ? pick(open) : null
  }

  // Doações avulsas ao longo de doze meses. A maioria confirma: é o caminho normal e é o que o
  // painel precisa mostrar. Os outros estados existem porque a tela de reconciliação é sobre eles.
  for (let index = 0; index < 58; index += 1) {
    const created = daysAgo(Math.floor(random() * 350) + 2, 8 + Math.floor(random() * 12))
    const roll = random()
    const status: TransactionStatus = roll < 0.76 ? "confirmed"
      : roll < 0.84 ? "pending"
        : roll < 0.9 ? "awaiting_confirmation"
          : roll < 0.96 ? "refused"
            : "cancelled"

    planned.push({
      id: randomUUID(),
      type: "donation",
      status,
      amount: money(pick(DONATION_AMOUNTS)),
      payment_method: status === "confirmed" ? pick(PAYMENT_METHODS) : null,
      donor: pick(individuals),
      campaign_id: random() < 0.75 ? campaignOpenAt(created)?.id ?? null : null,
      event_id: null,
      public_recognition: consents(),
      created_at: created,
      confirmed_at: null,
      refunded_at: null,
      notes: null,
      items: [],
    })
  }

  // Patrocínio de empresa: valor alto, sempre ligado a uma campanha aberta, e é o que sustenta o
  // custo fixo.
  for (let index = 0; index < 9; index += 1) {
    const created = daysAgo(Math.floor(random() * 330) + 10, 14)
    const campaign = campaignOpenAt(created)

    if (!campaign) {
      continue
    }

    planned.push({
      id: randomUUID(),
      type: "sponsorship",
      status: random() < 0.85 ? "confirmed" : "pending",
      amount: money(pick(SPONSORSHIP_AMOUNTS)),
      payment_method: "boleto",
      donor: pick(companies),
      campaign_id: campaign.id,
      event_id: null,
      public_recognition: consents(0.9),
      created_at: created,
      confirmed_at: null,
      refunded_at: null,
      notes: "Patrocínio anual acordado com a empresa parceira",
      items: [],
    })
  }

  // Convites. Uma unidade por transação, porque é o que o backend debita hoje
  // (corrections.md, item E): a interface não expõe um seletor de quantidade por causa disso.
  for (let index = 0; index < 34; index += 1) {
    const event = pick(sellableEvents)
    const reference = new Date(event.starts_at)
    reference.setUTCDate(reference.getUTCDate() - (Math.floor(random() * 40) + 3))
    const created = reference > NOW ? daysAgo(Math.floor(random() * 25) + 1, 20) : reference

    planned.push({
      id: randomUUID(),
      type: "ticket",
      status: random() < 0.82 ? "confirmed" : random() < 0.6 ? "pending" : "refused",
      amount: money(Number(event.ticket_price)),
      payment_method: pick(PAYMENT_METHODS),
      donor: pick(individuals),
      campaign_id: event.campaign_id,
      event_id: event.id,
      public_recognition: consents(),
      created_at: created,
      confirmed_at: null,
      refunded_at: null,
      notes: null,
      items: [],
    })
  }

  // O Natal do Bem. As duas edições ganham doação, patrocínio e convite dentro da própria janela,
  // porque são elas que demonstram o mural da campanha e o histórico de certificados: a de 2025 já
  // atravessou duas versões de certificado, e a de 2026 está na primeira.
  const christmas = [
    { campaign: "natal-do-bem-2025", event: "ceia-solidaria-de-natal-2025", donations: 22, tickets: 14 },
    { campaign: "natal-do-bem-2026", event: "cantata-de-natal-do-bem-2026", donations: 12, tickets: 7 },
  ]

  for (const edition of christmas) {
    const campaign = campaigns.find((item) => item.slug === edition.campaign) as Campaign
    const event = events.find((item) => item.slug === edition.event) as Event
    const closes = campaign.ends_at && campaign.ends_at < NOW ? campaign.ends_at : daysAgo(1, 9)

    for (let index = 0; index < edition.donations; index += 1) {
      const created = between(campaign.starts_at, closes, 9 + Math.floor(random() * 12))

      planned.push({
        id: randomUUID(),
        type: "donation",
        status: random() < 0.9 ? "confirmed" : "pending",
        amount: money(pick(DONATION_AMOUNTS)),
        payment_method: pick(PAYMENT_METHODS),
        donor: pick(individuals),
        campaign_id: campaign.id,
        event_id: null,
        public_recognition: consents(),
        created_at: created,
        confirmed_at: null,
        refunded_at: null,
        notes: null,
        items: [],
      })
    }

    planned.push({
      id: randomUUID(),
      type: "sponsorship",
      status: "confirmed",
      amount: money(pick(SPONSORSHIP_AMOUNTS)),
      payment_method: "boleto",
      donor: pick(companies),
      campaign_id: campaign.id,
      event_id: null,
      public_recognition: true,
      created_at: between(campaign.starts_at, closes, 14),
      confirmed_at: null,
      refunded_at: null,
      notes: "Patrocínio do Natal do Bem",
      items: [],
    })

    const ticketsClose = event.starts_at < closes ? event.starts_at : closes

    for (let index = 0; index < edition.tickets; index += 1) {
      planned.push({
        id: randomUUID(),
        type: "ticket",
        status: random() < 0.88 ? "confirmed" : "pending",
        amount: money(Number(event.ticket_price)),
        payment_method: pick(PAYMENT_METHODS),
        donor: pick(individuals),
        campaign_id: campaign.id,
        event_id: event.id,
        public_recognition: consents(),
        created_at: between(campaign.starts_at, ticketsClose, 19),
        confirmed_at: null,
        refunded_at: null,
        notes: null,
        items: [],
      })
    }
  }

  // Compras da loja. O valor da transação é a soma dos itens pelo preço de tabela, nunca um
  // valor mandado de fora, que é o defeito que o backend já corrigiu.
  for (let index = 0; index < 27; index += 1) {
    const lines = random() < 0.65 ? 1 : 2
    const chosen = new Set<Product>()

    while (chosen.size < lines) {
      chosen.add(pick(sellableProducts))
    }

    const items = [...chosen].map((product) => ({
      product_id: product.id,
      description: product.name,
      quantity: random() < 0.8 ? 1 : 2,
      unit_price: product.price,
    }))

    const total = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0)
    const roll = random()

    planned.push({
      id: randomUUID(),
      type: "product",
      status: roll < 0.78 ? "confirmed" : roll < 0.9 ? "pending" : "cancelled",
      amount: money(total),
      payment_method: pick(PAYMENT_METHODS),
      donor: pick(individuals),
      campaign_id: null,
      event_id: null,
      public_recognition: consents(0.6),
      created_at: daysAgo(Math.floor(random() * 300) + 2, 15),
      confirmed_at: null,
      refunded_at: null,
      notes: null,
      items,
    })
  }

  // A confirmação acontece perto da criação, nunca antes dela.
  for (const transaction of planned) {
    if (transaction.status === "confirmed") {
      const confirmed = new Date(transaction.created_at)
      confirmed.setUTCMinutes(confirmed.getUTCMinutes() + Math.floor(random() * 90) + 2)
      transaction.confirmed_at = confirmed
    }
  }

  planned.sort((left, right) => left.created_at.getTime() - right.created_at.getTime())

  // Três estornos entre os mais antigos: o painel financeiro precisa de linha estornada, e a
  // verificação pública precisa de um recibo autêntico e cancelado, que é um desfecho próprio.
  const refundable = planned.filter((transaction) => transaction.status === "confirmed").slice(0, 14)

  for (const index of [2, 6, 11]) {
    const target = refundable[index]

    if (!target) {
      continue
    }

    const refunded = new Date(target.confirmed_at ?? target.created_at)
    refunded.setUTCDate(refunded.getUTCDate() + Math.floor(random() * 20) + 3)
    target.refunded_at = refunded
    target.notes = "Estorno solicitado pelo doador"
  }

  // Uma transação pendente sem checkout_url, que é o órfão descrito em corrections.md item F e a
  // razão de existir a tela de reconciliação. Sem ela, a tela não teria o que mostrar.
  const orphan = planned.find((transaction) => transaction.status === "pending")

  if (orphan) {
    orphan.notes = "Falha de rede na criação do checkout"
  }

  return planned
}

async function seedTransactions(planned: PlannedTransaction[]) {
  await Transaction.bulkCreate(planned.map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    // O estorno reverte os efeitos e marca a linha; a confirmação que veio antes dele continua
    // registrada no log de auditoria, não no status.
    status: transaction.refunded_at ? "refunded" as const : transaction.status,
    amount: transaction.amount,
    payment_method: transaction.payment_method,
    donor_id: transaction.donor.id,
    campaign_id: transaction.campaign_id,
    event_id: transaction.event_id,
    public_recognition: transaction.public_recognition,
    gateway_checkout_id: transaction.notes === "Falha de rede na criação do checkout"
      ? null
      : `cs_test_${transaction.id.replace(/-/g, "").slice(0, 24)}`,
    gateway_payment_id: transaction.confirmed_at
      ? `pi_test_${transaction.id.replace(/-/g, "").slice(0, 24)}`
      : null,
    checkout_url: transaction.notes === "Falha de rede na criação do checkout"
      ? null
      : `https://checkout.stripe.com/c/pay/cs_test_${transaction.id.replace(/-/g, "").slice(0, 24)}`,
    notes: transaction.notes,
    confirmed_at: transaction.confirmed_at,
    refunded_at: transaction.refunded_at,
    created_at: transaction.created_at,
    updated_at: transaction.refunded_at ?? transaction.confirmed_at ?? transaction.created_at,
  })))

  const items = planned.flatMap((transaction) => transaction.items.map((item) => ({
    transaction_id: transaction.id,
    product_id: item.product_id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    created_at: transaction.created_at,
    updated_at: transaction.created_at,
  })))

  if (items.length > 0) {
    await TransactionItem.bulkCreate(items)
  }
}

// Biblioteca de imagens do certificado. Os arquivos moram em `src/assets/certificate/` e foram
// compostos a partir dos ícones do lucide, a mesma família de ícones do site.

const ASSET_FILES: { key: string, name: string, file: string }[] = [
  { key: "estrela", name: "Estrela dourada", file: "natal-estrela.png" },
  { key: "presente", name: "Presente vermelho", file: "natal-presente.png" },
  { key: "arvore", name: "Árvore de Natal", file: "natal-arvore.png" },
  { key: "sino", name: "Sino de Natal", file: "natal-sino.png" },
  { key: "bengala", name: "Bengala doce", file: "natal-bengala.png" },
  { key: "floco", name: "Floco de neve", file: "natal-floco.png" },
  { key: "neve", name: "Fundo de neve", file: "natal-fundo-neve.png" },
  { key: "ovo", name: "Ovo de Páscoa", file: "pascoa-ovo.png" },
  { key: "coelho", name: "Coelho de Páscoa", file: "pascoa-coelho.png" },
  { key: "chapeu", name: "Chapéu de chef", file: "chefs-chapeu.png" },
  { key: "talheres", name: "Talheres cruzados", file: "chefs-talheres.png" },
  { key: "coracao", name: "Coração", file: "coracao.png" },
]

async function seedAssets(uploadedBy: string) {
  const rows = ASSET_FILES.map((asset, index) => {
    const data = readFileSync(resolve(process.cwd(), "src/assets/certificate", asset.file))
    const info = readImageInfo(data)

    if (!info) {
      throw new Error(`${asset.file} is not a PNG or JPEG`)
    }

    return {
      name: asset.name,
      mime_type: info.mime_type,
      width: info.width,
      height: info.height,
      size: data.length,
      data,
      uploaded_by: uploadedBy,
      created_at: daysAgo(430 - index, 10),
      updated_at: daysAgo(430 - index, 10),
    }
  })

  const created = await CertificateAsset.bulkCreate(rows)

  return new Map(ASSET_FILES.map((asset, index) => [asset.key, created[index].id]))
}

// A variação com mensagem de um desenho livre: o texto que carregava o valor passa a dizer o gesto
// sem o número, e nenhum outro elemento muda.
function withoutAmount(design: CertificateDesignSpec): CertificateDesignSpec {
  return {
    ...design,
    elements: design.elements.map((element) =>
      element.type === "text" && element.content.includes("{{valor}}")
        ? { ...element, content: element.content.replace("{{acao}} {{valor}}", "{{gesto}}") }
        : element
    ),
  }
}

// Versões de certificado. Cada pasta conta uma história: o modelo padrão mudou para as cores da
// marca; a Páscoa ganhou ovos e coelho; o Natal de 2025 nasceu vermelho e dourado e ganhou neve no
// meio da campanha; o de 2026 foi desenhado do zero no editor livre, com letra caligráfica e
// enfeites espalhados; o Chefs do Bem ganhou chapéu e talheres. A variação com mensagem no lugar do
// valor acompanha o modelo padrão desde o começo e foi personalizada no Natal de 2026; as outras
// pastas herdam a do modelo padrão.

type PlannedDesign = {
  scope: CertificateScope,
  target_id: string | null,
  // Ausente é a variação com valor, que era a única até a segunda existir.
  variant?: CertificateVariant,
  label: string,
  created_at: Date,
  design: CertificateDesignSpec,
}

function sticker(asset_id: string, x: number, y: number, size: number, rotation = 0, opacity = 1): ClassicSticker {
  return { asset_id, x, y, size, rotation, opacity }
}

const ELEMENT_BASE = { rotation: 0, opacity: 1, locked: false }

type TextStyle = Partial<Omit<CertificateText, "id" | "type" | "content" | "x" | "y" | "width">> & Pick<CertificateText, "font" | "size" | "color">

function text(id: string, content: string, x: number, y: number, width: number, style: TextStyle): CertificateText {
  const lineHeight = style.line_height ?? 1.2

  return {
    ...ELEMENT_BASE,
    id,
    type: "text",
    content,
    x,
    y,
    width,
    height: Math.round(style.size * lineHeight * 100) / 100,
    bold: false,
    italic: false,
    underline: false,
    align: "center",
    letter_spacing: 0,
    line_height: lineHeight,
    uppercase: false,
    fit: "wrap",
    ...style,
  }
}

function image(id: string, asset_id: string, x: number, y: number, size: number, rotation = 0, opacity = 1): CertificateElement {
  return { ...ELEMENT_BASE, id, type: "image", asset_id, x, y, width: size, height: size, rotation, opacity, flip_x: false, flip_y: false }
}

// O Natal de 2026 mostra o que o editor livre faz e o modelo clássico não fazia: título em letra
// caligráfica com degradê, a mensagem escrita à mão e levemente torta, moldura pontilhada, o
// rodapé reorganizado em volta do QR e os enfeites em tamanhos e giros diferentes.
function christmas2026(assets: (key: string) => string): CertificateDesignSpec {
  return {
    palette: { paper: "#FBFDF8", primary: "#14532D", secondary: "#15803D", accent: "#B98A2E", ink: "#1C2B22", muted: "#5D6B62" },
    background: { color: "@paper", asset_id: assets("neve"), opacity: 0.55 },
    elements: [
      {
        ...ELEMENT_BASE, id: "moldura", type: "shape", shape: "rect", x: 20, y: 20, width: 801.89, height: 555.28, radius: 14,
        fill: null, stroke: { stops: ["@primary", "@accent", "@primary"], angle: 35 }, stroke_width: 3, dash: "solid",
      },
      {
        ...ELEMENT_BASE, id: "moldura-pontilhada", type: "shape", shape: "rect", x: 32, y: 32, width: 777.89, height: 531.28, radius: 10,
        fill: null, stroke: "@accent", stroke_width: 1.4, dash: "dotted",
      },
      image("estrela-1", assets("estrela"), 44, 44, 44, -12),
      image("estrela-2", assets("estrela"), 754, 44, 44, 12),
      image("arvore", assets("arvore"), 50, 330, 150),
      image("presente", assets("presente"), 664, 392, 108, 6),
      image("sino", assets("sino"), 690, 96, 72, 14),
      image("floco-1", assets("floco"), 126, 126, 36, 0, 0.8),
      image("floco-2", assets("floco"), 764, 262, 28, 0, 0.7),
      { ...ELEMENT_BASE, id: "logo", type: "logo", x: 394.95, y: 42, width: 52, height: 52 },
      text("titulo-natal", "Feliz Natal", 170.95, 90, 500, {
        font: "greatvibes", size: 56, color: { stops: ["@primary", "@secondary"], angle: 0 }, fit: "shrink",
      }),
      text("titulo", "{{titulo}}", 170.95, 160, 500, { font: "cinzel", size: 13, bold: true, color: "@label", letter_spacing: 4, uppercase: true, fit: "shrink" }),
      text("abertura", "Este certificado reconhece que", 170.95, 196, 500, { font: "cormorant", size: 15, italic: true, color: "@muted" }),
      text("nome", "{{nome}}", 170.95, 218, 500, { font: "greatvibes", size: 44, color: "@primary", fit: "shrink" }),
      {
        ...ELEMENT_BASE, id: "divisor", type: "shape", shape: "line", x: 320.95, y: 291.5, width: 200, height: 1,
        fill: null, stroke: { stops: ["@paper", "@accent", "@paper"], angle: 0 }, stroke_width: 1, radius: 0, dash: "solid",
      },
      {
        ...ELEMENT_BASE, id: "losango", type: "shape", shape: "rect", x: 416.71, y: 287.76, width: 8.49, height: 8.49, rotation: 45,
        fill: "@accent", stroke: null, stroke_width: 0, radius: 0, dash: "solid",
      },
      text("texto", "{{acao}} {{valor}}, destinada {{destino}}.", 190.95, 304, 460, { font: "cormorant", size: 16, color: "@ink", line_height: 1.3 }),
      { ...text("mensagem", "Que a sua generosidade ilumine o Natal de muitas famílias.", 195.95, 370, 450, { font: "caveat", size: 22, color: "@secondary" }), rotation: -2 },
      text("rotulo-recibo", "RECIBO Nº", 232, 452, 140, { font: "cinzel", size: 7, color: "@label", letter_spacing: 1.5, align: "left" }),
      text("numero", "{{numero}}", 232, 463, 140, { font: "nunito", size: 12, bold: true, color: "@ink", align: "left" }),
      text("rotulo-data", "EMITIDO EM", 232, 487, 140, { font: "cinzel", size: 7, color: "@label", letter_spacing: 1.5, align: "left" }),
      text("data", "{{data}}", 232, 498, 140, { font: "nunito", size: 10, color: "@ink", align: "left" }),
      { ...ELEMENT_BASE, id: "qr", type: "qr", x: 382.95, y: 444, width: 76, height: 76, color: "@primary" },
      text("rotulo-qr", "VERIFIQUE A AUTENTICIDADE", 320.95, 524, 200, { font: "nunito", size: 6.5, color: "@muted", letter_spacing: 0.8 }),
      {
        ...ELEMENT_BASE, id: "assinatura-linha", type: "shape", shape: "line", x: 480, y: 491.6, width: 160, height: 0.8,
        fill: null, stroke: "@ink", stroke_width: 0.8, radius: 0, dash: "solid",
      },
      text("assinatura", "{{associacao}}", 470, 497, 180, { font: "nunito", size: 9, bold: true, color: "@ink" }),
      text("cnpj", "CNPJ {{cnpj}}", 470, 510, 180, { font: "nunito", size: 7.5, color: "@muted" }),
      text("registro", "registro #{{registro}}  ·  {{codigo}}", 60, 543, 721.89, { font: "courier", size: 6, color: "@muted", fit: "shrink" }),
    ],
  }
}

async function seedCertificateDesigns(assets: Map<string, string>, campaigns: Campaign[], events: Event[], author: string) {
  const asset = (key: string) => assets.get(key) as string
  const campaign = (slug: string) => (campaigns.find((item) => item.slug === slug) as Campaign).id
  const event = (slug: string) => (events.find((item) => item.slug === slug) as Event).id

  const christmas2025: ClassicOptions = {
    palette: { paper: "#FFFBF2", primary: "#7F1D1D", secondary: "#B91C1C", accent: "#B98A2E", ink: "#2B1B17", muted: "#6E5A50" },
    font: "times",
    title: "Certificado de Natal",
    message: "Obrigado por fazer o Natal de alguém mais feliz.",
    stickers: [
      sticker(asset("estrela"), 58, 52, 70, -12),
      sticker(asset("estrela"), 136, 112, 34, 14, 0.85),
      sticker(asset("presente"), 706, 54, 78, 8),
      sticker(asset("arvore"), 54, 236, 104),
      sticker(asset("bengala"), 712, 250, 76, -10),
    ],
  }

  const planned: PlannedDesign[] = [
    {
      scope: "default",
      target_id: null,
      label: "Modelo institucional",
      created_at: daysAgo(420, 10),
      design: FACTORY_DESIGN,
    },
    {
      scope: "default",
      target_id: null,
      label: "Cores da marca",
      created_at: daysAgo(75, 15),
      design: classicDesign({
        palette: { paper: "#FFFFFF", primary: "#0A7A73", secondary: "#00B3A6", accent: "#BB2DD7", ink: "#343937", muted: "#5C6260" },
        font: "nunito",
        message: "Obrigado por fazer parte da Somos do Bem.",
        stickers: [
          sticker(asset("coracao"), 66, 60, 44, -10, 0.9),
          sticker(asset("coracao"), 732, 60, 44, 10, 0.9),
        ],
      }),
    },
    {
      scope: "campaign",
      target_id: campaign("chocolate-do-bem-2026"),
      label: "Páscoa com ovos e coelho",
      created_at: daysAgo(325, 11),
      design: classicDesign({
        palette: { paper: "#FFF8F0", primary: "#5B3415", secondary: "#8B4A22", accent: "#C08A3E", ink: "#3B2A1E", muted: "#7A6656" },
        title: "Certificado de Páscoa",
        message: "Uma Páscoa mais doce para quem mais precisa.",
        stickers: [
          sticker(asset("ovo"), 60, 60, 66, -14),
          sticker(asset("ovo"), 120, 120, 40, 18, 0.9),
          sticker(asset("coelho"), 704, 56, 84),
          sticker(asset("ovo"), 724, 250, 60, 12),
        ],
      }),
    },
    {
      scope: "campaign",
      target_id: campaign("natal-do-bem-2025"),
      label: "Natal 2025 vermelho e dourado",
      created_at: daysAgo(345, 16),
      design: classicDesign(christmas2025),
    },
    {
      scope: "campaign",
      target_id: campaign("natal-do-bem-2025"),
      label: "Natal 2025 com neve",
      created_at: daysAgo(315, 10),
      design: classicDesign({
        ...christmas2025,
        background: { asset_id: asset("neve"), opacity: 0.7 },
        stickers: [
          ...(christmas2025.stickers ?? []),
          sticker(asset("sino"), 78, 360, 52, -8),
          sticker(asset("floco"), 736, 350, 46, 0, 0.9),
        ],
      }),
    },
    {
      scope: "campaign",
      target_id: campaign("natal-do-bem-2026"),
      label: "Natal 2026 verde, dourado e caligrafia",
      created_at: daysAgo(22, 14),
      design: christmas2026(asset),
    },
    {
      scope: "default",
      target_id: null,
      variant: "message",
      label: "Modelo institucional com mensagem",
      created_at: fixedDaysAgo(420, 13, 5),
      design: FACTORY_MESSAGE_DESIGN,
    },
    {
      scope: "default",
      target_id: null,
      variant: "message",
      label: "Cores da marca com mensagem",
      created_at: fixedDaysAgo(75, 18, 10),
      design: classicDesign({
        palette: { paper: "#FFFFFF", primary: "#0A7A73", secondary: "#00B3A6", accent: "#BB2DD7", ink: "#343937", muted: "#5C6260" },
        font: "nunito",
        insteadOfAmount: FACTORY_MESSAGE,
        message: "Obrigado por fazer parte da Somos do Bem.",
        stickers: [
          sticker(asset("coracao"), 66, 60, 44, -10, 0.9),
          sticker(asset("coracao"), 732, 60, 44, 10, 0.9),
        ],
      }),
    },
    {
      scope: "campaign",
      target_id: campaign("natal-do-bem-2026"),
      variant: "message",
      label: "Natal 2026 com mensagem, sem valor",
      created_at: fixedDaysAgo(21, 17, 30),
      design: withoutAmount(christmas2026(asset)),
    },
    {
      scope: "event",
      target_id: event("chefs-do-bem-6a-edicao"),
      label: "Chefs do Bem com chapéu e talheres",
      created_at: daysAgo(60, 11),
      design: classicDesign({
        palette: { paper: "#FFFFFF", primary: "#343937", secondary: "#B83A3C", accent: "#B83A3C", ink: "#1F2421", muted: "#5C6260" },
        title: "Certificado Chefs do Bem",
        message: "Obrigado por estar à mesa com a gente.",
        stickers: [
          sticker(asset("chapeu"), 60, 50, 76, -10),
          sticker(asset("talheres"), 710, 56, 68, 8),
        ],
      }),
    },
  ]

  const versions = new Map<string, number>()

  // A numeração corre por pasta e por variação, como no serviço que grava.
  const rows = planned
    .sort((left, right) => left.created_at.getTime() - right.created_at.getTime())
    .map((item) => {
      const folder = folderKey(item.scope, item.target_id)
      const variant = item.variant ?? "amount"
      const version = (versions.get(`${folder}|${variant}`) ?? 0) + 1
      versions.set(`${folder}|${variant}`, version)

      return {
        scope: item.scope,
        campaign_id: item.scope === "campaign" ? item.target_id : null,
        event_id: item.scope === "event" ? item.target_id : null,
        folder,
        variant,
        version,
        label: item.label,
        design: item.design,
        created_by: author,
        created_at: item.created_at,
        updated_at: item.created_at,
      }
    })

  return await CertificateDesign.bulkCreate(rows)
}

// A mesma decisão da emissão real (ResolveCertificateDesignService), aplicada no instante em que
// cada recibo da carga nasceu: evento, campanha e modelo padrão, nessa ordem, e dentro da pasta a
// versão mais nova daquela variação que já existia naquele dia.
function designAt(designs: CertificateDesign[], transaction: PlannedTransaction, issuedAt: Date, variant: CertificateVariant) {
  const priority = [
    ...(transaction.event_id ? [folderKey("event", transaction.event_id)] : []),
    ...(transaction.campaign_id ? [folderKey("campaign", transaction.campaign_id)] : []),
    folderKey("default", null),
  ]

  for (const folder of priority) {
    const available = designs
      .filter((design) => design.folder === folder && design.variant === variant && design.created_at.getTime() <= issuedAt.getTime())
      .sort((left, right) => right.version - left.version)

    if (available[0]) {
      return available[0].id
    }
  }

  return null
}

// A corrente. Um recibo por transação confirmada, na ordem em que foram confirmadas, cada um
// carregando o hash do anterior. `sequence` não pode ter buraco: verificar a corrente é caminhar
// de sequence em sequence.
async function seedReceipts(planned: PlannedTransaction[], designs: CertificateDesign[]) {
  const confirmed = planned
    .filter((transaction) => transaction.confirmed_at !== null)
    .sort((left, right) => (left.confirmed_at as Date).getTime() - (right.confirmed_at as Date).getTime())

  let previousHash: string | null = null
  let sequence = 0

  const rows = confirmed.map((transaction) => {
    sequence += 1

    const issuedAt = truncateToSecond(transaction.confirmed_at as Date)
    const number = buildReceiptNumber(sequence, issuedAt)

    const hash = buildReceiptHash({
      sequence,
      number,
      transaction_id: transaction.id,
      transaction_type: transaction.type,
      amount: transaction.amount,
      donor_name: transaction.donor.name,
      donor_document: transaction.donor.document,
      issued_at: issuedAt,
      previous_hash: previousHash,
    })

    const row = {
      transaction_id: transaction.id,
      sequence,
      number,
      // Estorno cancela o recibo, não o apaga: o documento continua autêntico e deixa de valer.
      status: transaction.refunded_at ? "cancelled" as const : "issued" as const,
      donor_name: transaction.donor.name,
      donor_document: transaction.donor.document,
      amount: transaction.amount,
      transaction_type: transaction.type,
      issued_at: issuedAt,
      cancelled_at: transaction.refunded_at,
      previous_hash: previousHash,
      hash,
      certificate_design_id: designAt(designs, transaction, issuedAt, "amount"),
      certificate_message_design_id: designAt(designs, transaction, issuedAt, "message"),
      created_at: issuedAt,
      updated_at: transaction.refunded_at ?? issuedAt,
    }

    previousHash = hash

    return row
  })

  await Receipt.bulkCreate(rows)

  // O alocador precisa continuar de onde a carga parou, senão a próxima confirmação real tenta
  // reusar uma sequence já gravada e a corrente nasce quebrada.
  await ReceiptSequence.create({ id: RECEIPT_SEQUENCE_ID, last_sequence: sequence })

  return rows
}

async function seedAuditLogs(planned: PlannedTransaction[], performedBy: string) {
  const rows: {
    transaction_id: string,
    previous_status: TransactionStatus | null,
    new_status: TransactionStatus,
    source: "webhook" | "manual" | "reconciliation" | "system",
    performed_by: string | null,
    reason: string | null,
    created_at: Date,
  }[] = []

  for (const transaction of planned) {
    if (transaction.confirmed_at) {
      rows.push({
        transaction_id: transaction.id,
        previous_status: "pending",
        new_status: "confirmed",
        source: "webhook",
        performed_by: null,
        reason: "Pagamento confirmado pelo gateway",
        created_at: transaction.confirmed_at,
      })
    }

    if (transaction.refunded_at) {
      rows.push({
        transaction_id: transaction.id,
        previous_status: "confirmed",
        new_status: "refunded",
        source: "manual",
        performed_by: performedBy,
        reason: "Estorno solicitado pelo doador",
        created_at: transaction.refunded_at,
      })
    }

    if (transaction.status === "refused" || transaction.status === "cancelled") {
      rows.push({
        transaction_id: transaction.id,
        previous_status: "pending",
        new_status: transaction.status,
        source: transaction.status === "refused" ? "webhook" : "manual",
        performed_by: transaction.status === "cancelled" ? performedBy : null,
        reason: transaction.status === "refused" ? "Pagamento recusado pelo emissor" : "Cancelada a pedido do doador",
        created_at: transaction.created_at,
      })
    }
  }

  await TransactionAuditLog.bulkCreate(rows)

  return rows.length
}

// Os efeitos colaterais que os serviços produziriam. Escritos a partir do mesmo conjunto de
// transações, e não a olho: arrecadação que não bate com a soma das linhas é o defeito que a
// tela financeira existe para não deixar passar.
async function applySideEffects(planned: PlannedTransaction[]) {
  const raised = new Map<string, number>()
  const seats = new Map<string, number>()
  const sold = new Map<string, number>()

  for (const transaction of planned) {
    if (!transaction.confirmed_at || transaction.refunded_at) {
      continue
    }

    if (transaction.campaign_id) {
      raised.set(transaction.campaign_id, (raised.get(transaction.campaign_id) ?? 0) + Number(transaction.amount))
    }

    if (transaction.type === "ticket" && transaction.event_id) {
      seats.set(transaction.event_id, (seats.get(transaction.event_id) ?? 0) + 1)
    }

    for (const item of transaction.items) {
      sold.set(item.product_id, (sold.get(item.product_id) ?? 0) + item.quantity)
    }
  }

  for (const [campaignId, amount] of raised) {
    await Campaign.update({ raised_amount: money(amount) }, { where: { id: campaignId } })
  }

  for (const [eventId, taken] of seats) {
    await Event.update({ taken_seats: taken }, { where: { id: eventId } })
  }

  for (const [productId, quantity] of sold) {
    const product = await Product.findByPk(productId)

    if (product) {
      await product.update({ stock: Math.max(product.stock - quantity, 0) })
    }
  }
}

// Inscrições. Cada convite confirmado ganha a sua, como a confirmação real faz, com quem pagou como
// participante; o convite estornado fica com a inscrição cancelada. Nos eventos que já aconteceram,
// a maior parte de quem comprou passou pela porta, e é isso que a lista de presença mostra. Os dois
// eventos gratuitos recebem inscrições diretas, que não passam pelo caixa, e a vaga é contada a
// partir delas, como o serviço de inscrição faz.
const FREE_REGISTRATIONS: { slug: string, count: number }[] = [
  { slug: "dia-de-portas-abertas", count: 34 },
  { slug: "bazar-solidario-de-primavera", count: 57 },
]

function emailFor(name: string, index: number) {
  const local = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".")

  return `${local}${index > 0 ? index : ""}@exemplo.com.br`
}

async function seedRegistrations(planned: PlannedTransaction[], events: Event[], doorkeeper: string) {
  const rows: {
    event_id: string,
    transaction_id: string | null,
    ticket_code: string,
    participant_name: string,
    participant_email: string,
    participant_phone: string | null,
    status: "confirmed" | "cancelled",
    checked_in_at: Date | null,
    checked_in_by: string | null,
    cancelled_at: Date | null,
    created_at: Date,
    updated_at: Date,
  }[] = []

  const byId = new Map(events.map((event) => [event.id, event]))

  for (const transaction of planned) {
    if (transaction.type !== "ticket" || !transaction.event_id || !transaction.confirmed_at) {
      continue
    }

    const event = byId.get(transaction.event_id) as Event
    const happened = event.starts_at < NOW
    const cameIn = !transaction.refunded_at && happened && random() < 0.88
    const entry = new Date(event.starts_at)
    entry.setUTCMinutes(entry.getUTCMinutes() + Math.floor(random() * 50) + 5)

    rows.push({
      event_id: event.id,
      transaction_id: transaction.id,
      ticket_code: generateTicketCode(),
      participant_name: transaction.donor.name,
      participant_email: transaction.donor.email,
      participant_phone: transaction.donor.phone,
      status: transaction.refunded_at ? "cancelled" : "confirmed",
      checked_in_at: cameIn ? entry : null,
      checked_in_by: cameIn ? doorkeeper : null,
      cancelled_at: transaction.refunded_at,
      created_at: transaction.confirmed_at,
      updated_at: transaction.refunded_at ?? (cameIn ? entry : transaction.confirmed_at),
    })
  }

  for (const free of FREE_REGISTRATIONS) {
    const event = events.find((item) => item.slug === free.slug) as Event
    const used = new Map<string, number>()
    let confirmed = 0

    for (let index = 0; index < free.count; index += 1) {
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
      const repeat = used.get(name) ?? 0
      used.set(name, repeat + 1)

      const created = daysAgo(Math.floor(random() * 21) + 1, 8 + Math.floor(random() * 13))
      const cancelled = index === 7

      if (!cancelled) {
        confirmed += 1
      }

      rows.push({
        event_id: event.id,
        transaction_id: null,
        ticket_code: generateTicketCode(),
        participant_name: name,
        participant_email: emailFor(name, repeat),
        participant_phone: random() < 0.6 ? `19 9${buildDocument(4)}-${buildDocument(4)}` : null,
        status: cancelled ? "cancelled" : "confirmed",
        checked_in_at: null,
        checked_in_by: null,
        cancelled_at: cancelled ? daysAgo(1, 15) : null,
        created_at: created,
        updated_at: cancelled ? daysAgo(1, 15) : created,
      })
    }

    await Event.update({ taken_seats: confirmed }, { where: { id: event.id } })
  }

  await Registration.bulkCreate(rows)

  return rows
}

// Mensagens. A caixa de entrada precisa mostrar os quatro canais e as duas situações: dúvida de
// doação, pedido de atendimento, proposta de parceria já respondida, uma sugestão e um elogio na
// ouvidoria, uma candidatura e dois pedidos de retirada do Mural do Bem, um de quem de fato aparece
// no mural e outro de um e-mail que nunca doou. Os nomes são fictícios, como os dos doadores.
async function seedContactMessages(planned: PlannedTransaction[], communication: string, admin: string) {
  const listed = planned.find((transaction) =>
    transaction.confirmed_at && !transaction.refunded_at && transaction.public_recognition && transaction.donor.document_type === "cpf"
  )

  const messages: {
    channel: ContactChannel,
    subject: string | null,
    name: string,
    email: string,
    phone: string | null,
    message: string | null,
    status: ContactStatus,
    resolved_by: string | null,
    days: number,
  }[] = [
    {
      channel: "contact",
      subject: "doacao",
      name: "Roberta Campos",
      email: "roberta.campos@exemplo.com.br",
      phone: null,
      message: "Boa tarde. A empresa onde trabalho quer doar para o Natal do Bem e precisa do recibo com o CNPJ dela. Posso fazer a doação pelo site informando o CNPJ no lugar do CPF?",
      status: "open",
      resolved_by: null,
      days: 1,
    },
    {
      channel: "contact",
      subject: "atendimento",
      name: "Luciana Prado",
      email: "luciana.prado@exemplo.com.br",
      phone: "19 99712-4408",
      message: "Meu filho tem 6 anos e foi diagnosticado com TEA no ano passado. Gostaria de saber como funciona a triagem para o Ambulatório e se há fila de espera neste momento.",
      status: "open",
      resolved_by: null,
      days: 2,
    },
    {
      channel: "contact",
      subject: "voluntariado",
      name: "Caio Mendes",
      email: "caio.mendes@exemplo.com.br",
      phone: null,
      message: "Sou estudante de Educação Física e tenho as manhãs de sábado livres. Vocês aceitam voluntários para as atividades esportivas da Escola?",
      status: "open",
      resolved_by: null,
      days: 4,
    },
    {
      channel: "contact",
      subject: "parceria",
      name: "Fernanda Lobo",
      email: "fernanda.lobo@exemplo.com.br",
      phone: "19 3825-1190",
      message: "Represento uma rede de padarias de Indaiatuba e queremos patrocinar a Cantata de Natal com os lanches do intervalo. Com quem posso conversar?",
      status: "resolved",
      resolved_by: communication,
      days: 9,
    },
    {
      channel: "ombudsman",
      subject: "sugestao",
      name: "Marcos Tavares",
      email: "marcos.tavares@exemplo.com.br",
      phone: null,
      message: "Sugiro que o horário do Dia de Portas Abertas tenha uma sessão no fim da tarde. Muitos pais trabalham de manhã e acabam não conseguindo conhecer a sede.",
      status: "open",
      resolved_by: null,
      days: 3,
    },
    {
      channel: "ombudsman",
      subject: "elogio",
      name: "Helena Duarte",
      email: "helena.duarte@exemplo.com.br",
      phone: null,
      message: "Quero agradecer a equipe da Oficina Terapêutica pelo cuidado com a minha filha durante todo o semestre. A evolução dela foi visível para a família inteira.",
      status: "resolved",
      resolved_by: admin,
      days: 15,
    },
    {
      channel: "work",
      subject: "clinico",
      name: "Juliana Faria",
      email: "juliana.faria@exemplo.com.br",
      phone: "19 99654-2231",
      message: "Sou fonoaudióloga, formada há quatro anos, com experiência em atendimento infantil e comunicação alternativa. Tenho disponibilidade às terças e quintas à tarde. O currículo está em https://exemplo.com.br/juliana-faria.",
      status: "open",
      resolved_by: null,
      days: 6,
    },
    {
      channel: "wall_removal",
      subject: null,
      name: listed?.donor.name ?? "Ana Almeida",
      email: listed?.donor.email ?? "ana.almeida@exemplo.com.br",
      phone: null,
      message: "Marquei a opção do mural sem perceber. Prefiro que o meu nome não apareça.",
      status: "open",
      resolved_by: null,
      days: 1,
    },
    {
      channel: "wall_removal",
      subject: null,
      name: "Paulo Henrique Rocha",
      email: "paulo.rocha@exemplo.com.br",
      phone: null,
      message: null,
      status: "open",
      resolved_by: null,
      days: 5,
    },
  ]

  await ContactMessage.bulkCreate(messages.map(({ days, ...message }) => {
    const created = daysAgo(days, 10 + Math.floor(random() * 8))
    const resolved = message.status === "resolved" ? new Date(created.getTime() + 26 * 60 * 60 * 1000) : null

    return { ...message, resolved_at: resolved, created_at: created, updated_at: resolved ?? created }
  }))

  return messages
}

// Notícias. As três primeiras são as do site atual da associação, com a data em que foram
// publicadas lá. As outras contam os programas e as campanhas desta carga sem inventar resultado:
// número de atendimento é dado que só a associação tem. Uma em rascunho e uma arquivada existem
// porque o painel de Comunicação precisa mostrar os três estados.

type PlannedPost = {
  title: string,
  slug: string,
  excerpt: string,
  category: PostCategory,
  image_url: string | null,
  status: PostStatus,
  published_at: Date | null,
  body: string[],
}

async function seedPosts(author: string) {
  const posts: PlannedPost[] = [
    {
      title: "Natal do Bem 2026 está no ar",
      slug: "natal-do-bem-2026-esta-no-ar",
      excerpt: "A campanha de fim de ano já recebe doações, e quem apoia pode escolher ter o nome no mural de agradecimento.",
      category: "eventos",
      image_url: "/imagens/campanhas/natal-do-bem-2026.jpg",
      status: "published",
      published_at: daysAgo(19, 13),
      body: [
        "O Natal do Bem 2026 começou. A campanha reúne as cestas de fim de ano, os presentes escolhidos pelas próprias crianças e a ceia com as famílias atendidas pelo Ambulatório, pela Escola de Educação Especial e pela Oficina Terapêutica.",
        "Toda doação confirmada gera um recibo verificável e um certificado com a cara desta edição. Quem quiser pode marcar, na hora de doar, que o nome apareça no mural de agradecimento da campanha. O mural não tem ranking: os nomes aparecem em ordem aleatória, e nenhum valor é mostrado.",
        "A Cantata de Natal do Bem, com o coral dos estudantes da Escola, encerra a programação em dezembro. Os convites já estão à venda na página de Eventos.",
      ],
    },
    {
      title: "Convites da 6ª edição do Chefs do Bem estão à venda",
      slug: "convites-da-6a-edicao-do-chefs-do-bem-estao-a-venda",
      excerpt: "Três noites no Espaço Viber, em Indaiatuba, com chefs convidados e toda a renda destinada ao Ambulatório.",
      category: "eventos",
      image_url: "/imagens/eventos/chefs-do-bem-6a-edicao.png",
      status: "published",
      published_at: daysAgo(35, 12),
      body: [
        "A sexta edição do Chefs do Bem já tem data: três noites de jantar beneficente no Espaço Viber, em Indaiatuba, com um menu diferente a cada noite.",
        "Os convites são vendidos pelo site, um por pedido, para que cada lugar seja reservado no nome de quem vai. A renda sustenta o Ambulatório, que atende de forma clínica, terapêutica e de reabilitação.",
        "Quem comprar o convite recebe o recibo por e-mail e um certificado de participação desta edição.",
      ],
    },
    {
      title: "Oficina Terapêutica abre nova turma",
      slug: "oficina-terapeutica-abre-nova-turma",
      excerpt: "Jovens e adultos atendidos pela associação ganham mais um horário de atividades de autonomia e trabalho protegido.",
      category: "inclusao",
      image_url: "/imagens/oficina.jpeg",
      status: "published",
      published_at: daysAgo(48, 15),
      body: [
        "A Oficina Terapêutica abriu um novo horário para jovens e adultos atendidos pela associação. As atividades trabalham autonomia, convivência e trabalho protegido, sempre com acompanhamento profissional.",
        "Parte do que é produzido na oficina vai para a loja solidária do site, como as ecobags e os chaveiros. Cada peça comprada volta para os insumos da própria oficina.",
        "Famílias interessadas podem falar com a associação pelo Fale Conosco.",
      ],
    },
    {
      title: "Material pedagógico novo para a Escola de Educação Especial",
      slug: "material-pedagogico-novo-para-a-escola-de-educacao-especial",
      excerpt: "A campanha da Escola garantiu a reposição do material usado no ensino adaptado ao ritmo de cada estudante.",
      category: "educacao",
      image_url: "/imagens/educacional.png",
      status: "published",
      published_at: daysAgo(63, 10),
      body: [
        "As salas da Escola de Educação Especial receberam material pedagógico novo, comprado com as doações da campanha da Escola.",
        "O ensino na Escola é adaptado ao ritmo de cada estudante e construído junto com a família. O material concreto, como jogos, peças de encaixe e livros adaptados, é o que permite esse trabalho individual.",
        "A campanha continua aberta na página Doe Agora, e quem apoia acompanha a meta subir em tempo real.",
      ],
    },
    {
      title: "Ambulatório organiza a reforma da sala de fisioterapia",
      slug: "ambulatorio-organiza-a-reforma-da-sala-de-fisioterapia",
      excerpt: "A adequação do piso, da iluminação e dos equipamentos vai virar campanha própria nos próximos meses.",
      category: "saude",
      image_url: "/imagens/programa-ambulatorio.jpg",
      status: "published",
      published_at: daysAgo(80, 11),
      body: [
        "O Ambulatório começou a planejar a reforma da sala de fisioterapia: piso, iluminação e equipamentos.",
        "A reforma vai ganhar uma campanha própria, com meta e prazo, para que quem doar saiba exatamente para onde o dinheiro vai. Enquanto isso, a campanha de atendimento contínuo do Ambulatório segue recebendo doações.",
      ],
    },
    {
      title: "Festa Junina do Bem reuniu famílias na sede",
      slug: "festa-junina-do-bem-reuniu-familias-na-sede",
      excerpt: "Quadrilha, comidas típicas e barracas conduzidas pelos jovens da Oficina Terapêutica.",
      category: "eventos",
      image_url: "/imagens/institucional-missao.jpg",
      status: "published",
      published_at: daysAgo(79, 12),
      body: [
        "A Festa Junina do Bem encheu a sede da associação de famílias, voluntários e vizinhos.",
        "As barracas foram conduzidas pelos jovens da Oficina Terapêutica, e a quadrilha teve participação dos estudantes da Escola. A renda dos convites entrou no caixa geral, que a associação aplica onde a necessidade for maior.",
        "Obrigado a todos que vieram e a quem ajudou a montar a festa.",
      ],
    },
    {
      title: "Obrigado a quem fez o Natal do Bem 2025",
      slug: "obrigado-a-quem-fez-o-natal-do-bem-2025",
      excerpt: "A campanha de 2025 terminou, e os nomes de quem apoiou e quis aparecer seguem no mural da campanha.",
      category: "eventos",
      image_url: "/imagens/campanhas/natal-do-bem-2025.jpg",
      status: "published",
      published_at: daysAgo(284, 12),
      body: [
        "O Natal do Bem 2025 terminou na véspera de Natal, depois da Ceia Solidária com as famílias atendidas, os voluntários e quem apoia a associação ao longo do ano.",
        "A página da campanha continua no ar como registro, com o mural de quem apoiou e pediu para ter o nome ali. A ordem dos nomes é aleatória e muda a cada visita: ninguém aparece na frente por ter doado mais.",
      ],
    },
    {
      title: "Chocolate do Bem: uma Páscoa de solidariedade",
      slug: "chocolate-do-bem-uma-pascoa-de-solidariedade",
      excerpt: "Na Páscoa deste ano, a solidariedade foi o ingrediente principal da campanha organizada pela associação Somos do Bem.",
      category: "eventos",
      image_url: "/imagens/noticias/chocolate-do-bem.png",
      status: "published",
      published_at: new Date("2024-12-11T12:00:00.000Z"),
      body: [
        "A campanha Chocolate do Bem transforma a Páscoa em arrecadação para os programas da associação. Cada caixa vendida vira atendimento no Ambulatório, material na Escola de Educação Especial e insumo nas oficinas.",
        "A produção reúne voluntários, famílias e empresas parceiras, que ajudam desde a montagem das caixas até a entrega. É um trabalho coletivo, e é isso que faz o preço final caber no bolso de quem compra e ainda sustentar o atendimento.",
        "Quem quiser participar da próxima edição pode falar com a associação pelo Fale Conosco ou acompanhar a agenda na página de Eventos.",
      ],
    },
    {
      title: "5ª edição do Chefs do Bem",
      slug: "5a-edicao-do-chefs-do-bem",
      excerpt: "Realizada nos dias 23, 24 e 25 de agosto, no Espaço Viber, em Indaiatuba, a edição foi um grande sucesso.",
      category: "eventos",
      image_url: "/imagens/noticias/5a-edicao-do-chefs-do-bem.png",
      status: "published",
      published_at: new Date("2024-11-25T12:00:00.000Z"),
      body: [
        "A quinta edição do Chefs do Bem aconteceu nos dias 23, 24 e 25 de agosto, no Espaço Viber, em Indaiatuba.",
        "O jantar beneficente reúne chefs convidados da cidade em três noites de menu preparado especialmente para o evento. Toda a renda dos convites sustenta os programas da associação.",
        "O Chefs do Bem é hoje o maior evento do calendário da casa, e a próxima edição é anunciada na página de Eventos assim que a data é fechada.",
      ],
    },
    {
      title: "Mudança de nome da APAE de Indaiatuba",
      slug: "mudanca-de-nome-da-apae-de-indaiatuba",
      excerpt: "A instituição realizou uma coletiva de imprensa para anunciar seu novo nome e sua nova marca: Somos do Bem.",
      category: "inclusao",
      image_url: "/imagens/noticias/mudanca-de-nome.png",
      status: "published",
      published_at: new Date("2024-11-25T11:00:00.000Z"),
      body: [
        "Em coletiva de imprensa, a instituição anunciou o novo nome e a nova identidade visual: Somos do Bem.",
        "A troca de nome não muda o trabalho nem o público atendido. O Ambulatório, a Escola de Educação Especial e o Programa de Oficina Terapêutica seguem com a mesma equipe e a mesma proposta.",
        "A nova marca passou a ser usada no site, nos materiais impressos e nos canais de comunicação da associação.",
      ],
    },
    {
      title: "Inscrições abertas para o Dia de Portas Abertas",
      slug: "inscricoes-abertas-para-o-dia-de-portas-abertas",
      excerpt: "Visita guiada pelo Ambulatório e pela Oficina Terapêutica, com inscrição para organizar os grupos.",
      category: "eventos",
      image_url: "/imagens/eventos/dia-de-portas-abertas.jpg",
      status: "archived",
      published_at: daysAgo(40, 10),
      body: [
        "A associação abre as portas para quem quer conhecer de perto o Ambulatório e a Oficina Terapêutica.",
        "A entrada é gratuita, com inscrição pelo Fale Conosco para organizar os grupos de visita.",
      ],
    },
    {
      title: "Prestação de contas do primeiro semestre",
      slug: "prestacao-de-contas-do-primeiro-semestre",
      excerpt: "O resumo do que entrou e de onde foi aplicado entre janeiro e junho.",
      category: "inclusao",
      image_url: null,
      status: "draft",
      published_at: null,
      body: [
        "Rascunho em revisão pela diretoria antes da publicação.",
        "Os números entram depois da aprovação do conselho fiscal.",
      ],
    },
  ]

  return await Post.bulkCreate(posts.map((post) => ({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    image_url: post.image_url,
    status: post.status,
    published_at: post.published_at,
    body: post.body.join("\n\n"),
    author_id: author,
    created_at: post.published_at ?? daysAgo(3, 10),
    updated_at: post.published_at ?? daysAgo(3, 10),
  })))
}

// Parceiros. Os catorze que já estavam na rede antes da plataforma entram aprovados, na rede pública
// e sem conta: nunca pediram acesso ao painel. As empresas que pediram pelo site são fictícias,
// como os doadores, e mostram as três situações do pedido. A Horizonte Embalagens é a conta de
// demonstração do painel do parceiro (parceiro@exemplo.com.br), com um aporte já pago para o Natal
// do Bem, um patrocínio aceito esperando pagamento e propostas nas outras situações.

const NETWORK = [
  "Beatz", "Asstam", "Cobreq", "Dayco", "GTA", "Haoc Saúde", "Leonardi", "Lofts", "Lógica",
  "Mann + Hummel", "Monark", "Sew Eurodrive", "V&S", "Power Fiber",
]

const DEMO_PARTNER = {
  company_name: "Horizonte Embalagens Ltda",
  document: "45781296000163",
  email: "parceiro@exemplo.com.br",
  phone: "19 3875-1200",
}

// A empresa de demonstração doa como qualquer doador: o cadastro de doador é o que o recibo lê.
async function seedPartnerDonor() {
  return await Donor.create({
    name: DEMO_PARTNER.company_name,
    email: DEMO_PARTNER.email,
    document: DEMO_PARTNER.document,
    document_type: "cnpj",
    phone: DEMO_PARTNER.phone,
  })
}

// O aporte que a Horizonte já pagou, pelo mesmo caminho de qualquer doação: entra na corrente de
// recibos, soma na campanha e aparece no mural, porque a empresa autorizou a marca no site.
function partnerContribution(donor: Donor, campaigns: Campaign[]): PlannedTransaction {
  const christmas = campaigns.find((campaign) => campaign.slug === "natal-do-bem-2026") as Campaign

  return {
    id: randomUUID(),
    type: "donation",
    status: "confirmed",
    amount: money(5000),
    payment_method: "boleto",
    donor,
    campaign_id: christmas.id,
    event_id: null,
    public_recognition: true,
    created_at: fixedDaysAgo(12, 14, 20),
    confirmed_at: fixedDaysAgo(10, 15, 42),
    refunded_at: null,
    notes: "Proposta de parceria: Aporte para o Natal do Bem 2026",
    items: [],
  }
}

async function seedPartners(admin: string, campaigns: Campaign[], events: Event[], contribution: PlannedTransaction) {
  const hashed = await hashPassword(PASSWORD, 10)

  const legacy = await Partner.bulkCreate(NETWORK.map((name, index) => ({
    user_id: null,
    company_name: name,
    document: null,
    phone: null,
    website: null,
    logo_url: null,
    interests: ["institutional"] as PartnerInterest[],
    message: null,
    public_listing: true,
    status: "approved" as const,
    review_note: null,
    reviewed_at: fixedDaysAgo(500 - index, 13),
    reviewed_by: null,
    created_at: fixedDaysAgo(500 - index, 13),
    updated_at: fixedDaysAgo(500 - index, 13),
  })))

  const requests: {
    company_name: string,
    document: string,
    contact: string,
    email: string,
    phone: string,
    website: string | null,
    interests: PartnerInterest[],
    message: string,
    public_listing: boolean,
    status: PartnerStatus,
    review_note: string | null,
    days: number,
    reviewed_days: number | null,
  }[] = [
    {
      company_name: DEMO_PARTNER.company_name,
      document: DEMO_PARTNER.document,
      contact: "Carla Mendes",
      email: DEMO_PARTNER.email,
      phone: DEMO_PARTNER.phone,
      website: null,
      interests: ["sponsorship", "contribution", "volunteering"],
      message: "Somos uma indústria de embalagens de Indaiatuba e queremos apoiar a associação com aportes nas campanhas, patrocínio de eventos e um dia de voluntariado da equipe por semestre.",
      public_listing: true,
      status: "approved",
      review_note: "Bem-vindos à rede de parceiros! A captação vai ligar nesta semana para combinar a primeira ação.",
      days: 40,
      reviewed_days: 37,
    },
    {
      company_name: "Vale Verde Alimentos Ltda",
      document: "30847125000112",
      contact: "Rafael Souza",
      email: "parcerias.valeverde@exemplo.com.br",
      phone: "19 3894-5500",
      website: null,
      interests: ["in_kind", "sponsorship"],
      message: "Distribuímos alimentos na região e gostaríamos de doar os insumos do Chefs do Bem e de outros eventos com refeição, além de patrocinar uma edição.",
      public_listing: true,
      status: "pending",
      review_note: null,
      days: 2,
      reviewed_days: null,
    },
    {
      company_name: "Clínica Sorriso Pleno",
      document: "61509348000101",
      contact: "Helena Castro",
      email: "contato.sorrisopleno@exemplo.com.br",
      phone: "19 3816-2020",
      website: null,
      interests: ["in_kind", "volunteering"],
      message: "Somos uma clínica odontológica e podemos oferecer atendimento a alunos da escola e acolher dias de prevenção com a nossa equipe, dentro do calendário da casa.",
      public_listing: false,
      status: "pending",
      review_note: null,
      days: 4,
      reviewed_days: null,
    },
    {
      company_name: "Agência Impulso Digital",
      document: "72935614000176",
      contact: "Bruno Teixeira",
      email: "bruno.impulso@exemplo.com.br",
      phone: "19 99701-3344",
      website: null,
      interests: ["institutional"],
      message: "Oferecemos a gestão das redes da associação em troca da nossa marca em todo o material institucional e nas camisetas dos eventos.",
      public_listing: true,
      status: "refused",
      review_note: "Agradecemos o contato. Hoje a associação não aceita parceria em troca de marca em todo o material institucional. Se quiser apoiar uma campanha ou um evento específico, revise o pedido e mande de novo pelo painel.",
      days: 12,
      reviewed_days: 8,
    },
  ]

  const accounts = await User.bulkCreate(requests.map((request) => ({
    name: request.contact,
    email: request.email,
    hashed_password: hashed,
    role: "partner" as const,
  })), { returning: true })

  const companies = await Partner.bulkCreate(requests.map((request, index) => ({
    user_id: accounts[index].id,
    company_name: request.company_name,
    document: request.document,
    phone: request.phone,
    website: request.website,
    logo_url: null,
    interests: request.interests,
    message: request.message,
    public_listing: request.public_listing,
    status: request.status,
    review_note: request.review_note,
    reviewed_at: request.reviewed_days === null ? null : fixedDaysAgo(request.reviewed_days, 17),
    reviewed_by: request.reviewed_days === null ? null : admin,
    created_at: fixedDaysAgo(request.days, 14),
    updated_at: fixedDaysAgo(request.reviewed_days ?? request.days, 17),
  })))

  const demo = companies[0]
  const campaign = (slug: string) => (campaigns.find((item) => item.slug === slug) as Campaign).id
  const event = (slug: string) => (events.find((item) => item.slug === slug) as Event).id

  const proposals: {
    kind: ProposalKind,
    title: string,
    description: string,
    amount: string | null,
    campaign_id: string | null,
    event_id: string | null,
    status: ProposalStatus,
    response_note: string | null,
    transaction_id: string | null,
    days: number,
    reviewed_days: number | null,
  }[] = [
    {
      kind: "contribution",
      title: "Aporte para o Natal do Bem 2026",
      description: "Queremos começar a parceria com um aporte para a campanha de Natal, para as cestas e os presentes das famílias atendidas.",
      amount: money(5000),
      campaign_id: campaign("natal-do-bem-2026"),
      event_id: null,
      status: "accepted",
      response_note: "Aceito, com muita gratidão. O pagamento já está liberado aqui no painel.",
      transaction_id: contribution.id,
      days: 14,
      reviewed_days: 13,
    },
    {
      kind: "sponsorship",
      title: "Patrocínio do Jantar dos Parceiros 2026",
      description: "Patrocínio de uma cota do jantar, com a nossa marca no material do evento e dois lugares para a diretoria da empresa.",
      amount: money(3000),
      campaign_id: null,
      event_id: event("jantar-dos-parceiros-2026"),
      status: "accepted",
      response_note: "Aceito! A marca entra no material do jantar. O pagamento já está liberado aqui no painel.",
      transaction_id: null,
      days: 6,
      reviewed_days: 4,
    },
    {
      kind: "in_kind",
      title: "Embalagens para os kits do Natal do Bem",
      description: "Podemos produzir e doar as caixas dos kits de Natal, com a arte da campanha impressa, na quantidade que a coordenação precisar.",
      amount: money(1800),
      campaign_id: campaign("natal-do-bem-2026"),
      event_id: null,
      status: "accepted",
      response_note: "Aceito! A coordenação do Natal do Bem vai combinar com vocês a quantidade e a data de entrega.",
      transaction_id: null,
      days: 9,
      reviewed_days: 7,
    },
    {
      kind: "sponsorship",
      title: "Camisetas da Corrida e Caminhada",
      description: "Patrocínio das camisetas da corrida, com a nossa marca nas costas.",
      amount: money(4500),
      campaign_id: null,
      event_id: event("corrida-e-caminhada-somos-do-bem"),
      status: "refused",
      response_note: "O patrocínio das camisetas desta edição já está fechado com outro parceiro. Que tal o Jantar dos Parceiros ou a Cantata de Natal?",
      transaction_id: null,
      days: 8,
      reviewed_days: 7,
    },
    {
      kind: "campaign",
      title: "Campanha de agasalhos para as famílias atendidas",
      description: "Sugerimos uma campanha de inverno para arrecadar agasalhos e cobertores para as famílias do ambulatório, com a nossa fábrica como ponto de coleta.",
      amount: money(2000),
      campaign_id: null,
      event_id: null,
      status: "pending",
      response_note: null,
      transaction_id: null,
      days: 2,
      reviewed_days: null,
    },
    {
      kind: "volunteering",
      title: "Dia de voluntariado da equipe na Oficina Terapêutica",
      description: "Doze pessoas da nossa equipe gostariam de passar uma tarde com a Oficina Terapêutica, no dia e na atividade que a coordenação indicar.",
      amount: null,
      campaign_id: null,
      event_id: null,
      status: "pending",
      response_note: null,
      transaction_id: null,
      days: 1,
      reviewed_days: null,
    },
  ]

  const created = await PartnerProposal.bulkCreate(proposals.map((proposal) => ({
    partner_id: demo.id,
    kind: proposal.kind,
    title: proposal.title,
    description: proposal.description,
    amount: proposal.amount,
    campaign_id: proposal.campaign_id,
    event_id: proposal.event_id,
    status: proposal.status,
    response_note: proposal.response_note,
    reviewed_at: proposal.reviewed_days === null ? null : fixedDaysAgo(proposal.reviewed_days, 16),
    reviewed_by: proposal.reviewed_days === null ? null : admin,
    transaction_id: proposal.transaction_id,
    created_at: fixedDaysAgo(proposal.days, 11),
    updated_at: fixedDaysAgo(proposal.reviewed_days ?? proposal.days, 16),
  })))

  return { partners: legacy.length + companies.length, requests: companies, proposals: created }
}

// Voluntariado. A Ana Vieira (voluntario@somosdobem.org.br) é a voluntária de demonstração: tem
// horas validadas, turnos confirmados, um aguardando a coordenação e o histórico do que já fez.
// As outras pessoas são fictícias e mostram as três situações do cadastro. A escala é contada a
// partir do dia em que a carga roda; os turnos que já passaram estão com a presença fechada, menos
// o de ontem, que é o que a coordenação ainda precisa registrar.

const VOLUNTEERS: {
  name: string,
  email: string | null,
  phone: string,
  city: string | null,
  area: VolunteerArea,
  availability: VolunteerPeriod[],
  about: string,
  status: VolunteerStatus,
  review_note: string | null,
  days: number,
}[] = [
  {
    name: "Ana Vieira",
    email: null,
    phone: "19 99654-2210",
    city: "Indaiatuba",
    area: "oficina",
    availability: ["tarde", "fim-de-semana"],
    about: "Sou terapeuta ocupacional aposentada e quero ajudar nas oficinas, onde já fui voluntária em outra cidade.",
    status: "approved",
    review_note: "Bem-vinda! A orientação inicial é com a coordenação da Oficina.",
    days: 580,
  },
  {
    name: "Lucas Ferreira",
    email: "lucas.ferreira@exemplo.com.br",
    phone: "19 99812-3344",
    city: "Indaiatuba",
    area: "eventos",
    availability: ["noite", "fim-de-semana"],
    about: "Trabalho com produção de eventos e posso ajudar na montagem, na recepção e na logística dos eventos da casa.",
    status: "approved",
    review_note: null,
    days: 260,
  },
  {
    name: "Beatriz Nogueira",
    email: "beatriz.nogueira@exemplo.com.br",
    phone: "19 99733-9081",
    city: "Salto",
    area: "escola",
    availability: ["manha", "tarde"],
    about: "Sou estudante de pedagogia e quero acompanhar as atividades da escola, principalmente leitura e contação de histórias.",
    status: "approved",
    review_note: null,
    days: 190,
  },
  {
    name: "Rafael Duarte",
    email: "rafael.duarte@exemplo.com.br",
    phone: "19 99256-7710",
    city: "Indaiatuba",
    area: "comunicacao",
    availability: ["tarde", "fim-de-semana"],
    about: "Sou fotógrafo e posso registrar as atividades e os eventos para as redes sociais da associação.",
    status: "approved",
    review_note: null,
    days: 150,
  },
  {
    name: "Juliana Prado",
    email: "juliana.prado@exemplo.com.br",
    phone: "19 99145-6620",
    city: "Indaiatuba",
    area: "ambulatorio",
    availability: ["manha"],
    about: "Sou técnica de enfermagem e tenho as manhãs livres para apoiar a recepção e o acolhimento do ambulatório.",
    status: "approved",
    review_note: null,
    days: 120,
  },
  {
    name: "Pedro Henrique Lima",
    email: "pedro.lima@exemplo.com.br",
    phone: "19 99377-4105",
    city: "Indaiatuba",
    area: "administrativo",
    availability: ["manha", "tarde"],
    about: "Sou contador e posso ajudar na organização administrativa, no preparo dos kits e nos mutirões da sede.",
    status: "approved",
    review_note: null,
    days: 95,
  },
  {
    name: "Camila Rocha",
    email: "camila.rocha@exemplo.com.br",
    phone: "19 99618-2307",
    city: "Indaiatuba",
    area: "oficina",
    availability: ["tarde"],
    about: "Faço artesanato há muitos anos e gostaria de ensinar nas oficinas, uma tarde por semana.",
    status: "pending",
    review_note: null,
    days: 2,
  },
  {
    name: "Thiago Santos",
    email: "thiago.santos@exemplo.com.br",
    phone: "19 99504-8812",
    city: "Itu",
    area: "eventos",
    availability: ["fim-de-semana"],
    about: "Quero ajudar nos eventos de fim de semana, na montagem e na recepção do público.",
    status: "pending",
    review_note: null,
    days: 5,
  },
  {
    name: "Mariana Alves",
    email: "mariana.alves@exemplo.com.br",
    phone: "19 99420-1173",
    city: "Indaiatuba",
    area: "outra",
    availability: ["noite"],
    about: "Gostaria de ajudar com aulas de inglês para os jovens da escola, no período da noite.",
    status: "refused",
    review_note: "Hoje a escola não tem turma no período da noite. Se puder em outro período, ajuste o cadastro e mande de novo pelo painel.",
    days: 30,
  },
]

type PlannedShift = {
  activity: string,
  area: VolunteerArea,
  place: string,
  coordinator: string,
  description: string | null,
  day: number,
  from: [number, number],
  to: [number, number],
  slots: number,
  // Quem está no turno, pelo nome, e em que situação. Horas só em quem esteve presente e saiu
  // antes do fim.
  people: { name: string, status: AssignmentStatus, hours?: string }[],
}

const SHIFTS: PlannedShift[] = [
  {
    activity: "Preparo de kits para as famílias",
    area: "administrativo",
    place: "Sede administrativa",
    coordinator: "Serviço Social",
    description: null,
    day: -40,
    from: [9, 0],
    to: [12, 0],
    slots: 6,
    people: [
      { name: "Ana Vieira", status: "attended" },
      { name: "Pedro Henrique Lima", status: "attended" },
      { name: "Juliana Prado", status: "absent" },
    ],
  },
  {
    activity: "Apoio na Oficina Terapêutica",
    area: "oficina",
    place: "Oficina Terapêutica",
    coordinator: "Coordenação da Oficina",
    description: null,
    day: -26,
    from: [14, 0],
    to: [17, 0],
    slots: 3,
    people: [
      { name: "Ana Vieira", status: "attended" },
      { name: "Beatriz Nogueira", status: "attended" },
    ],
  },
  {
    activity: "Recepção no Bazar Solidário",
    area: "eventos",
    place: "Salão de eventos da sede",
    coordinator: "Coordenação de Eventos",
    description: null,
    day: -12,
    from: [9, 0],
    to: [13, 0],
    slots: 5,
    people: [
      { name: "Ana Vieira", status: "attended" },
      { name: "Lucas Ferreira", status: "attended" },
      { name: "Rafael Duarte", status: "attended", hours: "3.50" },
    ],
  },
  {
    activity: "Apoio na Escola de Educação Especial",
    area: "escola",
    place: "Escola de Educação Especial",
    coordinator: "Coordenação Pedagógica",
    description: null,
    day: -5,
    from: [13, 0],
    to: [17, 0],
    slots: 3,
    people: [
      { name: "Ana Vieira", status: "attended" },
      { name: "Beatriz Nogueira", status: "attended" },
    ],
  },
  {
    activity: "Organização do estoque do bazar",
    area: "administrativo",
    place: "Sede administrativa",
    coordinator: "Coordenação de Captação",
    description: null,
    day: -1,
    from: [9, 0],
    to: [12, 0],
    slots: 4,
    people: [
      { name: "Pedro Henrique Lima", status: "confirmed" },
      { name: "Lucas Ferreira", status: "confirmed" },
    ],
  },
  {
    activity: "Apoio na Oficina Terapêutica",
    area: "oficina",
    place: "Oficina Terapêutica",
    coordinator: "Coordenação da Oficina",
    description: "Acompanhar os alunos na produção das peças do bazar de Natal.",
    day: 2,
    from: [14, 0],
    to: [17, 0],
    slots: 3,
    people: [
      { name: "Ana Vieira", status: "confirmed" },
      { name: "Beatriz Nogueira", status: "pending" },
    ],
  },
  {
    activity: "Recepção no Dia de Portas Abertas",
    area: "eventos",
    place: "Ambulatório",
    coordinator: "Coordenação de Eventos",
    description: "Receber as famílias, apresentar a casa e conduzir os grupos pelas salas.",
    day: 5,
    from: [9, 0],
    to: [13, 0],
    slots: 6,
    people: [
      { name: "Ana Vieira", status: "confirmed" },
      { name: "Lucas Ferreira", status: "confirmed" },
      { name: "Juliana Prado", status: "pending" },
    ],
  },
  {
    activity: "Montagem do bazar beneficente",
    area: "eventos",
    place: "Sede administrativa",
    coordinator: "Coordenação de Captação",
    description: null,
    day: 9,
    from: [8, 30],
    to: [12, 0],
    slots: 4,
    people: [
      { name: "Ana Vieira", status: "pending" },
      { name: "Pedro Henrique Lima", status: "confirmed" },
    ],
  },
  {
    activity: "Leitura e contação de histórias",
    area: "escola",
    place: "Escola de Educação Especial",
    coordinator: "Coordenação Pedagógica",
    description: null,
    day: 12,
    from: [9, 0],
    to: [11, 0],
    slots: 2,
    people: [
      { name: "Beatriz Nogueira", status: "confirmed" },
    ],
  },
  {
    activity: "Fotos e vídeo para as redes sociais",
    area: "comunicacao",
    place: "Sede e oficinas",
    coordinator: "Comunicação",
    description: "Registrar as atividades da semana para o Instagram e o site.",
    day: 16,
    from: [13, 0],
    to: [16, 0],
    slots: 2,
    people: [],
  },
  {
    activity: "Acolhimento no ambulatório",
    area: "ambulatorio",
    place: "Ambulatório",
    coordinator: "Coordenação do Ambulatório",
    description: null,
    day: 20,
    from: [8, 0],
    to: [12, 0],
    slots: 3,
    people: [
      { name: "Juliana Prado", status: "confirmed" },
    ],
  },
  {
    activity: "Mutirão de Natal: separação das doações",
    area: "administrativo",
    place: "Sede administrativa",
    coordinator: "Coordenação do Natal do Bem",
    description: "Separar e conferir os itens doados para os kits de Natal.",
    day: 30,
    from: [9, 0],
    to: [15, 0],
    slots: 10,
    people: [
      { name: "Pedro Henrique Lima", status: "pending" },
    ],
  },
]

async function seedVolunteers(demo: User, coordinator: string) {
  const hashed = await hashPassword(PASSWORD, 10)
  const others = VOLUNTEERS.filter((volunteer) => volunteer.email !== null)

  const accounts = await User.bulkCreate(others.map((volunteer) => ({
    name: volunteer.name,
    email: volunteer.email as string,
    hashed_password: hashed,
    role: "volunteer" as const,
  })), { returning: true })

  const userOf = (name: string) => (name === demo.name ? demo : accounts.find((account) => account.name === name) as User)

  const volunteers = await Volunteer.bulkCreate(VOLUNTEERS.map((volunteer) => ({
    user_id: userOf(volunteer.name).id,
    phone: volunteer.phone,
    city: volunteer.city,
    area: volunteer.area,
    availability: volunteer.availability,
    about: volunteer.about,
    status: volunteer.status,
    review_note: volunteer.review_note,
    reviewed_at: volunteer.status === "pending" ? null : fixedDaysAgo(volunteer.days - 2, 16),
    reviewed_by: volunteer.status === "pending" ? null : coordinator,
    created_at: fixedDaysAgo(volunteer.days, 12),
    updated_at: fixedDaysAgo(volunteer.status === "pending" ? volunteer.days : volunteer.days - 2, 16),
  })))

  const volunteerOf = (name: string) => volunteers[VOLUNTEERS.findIndex((volunteer) => volunteer.name === name)]

  const holding: AssignmentStatus[] = ["pending", "confirmed", "attended", "absent"]

  const shifts = await VolunteerShift.bulkCreate(SHIFTS.map((shift) => ({
    activity: shift.activity,
    area: shift.area,
    place: shift.place,
    coordinator: shift.coordinator,
    description: shift.description,
    starts_at: fromToday(shift.day, shift.from[0], shift.from[1]),
    ends_at: fromToday(shift.day, shift.to[0], shift.to[1]),
    slots: shift.slots,
    taken_slots: shift.people.filter((person) => holding.includes(person.status)).length,
    status: "open" as const,
    created_by: coordinator,
    created_at: fromToday(Math.min(shift.day, 0) - 7, 10),
    updated_at: fromToday(Math.min(shift.day, 0) - 7, 10),
  })))

  const assignments = await VolunteerAssignment.bulkCreate(SHIFTS.flatMap((shift, index) => {
    const starts = fromToday(shift.day, shift.from[0], shift.from[1])
    const ends = fromToday(shift.day, shift.to[0], shift.to[1])
    const duration = money((ends.getTime() - starts.getTime()) / 3_600_000)

    return shift.people.map((person) => ({
      shift_id: shifts[index].id,
      volunteer_id: volunteerOf(person.name).id,
      status: person.status,
      hours: person.status === "attended" ? person.hours ?? duration : null,
      checked_at: person.status === "attended" || person.status === "absent" ? ends : null,
      checked_by: person.status === "attended" || person.status === "absent" ? coordinator : null,
      created_at: fromToday(Math.min(shift.day, 0) - 5, 11),
      updated_at: fromToday(Math.min(shift.day, 0) - 5, 11),
    }))
  }))

  return { volunteers, shifts, assignments }
}

// Redes sociais. Publicações de Instagram e Facebook sobre o que esta carga já tem (campanhas,
// eventos e programas), com as fotos que o site já serve e sem inventar resultado. O link de cada
// uma leva ao perfil real da associação, porque o endereço de uma publicação de verdade só a
// associação tem. Não há vídeo do YouTube: um id inventado abriria o player com erro, e o primeiro
// vídeo entra pelo painel. Uma publicação está escondida, para o painel mostrar as duas situações.

const INSTAGRAM = "https://www.instagram.com/somosdobem.indaiatuba/"
const FACEBOOK = "https://www.facebook.com/somosdobem.indaiatuba"

async function seedSocialPosts(author: string) {
  const posts: { network: SocialNetwork, caption: string, image_url: string, days: number, visible?: boolean }[] = [
    {
      network: "instagram",
      caption: "O Natal do Bem 2026 começou! 🎄 Cestas, presentes e uma ceia para as famílias atendidas pela associação. Toda doação confirmada gera recibo verificável e certificado, e quem quiser pode deixar o nome no Mural do Bem. Doe pelo site: link na bio.",
      image_url: "/imagens/campanhas/natal-do-bem-2026.jpg",
      days: 1,
    },
    {
      network: "facebook",
      caption: "Vem aí a 6ª edição do Chefs do Bem! Três noites de jantar beneficente com chefs convidados de Indaiatuba, e toda a renda sustenta o Ambulatório. Os convites já estão à venda no site.",
      image_url: "/imagens/eventos/chefs-do-bem-6a-edicao.png",
      days: 3,
    },
    {
      network: "instagram",
      caption: "Na Oficina Terapêutica, autonomia, convivência e trabalho protegido para jovens e adultos atendidos pela associação. 🧶",
      image_url: "/imagens/oficina.jpeg",
      days: 6,
    },
    {
      network: "instagram",
      caption: "Dia de Portas Abertas: visita guiada pelo Ambulatório e pela Oficina Terapêutica, com as famílias contando o que muda no dia a dia. A entrada é gratuita, com inscrição pelo site.",
      image_url: "/imagens/eventos/dia-de-portas-abertas.jpg",
      days: 10,
    },
    {
      network: "facebook",
      caption: "Na Escola de Educação Especial, o ensino é adaptado ao ritmo de cada estudante e construído junto com a família. Conheça o programa no nosso site.",
      image_url: "/imagens/educacional.png",
      days: 15,
    },
    {
      network: "instagram",
      caption: "O Ambulatório atende de forma clínica, terapêutica e de reabilitação, com acompanhamento contínuo da pessoa e da família. 💙",
      image_url: "/imagens/programa-ambulatorio.jpg",
      days: 21,
    },
    {
      network: "instagram",
      caption: "Somos do Bem: um nome novo para a mesma história de cuidado em Indaiatuba.",
      image_url: "/imagens/noticias/mudanca-de-nome.png",
      days: 30,
    },
    {
      network: "facebook",
      caption: "Obrigado a todo mundo que fez parte do Chocolate do Bem 2026! Cada caixa vendida virou material da Escola de Educação Especial.",
      image_url: "/imagens/eventos/chocolate-do-bem-2026.png",
      days: 45,
    },
    {
      network: "instagram",
      caption: "Desde 1976 em Indaiatuba, cuidando da inclusão de pessoas com deficiência. Conheça a nossa história no site.",
      image_url: "/imagens/institucional-missao.jpg",
      days: 60,
    },
    {
      network: "instagram",
      caption: "Bastidores: a sala de fisioterapia vai passar por reforma, e a campanha abre em breve.",
      image_url: "/imagens/sobre-nos.jpg",
      days: 70,
      visible: false,
    },
  ]

  return await SocialPost.bulkCreate(posts.map((post) => ({
    network: post.network,
    url: post.network === "instagram" ? INSTAGRAM : FACEBOOK,
    external_id: null,
    caption: post.caption,
    image_url: post.image_url,
    video_id: null,
    published_at: fixedDaysAgo(post.days, 15),
    visible: post.visible ?? true,
    created_by: author,
    created_at: fixedDaysAgo(post.days, 16),
    updated_at: fixedDaysAgo(post.days, 16),
  })))
}

async function run() {
  await sequelize.authenticate()

  await wipe()

  const users = await seedUsers()
  const campaigns = await seedCampaigns()
  const events = await seedEvents(campaigns)
  const products = await seedProducts()
  const donors = await seedDonors()

  const communication = users.find((user) => user.role === "communication") as User
  const posts = await seedPosts(communication.id)
  const assets = await seedAssets(communication.id)
  const designs = await seedCertificateDesigns(assets, campaigns, events, communication.id)

  const planned = plan(donors, campaigns, events, products)

  // O aporte da empresa parceira entra depois do sorteio, para não deslocar as outras transações.
  const partnerDonor = await seedPartnerDonor()
  const contribution = partnerContribution(partnerDonor, campaigns)
  planned.push(contribution)

  await seedTransactions(planned)
  const receipts = await seedReceipts(planned, designs)
  const logs = await seedAuditLogs(planned, users[1].id)
  await applySideEffects(planned)

  const admin = users.find((user) => user.role === "admin") as User
  const registrations = await seedRegistrations(planned, events, communication.id)
  const messages = await seedContactMessages(planned, communication.id, admin.id)
  const partners = await seedPartners(admin.id, campaigns, events, contribution)
  const volunteering = await seedVolunteers(users.find((user) => user.role === "volunteer") as User, communication.id)
  const social = await seedSocialPosts(communication.id)

  const listed = new Set(planned
    .filter((transaction) => transaction.confirmed_at && !transaction.refunded_at && transaction.public_recognition)
    .map((transaction) => transaction.donor.id))

  const valid = receipts.filter((receipt) => receipt.status === "issued")
  const cancelled = receipts.filter((receipt) => receipt.status === "cancelled")

  console.log("")
  console.log("Carga de demonstração concluída")
  console.log(`  usuários ............ ${await User.count()} (${users.length} da equipe, o resto de voluntários e empresas)`)
  console.log(`  campanhas ........... ${campaigns.length}`)
  console.log(`  eventos ............. ${events.length}`)
  console.log(`  produtos ............ ${products.length}`)
  console.log(`  doadores ............ ${donors.length + 1} (um é a empresa parceira de demonstração)`)
  console.log(`  transações .......... ${planned.length}`)
  console.log(`  recibos ............. ${receipts.length} (${cancelled.length} cancelados por estorno)`)
  console.log(`  linhas de auditoria . ${logs}`)
  console.log(`  notícias ............ ${posts.length}`)
  console.log(`  imagens ............. ${assets.size} na biblioteca de certificados`)
  console.log(`  certificados ........ ${designs.length} versões`)
  console.log(`  Mural do Bem ........ ${listed.size} nomes`)
  console.log(`  inscrições .......... ${registrations.length} (${registrations.filter((row) => row.checked_in_at).length} com entrada registrada)`)
  console.log(`  mensagens ........... ${messages.length} na caixa de entrada`)
  console.log(`  parceiros ........... ${partners.partners} (${partners.requests.filter((row) => row.status === "pending").length} pedidos em análise)`)
  console.log(`  propostas ........... ${partners.proposals.length} da empresa de demonstração`)
  console.log(`  voluntários ......... ${volunteering.volunteers.length} (${volunteering.volunteers.filter((row) => row.status === "pending").length} em análise)`)
  console.log(`  turnos .............. ${volunteering.shifts.length}, com ${volunteering.assignments.length} participações`)
  console.log(`  redes sociais ....... ${social.length} publicações`)
  console.log("")
  console.log(`  senha de todos os acessos: ${PASSWORD}`)
  console.log(`  parceiro de demonstração: ${DEMO_PARTNER.email}`)
  console.log("")
  console.log("  hashes para testar /recibo/verificar:")
  console.log(`    válido ...... ${valid[valid.length - 1]?.hash}`)
  console.log(`    cancelado ... ${cancelled[0]?.hash}`)
  console.log("")
  console.log("  código de inscrição para testar /inscricao/:codigo:")
  console.log(`    ${formatTicketCode(registrations.find((row) => row.status === "confirmed" && !row.checked_in_at)?.ticket_code ?? "")}`)
  console.log("")

  await sequelize.close()
}

run().catch(async (error: unknown) => {
  console.error(error)
  await sequelize.close()
  process.exit(1)
})
