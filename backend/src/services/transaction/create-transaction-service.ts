import { BadRequestError } from "../../config/errors.js";
import { StripeGateway } from "../../config/stripe.js";
import { sequelize } from "../../config/sequelize.js";
import { DonorInterface } from "../../interfaces/donor-interface.js";
import { TransactionInterface } from "../../interfaces/transaction-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { TransactionAuditLog } from "../../models/transaction-audit-log-model.js";
import { CreateDonorService } from "../donor/create-donor-service.js";

const TITLE_BY_TYPE: Record<TransactionInterface['type'], string> = {
  donation: "Doação — Somos do Bem",
  sponsorship: "Patrocínio — Somos do Bem",
  ticket: "Convite — Somos do Bem",
  product: "Produto — Somos do Bem",
}

interface CreateTransactionProps {
  type: TransactionInterface['type'],
  amount: TransactionInterface['amount'],
  campaign_id: TransactionInterface['campaign_id'],
  event_id: TransactionInterface['event_id'],
  notes: TransactionInterface['notes'],
  donor_name: DonorInterface['name'],
  donor_email: DonorInterface['email'],
  donor_document: DonorInterface['document'],
  donor_phone: DonorInterface['phone'],
}

export class CreateTransactionService {
  async execute({ type, amount, campaign_id, event_id, notes, donor_name, donor_email, donor_document, donor_phone }: CreateTransactionProps) {

    if (Number(amount) <= 0) {
      throw new BadRequestError("The amount must be greater than zero")
    }

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

    if (event_id) {
      const event = await Event.findByPk(event_id)

      if (!event) {
        throw new BadRequestError("The informed event doesn't exist")
      }

      if (event.status !== "published") {
        throw new BadRequestError("Only a published event can receive new transactions")
      }

      // A vaga só é debitada na confirmação, mas deixar comprar convite de evento
      // já lotado só gera estorno depois.
      if (event.capacity !== null && event.taken_seats >= event.capacity) {
        throw new BadRequestError("The event has no seats left")
      }
    }

    // O doador vem do formulário, nunca do gateway: a transação nasce pending antes de existir
    // pagamento, e donor_id é NOT NULL. O find-or-create já é do CreateDonorService.
    const { donor } = await new CreateDonorService().execute({
      name: donor_name,
      email: donor_email,
      document: donor_document,
      phone: donor_phone,
    })

    const transaction = await sequelize.transaction(async (t) => {
      const created = await Transaction.create({
        type,
        status: "pending",
        amount,
        donor_id: donor.id,
        campaign_id,
        event_id,
        notes,
      }, { transaction: t })

      // não existe transação sem registro de auditoria, nem a própria criação.
      await TransactionAuditLog.create({
        transaction_id: created.id,
        previous_status: null,
        new_status: "pending",
        source: "system",
        performed_by: null,
        reason: "Transaction created",
      }, { transaction: t })

      return created
    })

    // A sessão é criada fora da transação de banco: chamada de rede não pode segurar trava
    // de linha. Se o gateway falhar, a transação fica pending sem checkout e a rotina de
    // reconciliação a resolve — o oposto (checkout sem transação) seria dinheiro sem destino.
    const { gateway_checkout_id, checkout_url } = await new StripeGateway().createCheckoutSession({
      transaction_id: transaction.id,
      title: TITLE_BY_TYPE[type],
      amount,
      payer_name: donor.name,
      payer_email: donor.email,
    })

    await transaction.update({ gateway_checkout_id, checkout_url })

    return transaction.get({ plain: true })
  }
}
