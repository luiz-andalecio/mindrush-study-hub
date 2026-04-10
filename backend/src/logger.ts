export type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

type LogEntry = {
  level: LogLevel;
  msg: string;
  time: string;
} & LogMeta;

function write(level: LogLevel, msg: string, meta: LogMeta = {}) {
  const entry: LogEntry = {
    level,
    msg,
    time: new Date().toISOString(),
    ...meta,
  };

  const line = JSON.stringify(entry);

  if (level === "error") return console.error(line);
  if (level === "warn") return console.warn(line);
  return console.log(line);
}

export const logger = {
  info(msg: string, meta?: LogMeta) {
    write("info", msg, meta);
  },
  warn(msg: string, meta?: LogMeta) {
    write("warn", msg, meta);
  },
  error(msg: string, meta?: LogMeta) {
    write("error", msg, meta);
  },
} as const;
