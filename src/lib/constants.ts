export const SESSION_COOKIE = "operio_session";
export const LOCALE_COOKIE = "locale";
export const THEME_COOKIE = "theme";

export function authSecret() {
  const secret = process.env.AUTH_SECRET || "operio-local-dev-7f3a9c2e1b84d650aa11";
  return new TextEncoder().encode(secret);
}
