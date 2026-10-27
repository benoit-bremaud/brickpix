import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Leaked doubles must not make tests order-dependent (Canvas, FileReader and URL stubs ahead).
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    projects: [
      {
        extends: true,
        test: { name: "domain", environment: "node", include: ["src/domain/**/*.test.ts"] },
      },
      {
        extends: true,
        test: {
          name: "web",
          environment: "jsdom",
          include: ["src/web/**/*.test.{ts,tsx}"],
          setupFiles: ["src/web/test-setup.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // Bootstrap and test wiring carry no logic; keep sonar.coverage.exclusions in sync.
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts", "src/web/main.tsx", "src/web/test-setup.ts", "src/web/test-image.ts"],
      reporter: ["text", "lcov"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
