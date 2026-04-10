export function getCookie(name: string): string | null {
  // Acessível apenas para cookies NÃO httpOnly (ex: CSRF double submit).
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[$()*+.?[\\\]^{|}-]/g, "\\$&")}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
