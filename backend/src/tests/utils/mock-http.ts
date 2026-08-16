import { Request, Response } from "express";

export function mockResponse() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

export function mockRequest(overrides: Partial<Request> = {}): Request {
  return { body: {}, headers: {}, ...overrides } as Request;
}