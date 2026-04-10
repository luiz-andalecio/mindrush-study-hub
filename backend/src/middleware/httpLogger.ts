import type { Request } from "express";
import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import { logger } from "../logger";

function getHeader(value: string | string[] | undefined) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export const httpLogger = pinoHttp({
  logger,
  customAttributeKeys: {
    reqId: "requestId",
  },
  genReqId: (req, res) => {
    const fromHeader = getHeader(req.headers["x-request-id"] as any);
    const id = fromHeader ?? randomUUID();
    (req as Request).requestId = id;
    res.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} - ${err?.message ?? "erro"}`,
  serializers: {
    req(req) {
      // Não logar headers/cookies para evitar vazar tokens.
      return {
        id: (req as any).id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
