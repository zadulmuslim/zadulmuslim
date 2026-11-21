/**
 * "মনে রাখুন" (remember me). When unticked at login, a session-only marker
 * cookie is set and every Supabase auth cookie is written without an expiry,
 * so the browser forgets the login when it is closed. Shared by the server,
 * the proxy and the browser client so token refreshes keep the same behaviour.
 */
export const REMEMBER_COOKIE = "zm-remember";
export const REMEMBER_MAX_AGE = 400 * 24 * 60 * 60;

type Opts = { maxAge?: number; expires?: Date | number | string } & Record<string, unknown>;

/** Strips the lifetime from cookies being *set* (deletions with maxAge 0 are kept). */
export function withRemember<T extends Opts | undefined>(options: T, remember: boolean): T {
  if (remember || !options) return options;
  if (options.maxAge !== undefined && options.maxAge <= 0) return options;
  const { maxAge: _m, expires: _e, ...rest } = options;
  return rest as T;
}

export const rememberFrom = (value: string | undefined) => value !== "0";
