import "server-only";
import { prisma } from "@/lib/db";

// Registration/login run before a session exists, so these two functions are
// the deliberate exception to "every DAL function calls requireUserId() first".

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

export async function createUser(input: { name: string; email: string; passwordHash: string }) {
  return prisma.user.create({
    data: input,
    select: { id: true, name: true, email: true, image: true },
  });
}
