import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  name: "mindrush-api",
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: "SYS:standard",
            // O pino-http já gera uma linha-resumo da request.
            // Esconder req/res evita poluição e deixa warnings/erros mais legíveis.
            ignore: "pid,hostname,name,req,res,responseTime",
            messageFormat: "[{requestId}] {msg}",
            singleLine: true,
          },
        },
      }),
});
