import { z } from "zod/v4";

const validationErrorSchema = z.object({
  statusCode: z.literal(400),
  code: z.string(),
  error: z.string(),
  message: z.string(),
}).describe("Input validation failed due to incorrect or missing data.")

const serviceErrorSchema = z.object({
  error: z.string(),
}).describe("A business logic error occurred during user creation.")

const internalErrorSchema = z.object({
  error: z.string(),
}).describe("Unexpected internal server error.")

export const createUserDoc = {
  tags: ["user"],
  summary: "Create a new user account",
  description: "Registers a new user by validating the provided credentials, hashing the password, and storing the user in the system.",
  body: z.object({
    email: z.email().describe("User email address (must be unique in the system).").meta({ example: "johndoe@email.com" }),
    password: z.string().describe("User password with security constraints.").meta({ example: "your_very_strong_password" }),
    name: z.string().describe("The display name of the user.").meta({ example: "John Doe" }),
  }),
  response: {
    201: z.object({ message: z.string().describe("Success message.") }).describe("User account created successfully."),
    400: z.union([validationErrorSchema, serviceErrorSchema]).describe("Bad Request — Validation failure or business rule violation."),
    500: internalErrorSchema.describe("Internal Server Error — Unexpected failure during user creation."),
  },
}