import Stripe from "stripe";
import { env } from "./env.js";
import { PaymentMethod, TransactionStatus } from "../models/transaction-model.js";

const client = new Stripe(env.STRIPE_SECRET_KEY)

// O status do Stripe não é o status da transação: a tradução mora aqui, num lugar só, senão
// cada service inventa a própria e dois caminhos discordam sobre o mesmo pagamento.
const STATUS_BY_INTENT_STATUS: Record<string, TransactionStatus> = {
  requires_payment_method: "pending",
  requires_confirmation: "pending",
  requires_action: "pending",
  processing: "awaiting_confirmation",
  requires_capture: "awaiting_confirmation",
  succeeded: "confirmed",
  canceled: "cancelled",
}

const METHOD_BY_GATEWAY_TYPE: Record<string, PaymentMethod> = {
  pix: "pix",
  boleto: "boleto",
  card: "credit_card",
}

export interface GatewayPayment {
  gateway_payment_id: string,
  status: TransactionStatus,
  payment_method: PaymentMethod | null,
  // Em centavos inteiros, como o Stripe entrega. Dividir por 100 aqui só criaria um float para
  // ser comparado com um DECIMAL depois: a conferência de valor é feita em centavo contra centavo.
  amount_cents: number,
  refunded_cents: number,
  // Estorno parcial não é estorno: reverter tudo por causa dele devolveria à campanha um valor
  // que não voltou ao doador. Fica sinalizado para a reconciliação decidir.
  partially_refunded: boolean,
  transaction_id: string | null,
}

export interface CreateCheckoutSessionParams {
  transaction_id: string,
  title: string,
  amount: string,
  payer_name: string,
  payer_email: string,
}

// O cartão só se revela crédito ou débito no charge, e não no tipo do método: sem olhar o
// funding toda compra no cartão viraria credit_card no painel financeiro.
function methodFromCharge(charge: Stripe.Charge | null) {
  const details = charge?.payment_method_details

  if (!details) {
    return null
  }

  if (details.type === "card") {
    return details.card?.funding === "debit" ? "debit_card" : "credit_card"
  }

  return METHOD_BY_GATEWAY_TYPE[details.type] ?? null
}

export class StripeGateway {
  async createCheckoutSession({ transaction_id, title, amount, payer_name, payer_email }: CreateCheckoutSessionParams) {
    const session = await client.checkout.sessions.create({
      mode: "payment",
      // O client_reference_id é o que amarra a sessão de volta à nossa transação quando o
      // webhook chega sem nenhum outro contexto. O metadata repete o vínculo no PaymentIntent,
      // porque os eventos de charge e de estorno não carregam a sessão.
      client_reference_id: transaction_id,
      customer_email: payer_email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: title },
            // O Stripe cobra em centavos inteiros: é o único ponto em que o valor vira número
            // em JS, e o arredondamento existe porque 19.99 * 100 não é exato em ponto flutuante.
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { transaction_id, donor_name: payer_name },
      payment_intent_data: {
        metadata: { transaction_id },
      },
      // A volta é para o site, não para a API, e leva o id da transação em vez do id da sessão:
      // a tela de status precisa consultar a nossa transação, e a sessão do gateway não a identifica
      // sem uma consulta extra. Confirmar continua sendo trabalho do webhook.
      success_url: `${env.WEB_URL}/pedido/${transaction_id}/status`,
      cancel_url: `${env.WEB_URL}/pedido/${transaction_id}/status?cancelado=1`,
    })

    return {
      gateway_checkout_id: session.id,
      checkout_url: session.url,
    }
  }

  // Regra 3.1: o efeito financeiro nunca é aplicado a partir do que veio escrito na notificação.
  // A assinatura do Stripe garante a origem do corpo, mas não que ele ainda esteja atual: uma
  // reentrega antiga descreve um pagamento que já mudou de estado desde então.
  async getPayment(payment_intent_id: string): Promise<GatewayPayment> {
    const intent = await client.paymentIntents.retrieve(payment_intent_id, { expand: ["latest_charge"] })

    const charge = (intent.latest_charge ?? null) as Stripe.Charge | null

    // Um pagamento estornado continua succeeded no PaymentIntent: o estorno só aparece no charge.
    const amount_cents = charge?.amount ?? intent.amount
    const refunded_cents = charge?.amount_refunded ?? 0

    // Só o estorno integral vira status "refunded". Tratar qualquer devolução parcial como total
    // faria o sistema decrementar a arrecadação inteira, cancelar o recibo e devolver todo o
    // estoque por causa de uma devolução de dez reais numa compra de cem.
    const fullyRefunded = refunded_cents >= amount_cents && amount_cents > 0

    return {
      gateway_payment_id: intent.id,
      status: fullyRefunded ? "refunded" : STATUS_BY_INTENT_STATUS[intent.status] ?? "pending",
      payment_method: methodFromCharge(charge),
      amount_cents,
      refunded_cents,
      partially_refunded: refunded_cents > 0 && !fullyRefunded,
      transaction_id: intent.metadata?.transaction_id ?? null,
    }
  }

  // A chave de idempotência é o que impede o estorno em dobro. Dois pedidos simultâneos passam
  // pela conferência de status antes de qualquer trava: o segundo devolveria dinheiro de novo.
  // Com a chave, o Stripe reconhece o pedido repetido e responde o mesmo estorno, sem criar outro.
  async refundPayment(payment_intent_id: string) {
    await client.refunds.create(
      { payment_intent: payment_intent_id },
      { idempotencyKey: `refund-${payment_intent_id}` }
    )
  }
}

// Assinatura do webhook: o Stripe assina o corpo cru com HMAC-SHA256 e um timestamp, e o SDK
// recusa tanto a assinatura errada quanto a notificação velha demais. Sem essa checagem qualquer
// um que descubra a URL consegue confirmar transação. Precisa do Buffer original: o corpo já
// convertido em objeto não bate mais com o que foi assinado.
export function constructWebhookEvent(payload: Buffer, signature: string | undefined) {
  if (!signature) {
    return null
  }

  try {
    return client.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return null
  }
}
