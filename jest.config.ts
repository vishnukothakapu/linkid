import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Points to your Next.js app root so next/jest can load next.config.ts & .env files
  dir: "./",
});

const config: Config = {
  // Use jsdom for React component tests (browser-like environment)
  testEnvironment: "jsdom",

  // Run this file after jest is initialised in each test suite
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Resolve the @/ path alias defined in tsconfig.json
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // Only run files inside __tests__/ or files named *.test.ts/tsx
  testMatch: [
    "<rootDir>/__tests__/**/*.(test|spec).(ts|tsx)",
    "<rootDir>/**/*.(test|spec).(ts|tsx)",
  ],

  // Exclude the existing tsx --test files (Node native runner) and node_modules
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/lib/csrf.test.ts",
    "<rootDir>/lib/analytics.test.ts",
    "<rootDir>/lib/accountMergeUtils.test.ts",
    "<rootDir>/lib/middleware/csrf.test.ts",
  ],

  // Collect coverage from these source files
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "app/components/**/*.{ts,tsx}",
    "!lib/**/*.test.{ts,tsx}",
    "!lib/prisma.ts",      // skip DB singleton
    "!lib/auth.ts",        // skip NextAuth config (requires env)
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],

  // Coverage output format
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "<rootDir>/coverage",

  // Fail if coverage drops below these thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // Show individual test results in verbose mode
  verbose: true,
};

// createJestConfig wraps our config so next/jest can configure transforms, etc.
export default createJestConfig(config);