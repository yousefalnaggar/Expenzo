import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // "server-only" is a virtual module Next.js's compiler resolves specially,
    // not an installed package — Vitest needs a real (no-op) stub to import
    // any src/lib/dal/*.ts file directly.
    alias: {
      "server-only": path.resolve(__dirname, "tests/unit/mocks/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    globals: true,
  },
});
