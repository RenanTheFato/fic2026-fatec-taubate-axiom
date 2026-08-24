import { NotFoundError } from "../../config/errors.js";
import { TransactionInterface } from "../../interfaces/transaction-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { Donor } from "../../models/donor-model.js";
import { Event } from "../../models/event-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { TransactionAuditLog } from "../../models/transaction-audit-log-model.js";

export class GetTransactionService {
  async execute({ id }: Pick<TransactionInterface, 'id'>) {
    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: Donor, as: "donor", attributes: ["id", "name", "email", "document", "document_type", "phone"] },
        { model: Campaign, as: "campaign", attributes: ["id", "title", "slug"] },
        { model: Event, as: "event", attributes: ["id", "title", "slug", "starts_at"] },
        { model: TransactionAuditLog, as: "audit_logs" },
      ],
      order: [
        [{ model: TransactionAuditLog, as: "audit_logs" }, "created_at", "ASC"],
      ],
    })

    if (!transaction) {
      throw new NotFoundError("Transaction Not Found")
    }

    return transaction.get({ plain: true })
  }
}
