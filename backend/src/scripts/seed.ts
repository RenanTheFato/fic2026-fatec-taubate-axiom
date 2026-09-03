import { randomUUID } from "node:crypto";
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
import { buildReceiptHash, buildReceiptNumber, truncateToSecond } from "../utils/receipt-hash.js";
import type { PaymentMethod, TransactionStatus, TransactionType } from "../models/transaction-model.js";

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
// fictícios, porque dado pessoal real não entra em base de demonstração.

const PASSWORD = "Somos@2026"

const NOW = new Date("2026-09-03T12:00:00.000Z")

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

// Truncate ignora chave estrangeira, então a checagem é desligada só para a limpeza. A ordem
// continua sendo a das dependências para o dia em que isto virar DELETE.
async function wipe() {
  const tables = [
    "transaction_audit_logs",
    "receipts",
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

// Campanhas: as três frentes que a associação sustenta, mais uma encerrada e uma em rascunho

async function seedCampaigns() {
  return await Campaign.bulkCreate([
    {
      title: "Ambulatório: atendimento contínuo",
      slug: "ambulatorio-atendimento-continuo",
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
  ])
}

// Eventos: os três com foto em `public/imagens/eventos/` mantêm o slug do arquivo

async function seedEvents(campaigns: Campaign[]) {
  const escola = campaigns.find((campaign) => campaign.slug === "escola-de-educacao-especial")
  const ambulatorio = campaigns.find((campaign) => campaign.slug === "ambulatorio-atendimento-continuo")
  const chocolate = campaigns.find((campaign) => campaign.slug === "chocolate-do-bem-2026")

  return await Event.bulkCreate([
    {
      campaign_id: ambulatorio?.id ?? null,
      title: "6ª edição do Chefs do Bem",
      slug: "chefs-do-bem-6a-edicao",
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

  while (rows.length < 26) {
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
  created_at: Date,
  confirmed_at: Date | null,
  refunded_at: Date | null,
  notes: string | null,
  items: { product_id: string, description: string, quantity: number, unit_price: string }[],
}

const DONATION_AMOUNTS = [30, 50, 50, 75, 100, 100, 100, 150, 200, 250, 300, 500, 1000]

const SPONSORSHIP_AMOUNTS = [2500, 3000, 5000, 7500, 10000]

const PAYMENT_METHODS: PaymentMethod[] = ["pix", "credit_card", "debit_card", "boleto"]

function plan(donors: Donor[], campaigns: Campaign[], events: Event[], products: Product[]) {
  const planned: PlannedTransaction[] = []

  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active" || campaign.status === "finished")
  const sellableEvents = events.filter((event) => Number(event.ticket_price) > 0 && event.status !== "draft")
  const sellableProducts = products.filter((product) => product.active && product.stock > 0)
  const individuals = donors.filter((donor) => donor.document_type === "cpf")
  const companies = donors.filter((donor) => donor.document_type === "cnpj")

  // Doações avulsas ao longo de doze meses. A maioria confirma: é o caminho normal e é o que o
  // painel precisa mostrar. Os outros estados existem porque a tela de reconciliação é sobre eles.
  for (let index = 0; index < 46; index += 1) {
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
      campaign_id: random() < 0.75 ? pick(activeCampaigns).id : null,
      event_id: null,
      created_at: created,
      confirmed_at: null,
      refunded_at: null,
      notes: null,
      items: [],
    })
  }

  // Patrocínio de empresa: valor alto, sempre ligado a uma campanha, e é o que sustenta o custo fixo
  for (let index = 0; index < 9; index += 1) {
    const created = daysAgo(Math.floor(random() * 330) + 10, 14)

    planned.push({
      id: randomUUID(),
      type: "sponsorship",
      status: random() < 0.85 ? "confirmed" : "pending",
      amount: money(pick(SPONSORSHIP_AMOUNTS)),
      payment_method: "boleto",
      donor: pick(companies),
      campaign_id: pick(activeCampaigns).id,
      event_id: null,
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
      created_at: created,
      confirmed_at: null,
      refunded_at: null,
      notes: null,
      items: [],
    })
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

// A corrente. Um recibo por transação confirmada, na ordem em que foram confirmadas, cada um
// carregando o hash do anterior. `sequence` não pode ter buraco: verificar a corrente é caminhar
// de sequence em sequence.
async function seedReceipts(planned: PlannedTransaction[]) {
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

async function run() {
  await sequelize.authenticate()

  await wipe()

  const users = await seedUsers()
  const campaigns = await seedCampaigns()
  const events = await seedEvents(campaigns)
  const products = await seedProducts()
  const donors = await seedDonors()

  const planned = plan(donors, campaigns, events, products)

  await seedTransactions(planned)
  const receipts = await seedReceipts(planned)
  const logs = await seedAuditLogs(planned, users[1].id)
  await applySideEffects(planned)

  const valid = receipts.filter((receipt) => receipt.status === "issued")
  const cancelled = receipts.filter((receipt) => receipt.status === "cancelled")

  console.log("")
  console.log("Carga de demonstração concluída")
  console.log(`  usuários ............ ${users.length}`)
  console.log(`  campanhas ........... ${campaigns.length}`)
  console.log(`  eventos ............. ${events.length}`)
  console.log(`  produtos ............ ${products.length}`)
  console.log(`  doadores ............ ${donors.length}`)
  console.log(`  transações .......... ${planned.length}`)
  console.log(`  recibos ............. ${receipts.length} (${cancelled.length} cancelados por estorno)`)
  console.log(`  linhas de auditoria . ${logs}`)
  console.log("")
  console.log(`  senha de todos os acessos: ${PASSWORD}`)
  console.log("")
  console.log("  hashes para testar /recibo/verificar:")
  console.log(`    válido ...... ${valid[valid.length - 1]?.hash}`)
  console.log(`    cancelado ... ${cancelled[0]?.hash}`)
  console.log("")

  await sequelize.close()
}

run().catch(async (error: unknown) => {
  console.error(error)
  await sequelize.close()
  process.exit(1)
})
