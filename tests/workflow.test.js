// I5: the rules for the GitHub Actions workflow (docs/decisions/tests/plan.md,
// block 4), checked on the file's text so that a later edit cannot quietly
// break them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../.github/workflows/", import.meta.url);
const workflows = readdirSync(dir).map((name) => [
  name,
  readFileSync(new URL(name, dir), "utf8"),
]);

test("I5: the test workflow runs every check, on push and pull request", () => {
  const text = readFileSync(new URL("test.yml", dir), "utf8");
  assert.match(text, /^on:\n {2}push:\n {2}pull_request:\n/m);
  assert.match(text, /node-version-file: \.node-version/);
  const runs = [...text.matchAll(/^\s+(?:- )?run: (.+)$/gm)].map((m) => m[1]);
  const order = [
    "npm ci",
    "npm run build",
    "npm run lint",
    "npm run format:check",
    "npm test",
    "npx playwright test",
  ].map((command) => runs.indexOf(command));
  assert.ok(
    order.every((index) => index >= 0),
    `missing: ${runs.join(" | ")}`,
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
  );
  // Chromium only.
  assert.ok(
    runs
      .filter((command) => command.includes("playwright install"))
      .every((command) => command.endsWith(" chromium")),
  );
});

test("I5: workflows only read, use no secrets, and pin official actions", () => {
  assert.ok(workflows.length > 0);
  for (const [name, text] of workflows) {
    assert.match(text, /^permissions:\n {2}contents: read\n(?! )/m, name);
    assert.equal(text.match(/^\s*permissions:/gm).length, 1, name);
    const code = text.replace(/(^|\s)#.*$/gm, "");
    assert.doesNotMatch(code, /secrets\.|GITHUB_TOKEN|github\.token/, name);
    const uses = [...text.matchAll(/uses: (\S+)/g)].map((m) => m[1]);
    assert.ok(uses.length > 0, name);
    for (const action of uses) {
      assert.match(
        action,
        /^actions\/[\w-]+@[0-9a-f]{40}$/,
        `${name}: ${action}`,
      );
    }
  }
});
