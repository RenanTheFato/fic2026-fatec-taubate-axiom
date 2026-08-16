import { createDocument, ZodOpenApiOperationObject } from "zod-openapi";
import { createUserDoc } from "../docs/user/create-user.doc.js";
import { getUserProfileDoc } from "../docs/user/get-user-profile.doc.js";
import type { ApiDoc } from "../docs/api.types.doc.js";
import { authUserDoc } from "../docs/user/auth-user.doc.js";
import { deleteUserDoc } from "../docs/user/delete-user.doc.js";

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
  },
})