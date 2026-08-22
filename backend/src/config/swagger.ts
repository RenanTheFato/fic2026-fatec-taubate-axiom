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
          content: { "application/json": { schema } },
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
    "/campaign/publish/{campaign_id}": { patch: toOperation(publishCampaignDoc) },
    "/campaign/finish/{campaign_id}": { patch: toOperation(finishCampaignDoc) },
    "/campaign/cancel/{campaign_id}": { patch: toOperation(cancelCampaignDoc) },
    "/campaign/update/{campaign_id}": { put: toOperation(updateCampaignDoc) },
    "/campaign/delete/{campaign_id}": { delete: toOperation(deleteCampaignDoc) },

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
  },
})