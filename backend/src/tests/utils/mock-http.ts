import { Request, Response } from "express";

export function mockResponse() {
  const res = {} as Response
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

// O Express sempre entrega `query` como objeto, mesmo sem nenhum parâmetro na URL.
export function mockRequest(overrides: Partial<Request> = {}): Request {
  return { body: {}, headers: {}, query: {}, ...overrides } as Request
}