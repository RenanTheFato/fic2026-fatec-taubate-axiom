import { z } from "zod/v4";
import dotenv from "dotenv";

dotenv.config()

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  APP_URL: z.url().default("http://localhost:3000"),
  // Origem do site, que não é a da API: o Stripe devolve o navegador para uma tela do frontend,
  // não para uma rota REST. Separado do APP_URL porque o QR do recibo continua apontando para cá.
  WEB_URL: z.url().default("http://localhost:5173"),
})

export const env = envSchema.parse(process.env)