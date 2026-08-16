import jwt from "jsonwebtoken";
import { AuthUserController } from "../controllers/user/auth-user-controller.js";
import { CreateUserController } from "../controllers/user/create-user-controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { User } from "../models/user-model.js";
import { AuthUserService } from "../services/user/auth-user-service.js";
import { CreateUserService } from "../services/user/create-user-service.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

jest.mock("../services/user/create-user-service.js")
jest.mock("../services/user/auth-user-service.js")
jest.mock("jsonwebtoken")

const MockedCreateUserService = CreateUserService as jest.MockedClass<typeof CreateUserService>
const MockedAuthUserService = AuthUserService as jest.MockedClass<typeof AuthUserService>
const mockedJwt = jwt as jest.Mocked<typeof jwt>

describe("Full authentication functionality (real user journey)", () => {
  const credentials = { email: "john@email.com", password: "StrongPass1@", name: "John Doe" }
  const fakeUserId = "user-123"
  const fakeToken = "fake-jwt-token"

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("registers, logs in, and accesses a protected route with the token issued at login", async () => {
    MockedCreateUserService.prototype.execute = jest.fn().mockResolvedValue({
      id: fakeUserId,
      email: credentials.email,
      name: credentials.name,
    })

    const createReq = mockRequest({ body: credentials })
    const createRes = mockResponse()
    await new CreateUserController().handle(createReq, createRes)

    expect(createRes.status).toHaveBeenCalledWith(201)
    expect(MockedCreateUserService.prototype.execute).toHaveBeenCalledWith(
      expect.objectContaining({ email: credentials.email, name: credentials.name })
    )

    MockedAuthUserService.prototype.execute = jest.fn().mockResolvedValue(fakeToken)

    const authReq = mockRequest({
      body: { email: credentials.email, password: credentials.password },
    })
    const authRes = mockResponse()
    await new AuthUserController().handle(authReq, authRes)

    expect(authRes.status).toHaveBeenCalledWith(200)
    expect(authRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: fakeToken })
    )

    mockedJwt.verify.mockReturnValue({ id: fakeUserId } as any)
    jest.spyOn(User, "findOne").mockResolvedValue({
      id: fakeUserId,
      email: credentials.email,
      name: credentials.name,
    } as any)

    const profileReq = mockRequest({ headers: { authorization: `Bearer ${fakeToken}` } })
    const profileRes = mockResponse()
    const next = jest.fn()

    await AuthMiddleware(profileReq, profileRes, next)

    expect(next).toHaveBeenCalled()
    expect(profileReq.user).toEqual(
      expect.objectContaining({ id: fakeUserId, email: credentials.email })
    )
    expect(profileRes.status).not.toHaveBeenCalled()
  })

  it("never reaches the protected route if login fails first", async () => {
    MockedAuthUserService.prototype.execute = jest
      .fn()
      .mockRejectedValue(new Error("Invalid credentials"))

    const authReq = mockRequest({
      body: { email: credentials.email, password: "wrong-password" },
    })
    const authRes = mockResponse()

    await new AuthUserController().handle(authReq, authRes)

    expect(authRes.status).not.toHaveBeenCalledWith(200)
    expect(authRes.json).not.toHaveBeenCalledWith(
      expect.objectContaining({ token: expect.anything() })
    )
  })
})