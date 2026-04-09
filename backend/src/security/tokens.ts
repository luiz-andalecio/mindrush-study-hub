import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../env";

export type AccessTokenPayload = {
  sub: string; // userId
  email: string;
};

export type RefreshTokenPayload = {
  sub: string; // userId
  typ: "refresh";
};

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(
    { email: payload.email },
    env.accessTokenSecret,
    {
      subject: payload.sub,
      expiresIn: env.accessTokenTtl as unknown as jwt.SignOptions["expiresIn"],
    },
  );
}

export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, env.accessTokenSecret) as jwt.JwtPayload;
  const userId = decoded.sub;
  const email = decoded.email;
  if (!userId || typeof userId !== "string") throw new Error("invalid");
  if (!email || typeof email !== "string") throw new Error("invalid");
  return { userId, email };
}

export function signRefreshToken(userId: string, sessionId: string) {
  return jwt.sign(
    { typ: "refresh" },
    env.refreshTokenSecret,
    {
      subject: userId,
      jwtid: sessionId,
      expiresIn: env.refreshTokenTtl as unknown as jwt.SignOptions["expiresIn"],
    },
  );
}

export function verifyRefreshToken(token: string) {
  const decoded = jwt.verify(token, env.refreshTokenSecret) as jwt.JwtPayload;
  const userId = decoded.sub;
  const sessionId = decoded.jti;
  const typ = decoded.typ;
  if (typ !== "refresh") throw new Error("invalid");
  if (!userId || typeof userId !== "string") throw new Error("invalid");
  if (!sessionId || typeof sessionId !== "string") throw new Error("invalid");
  return { userId, sessionId };
}