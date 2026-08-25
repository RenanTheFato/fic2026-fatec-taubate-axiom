import { createDocument, ZodOpenApiOperationObject } from "zod-openapi";
import { createUserDoc } from "../docs/user/create-user.doc.js";
import { getUserProfileDoc } from "../docs/user/get-user-profile.doc.js";
import type { ApiDoc } from "../docs/api.types.doc.js";
import { authUserDoc } from "../docs/user/auth-user.doc.js";
import { deleteUserDoc } from "../docs/user/delete-user.doc.js";
import { createCampaignDoc } from "../docs/campaign/create-campaign.doc.js";
import { listCampaignsDoc } from "../docs/campaign/list-campaigns.doc.js";
import { getCampaignBySlugDoc } from "../docs/campaign/get-campaign-by-slug.doc.js";
import { publishCampaignDoc } from "../docs/campaign/publish-campaign.doc.js";
import { listAllCampaignsDoc } from "../docs/campaign/list-all-campaigns.doc.js";
import { finishCampaignDoc } from "../docs/campaign/finish-campaign.doc.js";
import { cancelCampaignDoc } from "../docs/campaign/cancel-campaign.doc.js";
import { deleteCampaignDoc } from "../docs/campaign/delete-campaign.doc.js";
import { updateCampaignDoc } from "../docs/campaign/update-campaign.doc.js";
import { createDonorDoc } from "../docs/donor/create-donor.doc.js";
import { listDonorsDoc } from "../docs/donor/list-donors.doc.js";
import { getDonorDoc } from "../docs/donor/get-donor.doc.js";
import { getDonorProfileDoc } from "../docs/donor/get-donor-profile.doc.js";
import { updateDonorDoc } from "../docs/donor/update-donor.doc.js";
import { anonymizeDonorDoc } from "../docs/donor/anonymize-donor.doc.js";
import { createProductDoc } from "../docs/product/create-product.doc.js";
import { listProductsDoc } from "../docs/product/list-products.doc.js";
import { listAllProductsDoc } from "../docs/product/list-all-products.doc.js";
import { getProductByIdDoc } from "../docs/product/get-product-by-id.doc.js";
import { updateProductDoc } from "../docs/product/update-product.doc.js";
import { activateProductDoc } from "../docs/product/activate-product.doc.js";
import { deactivateProductDoc } from "../docs/product/deactivate-product.doc.js";
import { updateProductStockDoc } from "../docs/product/update-product-stock.doc.js";
import { deleteProductDoc } from "../docs/product/delete-product.doc.js";
import { createEventDoc } from "../docs/event/create-event.doc.js";
import { listEventsDoc } from "../docs/event/list-events.doc.js";
import { listAllEventsDoc } from "../docs/event/list-all-events.doc.js";
import { getEventBySlugDoc } from "../docs/event/get-event-by-slug.doc.js";
import { publishEventDoc } from "../docs/event/publish-event.doc.js";
import { updateEventDoc } from "../docs/event/update-event.doc.js";
import { updateEventCapacityDoc } from "../docs/event/update-event-capacity.doc.js";
import { finishEventDoc } from "../docs/event/finish-event.doc.js";
import { cancelEventDoc } from "../docs/event/cancel-event.doc.js";
import { deleteEventDoc } from "../docs/event/delete-event.doc.js";
import { createTransactionDoc } from "../docs/transaction/create-transaction.doc.js";
import { transactionWebhookDoc } from "../docs/transaction/transaction-webhook.doc.js";
import { listTransactionsDoc } from "../docs/transaction/list-transactions.doc.js";
import { getTransactionDoc } from "../docs/transaction/get-transaction.doc.js";
import { confirmTransactionDoc } from "../docs/transaction/confirm-transaction.doc.js";
import { refuseTransactionDoc } from "../docs/transaction/refuse-transaction.doc.js";
import { cancelTransactionDoc } from "../docs/transaction/cancel-transaction.doc.js";
import { refundTransactionDoc } from "../docs/transaction/refund-transaction.doc.js";
import { listReceiptsDoc } from "../docs/receipt/list-receipts.doc.js";
import { verifyReceiptDoc } from "../docs/receipt/verify-receipt.doc.js";
import { downloadReceiptDoc } from "../docs/receipt/download-receipt.doc.js";
import { downloadReceiptCertificateDoc } from "../docs/receipt/download-receipt-certificate.doc.js";
import { getReceiptDoc } from "../docs/receipt/get-receipt.doc.js";
import { listTransactionItemsDoc } from "../docs/transaction-item/list-transaction-items.doc.js";
import { summarizeTransactionItemsDoc } from "../docs/transaction-item/summarize-transaction-items.doc.js";

