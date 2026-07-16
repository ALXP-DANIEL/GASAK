import path from "node:path";
import { defineConfig } from "vitest/config";

// Mirror the tsconfig path aliases the tested modules use.
export default defineConfig({
  resolve: {
    alias: {
      "@lib": path.resolve(__dirname, "src/lib"),
      "@server": path.resolve(__dirname, "src/server"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
