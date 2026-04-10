const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

// Parser simples para strings no formato do jsonwebtoken (ex.: 15m, 7d, 30d).
// Usamos isso para calcular maxAge de cookie e expiresAt de sessão.
export function ttlToMs(ttl: string): number {
  const normalized = ttl.trim();
  const match = /^([0-9]+)\s*([smhdw])$/.exec(normalized);
  if (!match) {
    throw new Error(`TTL inválido: "${ttl}". Use formato como 15m, 7d, 30d.`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = UNIT_TO_MS[unit];

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`TTL inválido: "${ttl}". O número precisa ser > 0.`);
  }

  return value * unitMs;
}