function toOperation<T extends ApiDoc>(doc: T): ZodOpenApiOperationObject {
  return {
    tags: doc.tags,
    summary: doc.summary,
    description: doc.description,
    ...(doc.security ? { security: doc.security } : {}),
    ...(doc.params || doc.query ? {
      requestParams: {
        ...(doc.params ? { path: doc.params } : {}),
        ...(doc.query ? { query: doc.query } : {}),
      }
    } : {}),
    ...(doc.body ? { requestBody: { content: { "application/json": { schema: doc.body } } } } : {}),
    responses: Object.fromEntries(
      Object.entries(doc.response).map(([status, schema]) => [
        status,
        {
          description: schema.description ?? "No description provided.",
          content: {
            [Number(status) < 300 ? doc.contentType ?? "application/json" : "application/json"]: { schema },
          },
        },
      ])
    ),
  }
}

export const openApiDocument = createDocument({
  openapi: "3.0.0",
  info: {
    title: "Somos do Bem API",
    version: "1.0.0",
    description: "API do portal institucional e central de gestão da ONG Associação Somos do Bem",
  },
  servers: [{ url: "/api/v1", description: "Servidor principal" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  paths: {
    "/user/create": { post: toOperation(createUserDoc) },
    "/user/auth": { post: toOperation(authUserDoc) },
    "/user/profile": { get: toOperation(getUserProfileDoc) },
    "/user/delete": { delete: toOperation(deleteUserDoc) },

    "/campaign/create": { post: toOperation(createCampaignDoc) },
    "/campaign/list": { get: toOperation(listCampaignsDoc) },
    "/campaign/list-all": { get: toOperation(listAllCampaignsDoc) },
    "/campaign/{slug}": { get: toOperation(getCampaignBySlugDoc) },
    "/campaign/publish/{id}": { patch: toOperation(publishCampaignDoc) },
    "/campaign/finish/{id}": { patch: toOperation(finishCampaignDoc) },
    "/campaign/cancel/{id}": { patch: toOperation(cancelCampaignDoc) },
    "/campaign/update/{id}": { put: toOperation(updateCampaignDoc) },
    "/campaign/delete/{id}": { delete: toOperation(deleteCampaignDoc) },

    "/donor/create": { post: toOperation(createDonorDoc) },
    "/donor/list": { get: toOperation(listDonorsDoc) },
    "/donor/{id}": { get: toOperation(getDonorDoc) },
    "/donor/profile": { get: toOperation(getDonorProfileDoc) },
    "/donor/update/{id}": { put: toOperation(updateDonorDoc) },
    "/donor/anonymize/{id}": { patch: toOperation(anonymizeDonorDoc) },

    "/product/create": { post: toOperation(createProductDoc) },
    "/product/list": { get: toOperation(listProductsDoc) },
    "/product/list-all": { get: toOperation(listAllProductsDoc) },
    "/product/{id}": { get: toOperation(getProductByIdDoc) },
    "/product/update/{id}": { put: toOperation(updateProductDoc) },
    "/product/activate/{id}": { patch: toOperation(activateProductDoc) },
    "/product/deactivate/{id}": { patch: toOperation(deactivateProductDoc) },
    "/product/stock/{id}": { patch: toOperation(updateProductStockDoc) },
    "/product/delete/{id}": { delete: toOperation(deleteProductDoc) },

    "/event/create": { post: toOperation(createEventDoc) },
    "/event/list": { get: toOperation(listEventsDoc) },
    "/event/list-all": { get: toOperation(listAllEventsDoc) },
    "/event/{slug}": { get: toOperation(getEventBySlugDoc) },
    "/event/publish/{id}": { patch: toOperation(publishEventDoc) },
    "/event/update/{id}": { put: toOperation(updateEventDoc) },
    "/event/capacity/{id}": { patch: toOperation(updateEventCapacityDoc) },
    "/event/finish/{id}": { patch: toOperation(finishEventDoc) },
    "/event/cancel/{id}": { patch: toOperation(cancelEventDoc) },
    "/event/delete/{id}": { delete: toOperation(deleteEventDoc) },

    "/transaction/create": { post: toOperation(createTransactionDoc) },
    "/transaction/webhook": { post: toOperation(transactionWebhookDoc) },
    "/transaction/list": { get: toOperation(listTransactionsDoc) },
    "/transaction/{id}": { get: toOperation(getTransactionDoc) },
    "/transaction/confirm/{id}": { patch: toOperation(confirmTransactionDoc) },
    "/transaction/refuse/{id}": { patch: toOperation(refuseTransactionDoc) },
    "/transaction/cancel/{id}": { patch: toOperation(cancelTransactionDoc) },
    "/transaction/refund/{id}": { patch: toOperation(refundTransactionDoc) },

    "/receipt/list": { get: toOperation(listReceiptsDoc) },
    "/receipt/verify/{hash}": { get: toOperation(verifyReceiptDoc) },
    "/receipt/download/{hash}": { get: toOperation(downloadReceiptDoc) },
    "/receipt/certificate/{hash}": { get: toOperation(downloadReceiptCertificateDoc) },
    "/receipt/{id}": { get: toOperation(getReceiptDoc) },

    "/transaction-item/list": { get: toOperation(listTransactionItemsDoc) },
    "/transaction-item/summary": { get: toOperation(summarizeTransactionItemsDoc) },
  },
})