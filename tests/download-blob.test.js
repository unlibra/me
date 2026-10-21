// downloadBlob (src/tools/lib/image.ts), used by the Favicon Generator and
// the SVG Optimizer: the object URL is revoked only after the browser has
// had time to start the download (ui-revise2, a fix of a liblab bug).
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DOWNLOAD_URL_LIFETIME_MS,
  downloadBlob,
} from "../src/tools/lib/image.ts";

test("downloadBlob clicks a link to the blob and revokes its URL later", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const events = [];
  const link = {
    click: () => events.push(["click", link.href, link.download]),
  };
  globalThis.document = {
    createElement: (tag) => {
      assert.equal(tag, "a");
      return link;
    },
    body: {
      appendChild: () => events.push(["append"]),
      removeChild: () => events.push(["remove"]),
    },
  };
  t.after(() => delete globalThis.document);
  t.mock.method(URL, "createObjectURL", () => "blob:test");
  const revoke = t.mock.method(URL, "revokeObjectURL", (url) =>
    events.push(["revoke", url]),
  );

  downloadBlob(new Blob(["x"]), "file.svg");
  assert.deepEqual(events, [
    ["append"],
    ["click", "blob:test", "file.svg"],
    ["remove"],
  ]);
  // Not right after the click (Chromium may not have started the download).
  assert.equal(revoke.mock.callCount(), 0);
  t.mock.timers.tick(DOWNLOAD_URL_LIFETIME_MS - 1);
  assert.equal(revoke.mock.callCount(), 0);
  t.mock.timers.tick(1);
  assert.deepEqual(events.at(-1), ["revoke", "blob:test"]);
  assert.ok(DOWNLOAD_URL_LIFETIME_MS >= 1000);
});
