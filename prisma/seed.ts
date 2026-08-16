import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@expenzo.app";
const DEMO_PASSWORD = "Demo1234!";

const CATEGORIES = [
  { name: "Food", color: "#f97316", icon: "utensils" },
  { name: "Transport", color: "#3b82f6", icon: "car" },
  { name: "Rent", color: "#8b5cf6", icon: "home" },
  { name: "Utilities", color: "#14b8a6", icon: "plug" },
  { name: "Entertainment", color: "#ec4899", icon: "clapperboard" },
  { name: "Other", color: "#64748b", icon: "shapes" },
] as const;

const DESCRIPTIONS: Record<(typeof CATEGORIES)[number]["name"], string[]> = {
  Food: ["Grocery run", "Coffee shop", "Lunch out", "Takeout dinner", "Farmers market"],
  Transport: ["Gas fill-up", "Train ticket", "Rideshare", "Parking fee", "Car wash"],
  Rent: ["Monthly rent"],
  Utilities: ["Electricity bill", "Internet bill", "Water bill", "Phone bill"],
  Entertainment: ["Movie tickets", "Streaming subscription", "Concert", "Video game"],
  Other: ["Pharmacy", "Gift", "Haircut", "Miscellaneous"],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function randomDateWithinLastMonths(months: number): Date {
  const now = new Date();
  const past = new Date(now);
  past.setMonth(past.getMonth() - months);
  const timestamp = randomInt(past.getTime(), now.getTime());
  return new Date(timestamp);
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "Demo User",
      passwordHash,
    },
  });

  const categories = await Promise.all(
    CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: { userId_name: { userId: user.id, name: category.name } },
        update: {},
        create: { ...category, userId: user.id },
      }),
    ),
  );

  await prisma.expense.deleteMany({ where: { userId: user.id } });

  const expenseCount = 40;
  const expenses = Array.from({ length: expenseCount }, () => {
    const category = randomChoice(categories);
    const description = randomChoice(
      DESCRIPTIONS[category.name as (typeof CATEGORIES)[number]["name"]],
    );
    const amountCents =
      category.name === "Rent" ? randomInt(80_000, 150_000) : randomInt(500, 20_000);

    return {
      amountCents,
      normalizedUsdCents: amountCents, // seed data is always USD
      description,
      date: randomDateWithinLastMonths(6),
      userId: user.id,
      categoryId: category.id,
    };
  });

  await prisma.expense.createMany({ data: expenses });

  console.log(
    `Seeded user ${user.email} with ${categories.length} categories and ${expenses.length} expenses.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
