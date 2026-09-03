import { BadRequestError } from "../../config/errors.js";
import { StripeGateway } from "../../config/stripe.js";
import { sequelize } from "../../config/sequelize.js";
import { DonorInterface } from "../../interfaces/donor-interface.js";
import { TransactionInterface } from "../../interfaces/transaction-interface.js";
import { TransactionItemInterface } from "../../interfaces/transaction-item-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";
import { Product } from "../../models/product-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { TransactionAuditLog } from "../../models/transaction-audit-log-model.js";
import { TransactionItem } from "../../models/transaction-item-model.js";
import { fromCents, toCents } from "../../utils/money.js";
import { CreateDonorService } from "../donor/create-donor-service.js";

const TITLE_BY_TYPE: Record<TransactionInterface['type'], string> = {
  donation: "Doação para a Somos do Bem",
  sponsorship: "Patrocínio à Somos do Bem",
  ticket: "Convite Somos do Bem",
  product: "Produto Somos do Bem",
}

const MAX_AMOUNT = 99999999.99

type PricedLine = Pick<TransactionItemInterface, "product_id" | "description" | "quantity" | "unit_price">

// A única soma de dinheiro em JavaScript de toda a API, e por necessidade: ainda não existe linha
// no banco para usar increment. Acontece em centavos inteiros, pela mesma razão que utils/money.ts
// explica: em ponto flutuante somar "0.10" + "0.20" dá 0.30000000000000004, e um centavo de
// diferença aqui vira divergência com o valor cobrado pelo gateway.
function sumLines(lines: PricedLine[]) {
  return fromCents(lines.reduce((total, line) => total + toCents(line.unit_price) * line.quantity, 0))
}

interface CreateTransactionItemProps {
  product_id: string,
  quantity: number,
}

interface CreateTransactionProps {
  type: TransactionInterface['type'],
  amount?: TransactionInterface['amount'],
  items: CreateTransactionItemProps[],
  campaign_id: TransactionInterface['campaign_id'],
  event_id: TransactionInterface['event_id'],
  notes: TransactionInterface['notes'],
  donor_name: DonorInterface['name'],
  donor_email: DonorInterface['email'],
  donor_document: DonorInterface['document'],
  donor_phone: DonorInterface['phone'],
}

