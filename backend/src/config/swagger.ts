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

function toOperation<T extends ApiDoc>(doc: T): ZodOpenApiOperationObject {
  return {
    tags: doc.tags,
    summary: doc.summary,
    description: doc.description,
    ...(doc.security ? { security: doc.security } : {}),
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
    "/campaign/:slug": { get: toOperation(getCampaignBySlugDoc) },
    "/campaign/publish/:campaign_id": { patch: toOperation(publishCampaignDoc) },
    "/campaign/finish/:campaign_id": { patch: toOperation(finishCampaignDoc) },
    "/campaign/cancel/:campaign_id": { patch: toOperation(cancelCampaignDoc) },
  },
})