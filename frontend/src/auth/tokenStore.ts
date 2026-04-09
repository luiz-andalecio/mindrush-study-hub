// Token store em memória.
// Importante: NÃO persistimos access token (evita impacto de XSS em localStorage).

let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}
