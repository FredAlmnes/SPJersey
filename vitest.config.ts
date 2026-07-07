import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // "server-only" unconditionally throws outside Next.js's bundler (which
      // normally strips it via a server/client alias). Point it at the
      // package's own no-op build so integration tests can import
      // service-role.ts directly under plain Vitest/Node.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    include: ["config/**/*.test.ts", "tests/**/*.test.ts"],
    setupFiles: ["./tests/setup-env.ts"],
  },
});
