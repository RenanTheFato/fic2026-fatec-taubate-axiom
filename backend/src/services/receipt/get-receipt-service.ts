import { NotFoundError } from "../../config/errors.js";
import { ReceiptInterface } from "../../interfaces/receipt-interface.js";
import { Receipt } from "../../models/receipt-model.js";
import { Transaction } from "../../models/transaction-model.js";

interface GetReceiptProps {
  id: ReceiptInterface['id'],
}

export class GetReceiptService {
  async execute({ id }: GetReceiptProps) {

    const receipt = await Receipt.findByPk(id, {
      include: [
        { model: Transaction, as: "transaction", attributes: ["id", "type", "status", "amount", "payment_method", "campaign_id", "event_id", "confirmed_at"] },
      ],
    })

    if (!receipt) {
      throw new NotFoundError("Receipt Not Found")
    }

    return receipt
  }
}
