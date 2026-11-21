import type { UserRole } from "@/lib/storage/categories";

/**
 * Role-management rules (mirrored in the database trigger guard_role_change):
 *  • super_admin is never granted or removed from the app (manual in Supabase).
 *  • Only a super_admin can grant/remove admin, or delete an admin.
 *  • admin can switch member ↔ editor and delete members/editors.
 *  • Nobody can change or delete themselves here.
 */
export function assignableRoles(actor: UserRole): UserRole[] {
  if (actor === "super_admin") return ["member", "editor", "admin"];
  if (actor === "admin") return ["member", "editor"];
  return [];
}

export function canManageUser(actor: { id: string; role: UserRole }, target: { id: string; role: UserRole }): boolean {
  if (actor.id === target.id) return false;
  if (target.role === "super_admin") return false;
  if (target.role === "admin") return actor.role === "super_admin";
  return actor.role === "admin" || actor.role === "super_admin";
}

export function canAssign(actor: { id: string; role: UserRole }, target: { id: string; role: UserRole }, newRole: UserRole): boolean {
  return canManageUser(actor, target) && assignableRoles(actor.role).includes(newRole);
}