export class CreateTransactionService {
  async execute({ type, amount, items, campaign_id, event_id, notes, donor_name, donor_email, donor_document, donor_phone }: CreateTransactionProps) {

    // Convite exige evento e patrocínio exige campanha ou evento: sem isso a transação nasce
    // sem nada a que se referir e o painel financeiro não consegue atribuir a receita.
    if (type === "ticket" && !event_id) {
      throw new BadRequestError("A ticket transaction requires an event")
    }

    if (type === "sponsorship" && !campaign_id && !event_id) {
      throw new BadRequestError("A sponsorship transaction requires a campaign or an event")
    }

    if (campaign_id) {
      const campaign = await Campaign.findByPk(campaign_id)

      if (!campaign) {
        throw new BadRequestError("The informed campaign doesn't exist")
      }

      if (campaign.status !== "active") {
        throw new BadRequestError("Only an active campaign can receive new transactions")
      }
    }

    let event: Event | null = null

    if (event_id) {
      event = await Event.findByPk(event_id)

      if (!event) {
        throw new BadRequestError("The informed event doesn't exist")
      }

      if (event.status !== "published") {
        throw new BadRequestError("Only a published event can receive new transactions")
      }

      // A vaga só é debitada na confirmação, mas deixar comprar convite de evento já lotado só
      // gera estorno depois. A checagem é só do convite: doação e patrocínio apontam para o evento
      // sem ocupar lugar nenhum, e recusá-los por lotação seria recusar dinheiro sem motivo.
      if (type === "ticket" && event.capacity !== null && event.taken_seats >= event.capacity) {
        throw new BadRequestError("The event has no seats left")
      }
    }

    // Onde nasce o preço decide tudo o que vem abaixo. Doação e patrocínio têm valor livre: é o
    // doador que escolhe quanto dar. Produto e convite têm valor de tabela, e aceitá-lo do corpo
    // da requisição seria deixar qualquer pessoa comprar uma camiseta por um centavo.
    const { lines, total } = type === "product"
      ? await this.priceProducts(items)
      : type === "ticket"
        ? this.priceTicket(event as Event)
        : { lines: [] as PricedLine[], total: amount as string }

    if (Number(total) <= 0) {
      throw new BadRequestError("The amount must be greater than zero")
    }

    if (Number(total) > MAX_AMOUNT) {
      throw new BadRequestError("The amount has exceeded the maximum allowed value")
    }

    // O doador vem do formulário, nunca do gateway: a transação nasce pending antes de existir
    // pagamento, e donor_id é NOT NULL. O find-or-create já é do CreateDonorService.
    const { donor } = await new CreateDonorService().execute({
      name: donor_name,
      email: donor_email,
      document: donor_document,
      phone: donor_phone,
    })

    const { transaction, created_items } = await sequelize.transaction(async (t) => {
      const created = await Transaction.create({
        type,
        status: "pending",
        amount: total,
        donor_id: donor.id,
        campaign_id,
        event_id,
        notes,
      }, { transaction: t })

      // Ou nasce transação com os itens que a justificam, ou não nasce nada: um valor que
      // não corresponde ao que foi comprado é exatamente o que a itemização existe para impedir.
      const written = lines.length > 0
        ? await TransactionItem.bulkCreate(
          lines.map((line) => ({ ...line, transaction_id: created.id })),
          { transaction: t }
        )
        : []

      // não existe transação sem registro de auditoria, nem a própria criação.
      await TransactionAuditLog.create({
        transaction_id: created.id,
        previous_status: null,
        new_status: "pending",
        source: "system",
        performed_by: null,
        reason: "Transaction created",
      }, { transaction: t })

      return { transaction: created, created_items: written }
    })

    // A sessão é criada fora da transação de banco: chamada de rede não pode segurar trava
    // de linha. Se o gateway falhar, a transação fica pending sem checkout e a rotina de
    // reconciliação a resolve: o oposto (checkout sem transação) seria dinheiro sem destino.
    const { gateway_checkout_id, checkout_url } = await new StripeGateway().createCheckoutSession({
      transaction_id: transaction.id,
      title: TITLE_BY_TYPE[type],
      amount: total,
      payer_name: donor.name,
      payer_email: donor.email,
    })

    await transaction.update({ gateway_checkout_id, checkout_url })

    return {
      ...transaction.get({ plain: true }),
      items: created_items.map((item) => item.get({ plain: true })),
    }
  }

  // Preço, nome e disponibilidade saem do catálogo. O corpo da requisição só diz o quê e quanto.
  private async priceProducts(items: CreateTransactionItemProps[]) {
    // O mesmo produto pedido em duas linhas vira uma só. Sem isso, duas linhas de 2 unidades
    // passariam pela conferência de estoque de 3 uma a uma e venderiam 4.
    const requested = new Map<string, number>()

    for (const item of items) {
      requested.set(item.product_id, (requested.get(item.product_id) ?? 0) + item.quantity)
    }

    const products = await Product.findAll({ where: { id: [...requested.keys()] } })
    const byId = new Map(products.map((product) => [product.id, product]))

    const lines: PricedLine[] = []

    for (const [product_id, quantity] of requested) {
      const product = byId.get(product_id)

      if (!product) {
        throw new BadRequestError("The informed product doesn't exist")
      }

      if (!product.active) {
        throw new BadRequestError(`The product "${product.name}" is not available`)
      }

      // O estoque é conferido sem ser debitado: a baixa é da confirmação, mas deixar comprar
      // item esgotado só gera estorno depois. É a mesma leitura da vaga do evento acima.
      if (product.stock < quantity) {
        throw new BadRequestError(`The product "${product.name}" has no stock left`)
      }

      lines.push({
        product_id: product.id,
        description: product.name,
        quantity,
        unit_price: product.price,
      })
    }

    return { lines, total: sumLines(lines) }
  }

  private priceTicket(event: Event) {
    if (Number(event.ticket_price) <= 0) {
      throw new BadRequestError("A free event doesn't require a checkout")
    }

    // Uma transação, um convite. Comprar vários de uma vez depende de a confirmação debitar
    // taken_seats pela quantidade, e não de um em um como faz hoje.
    const lines: PricedLine[] = [{
      product_id: null,
      description: event.title,
      quantity: 1,
      unit_price: event.ticket_price,
    }]

    return { lines, total: event.ticket_price }
  }
}
