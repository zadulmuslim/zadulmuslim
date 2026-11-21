import "server-only";
import { redirect } from "next/navigation";
import { roleAtLeast, type UserRole } from "@/lib/storage/categories";
import { getSessionUser, type SessionUser } from "./session";

/** Redirects to /login if signed out. */
export async function requireUser(nextPath = "/account"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Redirects to /login if signed out, or to /account if the role is too low. */
export async function requireRole(min: UserRole, nextPath = "/admin"): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (!roleAtLeast(user.role, min)) redirect("/account?denied=1");
  return user;
}

export const requireStaff = (nextPath?: string) => requireRole("editor", nextPath);
export const requireAdmin = (nextPath?: string) => requireRole("admin", nextPath);
