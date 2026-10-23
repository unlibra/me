// Unit tests for the password generator logic (E6). The output is random,
// so these check the conditions it guarantees.
import { test } from "node:test";
import assert from "node:assert/strict";

import { generatePassword } from "../src/tools/password-generator/password.ts";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*-_+=?";
const AMBIGUOUS = "0O1lI";

const base = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  avoidAmbiguous: false,
};

const has = (password, set) => [...password].some((c) => set.includes(c));
const RUNS = 300;

test("E6: the password has the requested length", () => {
  for (const length of [1, 2, 3, 4, 8, 16, 33, 64]) {
    for (let i = 0; i < 20; i++) {
      assert.equal(generatePassword({ ...base, length }).length, length);
    }
  }
});

test("E6: only characters of the selected types are used", () => {
  const types = {
    uppercase: UPPERCASE,
    lowercase: LOWERCASE,
    numbers: NUMBERS,
    symbols: SYMBOLS,
  };
  for (const [key, set] of Object.entries(types)) {
    const options = {
      ...base,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
      [key]: true,
    };
    for (let i = 0; i < 50; i++) {
      const password = generatePassword(options);
      assert.equal(password.length, 16, key);
      for (const c of password) assert.ok(set.includes(c), `${key}: ${c}`);
    }
  }
});

test("E6: every selected type appears at least once when the length allows", () => {
  for (const length of [4, 8, 16]) {
    for (let i = 0; i < RUNS; i++) {
      const password = generatePassword({ ...base, length });
      for (const set of [UPPERCASE, LOWERCASE, NUMBERS, SYMBOLS]) {
        assert.ok(has(password, set), `${password} lacks one of ${set}`);
      }
    }
  }
});

test("E6: with fewer characters than types, each character comes from a different type", () => {
  for (let i = 0; i < RUNS; i++) {
    const password = generatePassword({ ...base, length: 3 });
    const sets = [UPPERCASE, LOWERCASE, NUMBERS, SYMBOLS].filter((set) =>
      has(password, set),
    );
    assert.equal(sets.length, 3, password);
  }
});

test("E6: ambiguous characters are excluded when requested", () => {
  for (let i = 0; i < RUNS; i++) {
    const password = generatePassword({
      ...base,
      length: 64,
      avoidAmbiguous: true,
    });
    assert.ok(!has(password, AMBIGUOUS), password);
  }
  // Without the option they can appear (64 characters x 300 runs).
  const all = Array.from({ length: RUNS }, () =>
    generatePassword({ ...base, length: 64 }),
  ).join("");
  for (const c of AMBIGUOUS) assert.ok(all.includes(c), c);
});

test("E6: no character types gives an empty password", () => {
  assert.equal(
    generatePassword({
      ...base,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
    }),
    "",
  );
});

test("E6: with the same random values, the output matches the former tool", (t) => {
  // Deterministic stand-in for crypto.getRandomValues (32-bit LCG). The
  // expected strings came from the former tool's password generator source
  // run with the same stand-in.
  let state = 12345;
  t.mock.method(globalThis.crypto, "getRandomValues", (array) => {
    for (let i = 0; i < array.length; i++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      array[i] = state;
    }
    return array;
  });
  const cases = [
    { ...base, symbols: false, avoidAmbiguous: true },
    { ...base, length: 64 },
    { ...base, length: 3, avoidAmbiguous: true },
    {
      ...base,
      length: 8,
      uppercase: false,
      lowercase: false,
      avoidAmbiguous: true,
    },
  ];
  assert.deepEqual(
    cases.map((options) => generatePassword(options)),
    [
      "xij4SKWr58sra5xA",
      "jp@L5k1Hd@7Tl%_xv3#6*FnHK8pYG8UJ6nstvXsepiSxPA_0&J0Ne3C%iIwi+L-5",
      "%S4",
      "=-%$8=8!",
    ],
  );
});
