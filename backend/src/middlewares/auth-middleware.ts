import { Request, Response, NextFunction } from "express";
import { User } from "../models/user-model.js";
import jwt from "jsonwebtoken";

export async function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers

  if (!authorization) {
    return res.status(401).json({ error: "Bearer Token Missing" })
  }

  const token = authorization.split(" ")[1]

  try {
    const { id } = jwt.verify(token, String(process.env.JWT_SECRET)) as { id: string }

    const user = await User.findOne({
      where: {
        id
      },
      attributes: {
        exclude: ["hashed_password"]
      }
    })

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    req.user = user
    next()
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.name) {
        case "JsonWebTokenError":
          return res.status(401).json({ error: "Invalid token" })
        case "TokenExpiredError":
          return res.status(401).json({ error: "Token expired" })
        default:
          return res.status(500).json({ error: "Internal Server Error" })
      }
    }
    console.error(error)
    return res.status(500).json({ error: "Unknow Error" })
  }
}