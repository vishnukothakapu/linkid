import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

// Node's default discovery imports every source under a directory named `test`,
// including the Next /api/settings/webhook/test/route.ts endpoint. Discover only
// conventional test files; keep test routes out of the executable suite.
const excluded = new Set(["node_modules", ".next", ".git", "coverage"]);
function discover(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) return [];
    if (entry.isDirectory())
      return excluded.has(entry.name) ? [] : discover(path);
    return /\.test\.[cm]?[jt]s$/.test(entry.name) ? [path] : [];
  });
}
const tests = discover(process.cwd())
  .sort()
  .map((path) => {
    // Newer Node releases treat CLI paths as globs. Preserve Next's literal
    // [id] directory names; older releases accept literal filesystem paths.
    return Number(process.versions.node.split(".")[0]) >= 22
      ? path
          .replaceAll("\\", "/")
          .replace(/[\[\]]/g, (char) => (char === "[" ? "[[]" : "[]]"))
      : path;
  });
if (!tests.length) throw new Error("No Node test files found");
const require = createRequire(import.meta.url);
const result = spawnSync(
  process.execPath,
  [
    require.resolve("tsx/cli"),
    "--test",
    "--experimental-test-module-mocks",
    ...tests,
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
