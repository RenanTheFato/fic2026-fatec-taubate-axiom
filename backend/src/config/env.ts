import { z } from "zod/v4";
import dotenv from "dotenv";

dotenv.config()

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

export const env = envSchema.parse(process.env)