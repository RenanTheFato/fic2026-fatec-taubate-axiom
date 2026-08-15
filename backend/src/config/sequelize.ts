import { Sequelize } from "sequelize";
import { env } from "./env.js";

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: "mysql",
  logging: env.NODE_ENV !== "production" ? console.log : false,
})