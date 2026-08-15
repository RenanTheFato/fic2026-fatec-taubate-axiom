import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { routes } from "./routes/index.js";
import { env } from "./config/env.js";
import dotenv from "dotenv";
import { pinoHttp } from "pino-http";

dotenv.config()

const app = express()

const HTTP_PORT = env.PORT
const HTTP_HOST = env.HOST

async function start() {

  // Logger
  const logger = pinoHttp({
    transport: process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty" }
      : undefined,
  });

  app.use(logger);

  //Helmet
  app.use(helmet({ contentSecurityPolicy: false }))

  // Rate Limit
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    skip: (req) => ["127.0.0.1", "::1"].includes(req.ip ?? ""),
    handler: (req, res) => {
      res.status(429).json({
        error: "Too many requests. Please slow down.",
        statusCode: 429,
      })
    },
  })

  app.use(limiter)

  app.use(cors({
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
  )

  // body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // cookie-parser
  app.use(cookieParser())

  app.use("/api/v1", routes);

  app.listen(HTTP_PORT, HTTP_HOST, () => {
    console.log(`HTTP SERVER RUNNING ON PORT: ${HTTP_PORT}`)
  })
}

start()