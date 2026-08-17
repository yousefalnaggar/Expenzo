import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });

// Cascades expenses/categories per the schema's onDelete: Cascade.
export async function deleteTestUser(email: string) {
  await prisma.user.deleteMany({ where: { email } });
}
