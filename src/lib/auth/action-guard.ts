import "server-only";
import { roleAtLeast, type UserRole } from "@/lib/storage/categories";
import { getSessionUser, type SessionUser } from "./session";

/** For Server Actions: returns the user, or a Bengali error message (never redirects). */
export async function actionUser(min: UserRole): Promise<{ user: SessionUser; error?: undefined } | { user?: undefined; error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "আপনার সেশন শেষ হয়ে গেছে। আবার লগইন করুন।" };
  if (!roleAtLeast(user.role, min)) return { error: "এই কাজের অনুমতি আপনার নেই।" };
  return { user };
}
