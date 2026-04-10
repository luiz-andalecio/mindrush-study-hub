import "express";
import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      id?: string;
      requestId?: string;
      log?: Logger;
      user?: {
        userId: string;
        email?: string;
      };
    }
  }
}

export {};
