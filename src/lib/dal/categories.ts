import "server-only";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/dal/session";

// Create/update/delete land in Phase 5 (Settings page). This read is needed
// now for the expense form's category picker.
export async function getCategories() {
  const userId = await requireUserId();
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}
