import { z } from "zod/v4";
import { TRANSACTION_TYPES } from "../../models/transaction-model.js";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

const serviceErrorSchema = z.object({
  error: z.string(),
}).describe("A business logic error occurred during transaction creation.")

export const createTransactionDoc = {
  tags: ["transaction"],
  summary: "Start a checkout and create a pending transaction",
  description: "Public entry point of every kind of income: donation, sponsorship, ticket and product all go through this single engine. Finds or creates the donor from the form data: never from the gateway: records the transaction as pending, then creates a Stripe Checkout Session and returns the checkout URL. No money is considered received here: the seat, the stock and the campaign total are only touched when the payment is confirmed.\n\nWhere the amount comes from depends on the type, and the two cases are mutually exclusive. A donation or a sponsorship has a free value: the payer chooses it and sends it in `amount`. A product or a ticket is priced by the institution: `amount` must NOT be sent, and is computed from `products.price` times the quantity, or from the event`s `ticket_price`. Sending an amount on a purchase is rejected with 400 rather than silently ignored, so a client can never choose what it pays. A purchase also returns the priced lines in `items`, which is how the caller learns the total before sending the payer to the checkout.",
  body: z.object({
    type: z.enum(TRANSACTION_TYPES)
      .describe("What is being paid for. A ticket requires an event; a sponsorship requires a campaign or an event.")
      .meta({ example: "donation" }),
    amount: z.number()
      .optional()
      .describe("Amount in BRL, with at most two decimal places. Required for a donation or a sponsorship, where the value is free. Must be omitted for a product or a ticket, whose price comes from the catalogue: sending it there is a 400.")
      .meta({ example: 150.00 }),
    items: z.array(z.object({
      product_id: z.uuid()
        .describe("Catalogue product being bought.")
        .meta({ example: "5b8d3a1f-4c2e-4b9d-a710-6f3e8c2d5a91" }),
      quantity: z.number()
        .optional()
        .describe("How many units. Defaults to 1. Repeated lines of the same product are added up.")
        .meta({ example: 2 }),
    }))
      .optional()
      .describe("What is being bought. Required and non-empty for a product transaction, forbidden for every other type: a ticket derives its single line from the event, and a donation has nothing to itemise. Note that it carries no price: the unit price is read from the catalogue and copied into the line."),
    campaign_id: z.uuid()
      .nullish()
      .describe("Campaign the money goes to. Must be an active campaign.")
      .meta({ example: "9f1d4c2e-6b7a-4d3f-8c21-0a5e7b9d1c34" }),
    event_id: z.uuid()
      .nullish()
      .describe("Event the transaction refers to. Must be a published event with seats left.")
      .meta({ example: "3c6b1f9e-2a4d-4e7b-8f10-5d9c2a7b3e61" }),
    notes: z.string()
      .nullish()
      .describe("Free text kept with the transaction, for the negotiated flows the team registers by hand.")
      .meta({ example: "Doação combinada por telefone com a empresa parceira." }),
    donor_name: z.string()
      .describe("Name of the donor as declared in the form. This is the name that goes on the receipt.")
      .meta({ example: "Maria Oliveira" }),
    donor_email: z.email()
      .describe("Email of the donor.")
      .meta({ example: "maria@email.com" }),
    donor_document: z.string()
      .nullish()
      .describe("CPF or CNPJ. Formatting is stripped and the type is derived from the digit count. Null means an anonymous donation.")
      .meta({ example: "123.456.789-09" }),
    donor_phone: z.string()
      .nullish()
      .describe("Phone number of the donor.")
      .meta({ example: "+55 15 99999-0000" }),
  }),
  response: {
    201: z.object({
      message: z.string().describe("Success message."),
      transaction: z.object({
        id: z.string(),
        type: z.string(),
        status: z.string().describe("Always 'pending' at this point."),
        amount: z.string(),
        payment_method: z.string().nullable().describe("Null until the payer chooses one at the checkout."),
        donor_id: z.string(),
        campaign_id: z.string().nullable(),
        event_id: z.string().nullable(),
        gateway_checkout_id: z.string().nullable(),
        gateway_payment_id: z.string().nullable(),
        checkout_url: z.string().nullable().describe("Where to send the payer to complete the payment."),
        notes: z.string().nullable(),
        confirmed_at: z.iso.datetime().nullable(),
        refunded_at: z.iso.datetime().nullable(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
        items: z.array(z.object({
          id: z.string(),
          transaction_id: z.string(),
          product_id: z.string().nullable().describe("Null on a ticket line, which has no catalogue product behind it."),
          description: z.string().describe("Product name, or event title on a ticket, copied at purchase time."),
          quantity: z.number(),
          unit_price: z.string().describe("Price read from the catalogue, never from the request."),
          created_at: z.iso.datetime(),
          updated_at: z.iso.datetime(),
        })).describe("The priced lines behind the amount. Empty on a donation or a sponsorship."),
      }),
    }).describe("Transaction created and checkout session generated."),

    400: z.union([validationErrorSchema, serviceErrorSchema])
      .describe("Bad Request: Validation failure, an amount sent on a purchase, a missing or empty item list, an unknown or inactive product, a product with no stock left, a free event, an inactive campaign, an unpublished event or a sold out event."),

    500: z.object({
      error: z.string(),
    }).describe("Internal Server Error: Unexpected failure, including a Stripe outage."),
  },
}
