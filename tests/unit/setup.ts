import { config } from "dotenv";

// Vitest doesn't auto-load .env.local the way `next dev`/`next build` do —
// the DAL ownership tests need a real DATABASE_URL to hit Prisma.
config({ path: ".env.local" });

import "@testing-library/jest-dom/vitest";
