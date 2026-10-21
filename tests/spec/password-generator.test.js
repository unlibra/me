// Spec tests of the password generator's options (I1): every combination of
// character types and the ambiguous-character option, at the lengths the
// slider allows (8 to 64) and below. tests/password-generator.test.js checks
// the port against the former tool's output.
import { test } from "node:test";
import assert from "node:assert/strict";

import { generatePassword } from "../../src/tools/password-generator/password.ts";

const TYPES = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*-_+=?",
};
const AMBIGUOUS = "0O1lI";

/** Every combination of the four character types, and the option. */
const combinations = () => {
  const names = Object.keys(TYPES);
  const result = [];
  for (let mask = 0; mask < 16; mask++) {
    for (const avoidAmbiguous of [false, true]) {
      const selected = names.filter((_, i) => mask & (1 << i));
      result.push({
        selected,
        options: Object.fromEntries([
          ...names.map((name) => [name, selected.includes(name)]),
          ["avoidAmbiguous", avoidAmbiguous],
        ]),
      });
    }
  }
  return result;
};

/** The characters a password may use with these options. */
const allowed = ({ selected, options }) =>
  selected
    .map((name) => TYPES[name])
    .join("")
    .split("")
    .filter((c) => !(options.avoidAmbiguous && AMBIGUOUS.includes(c)));

const label = ({ selected, options }) =>
  `${selected.join("+") || "none"}${options.avoidAmbiguous ? " avoidAmbiguous" : ""}`;

test("I1 password: each combination uses only its characters, at the requested length", () => {
  for (const combination of combinations()) {
    const chars = new Set(allowed(combination));
    // 1 to 4 are below the slider's range (8 to 64): the function is also
    // used with lengths shorter than the number of types, which must still
    // give exactly that many characters.
    for (const length of [1, 2, 3, 4, 8, 9, 16, 32, 63, 64]) {
      for (let run = 0; run < 20; run++) {
        const password = generatePassword({ ...combination.options, length });
        if (combination.selected.length === 0) {
          assert.equal(password, "", label(combination));
          continue;
        }
        assert.equal(password.length, length, label(combination));
        for (const c of password) {
          assert.ok(chars.has(c), `${label(combination)}: ${c}`);
        }
      }
    }
  }
});

test("I1 password: each selected type appears when the length allows", () => {
  for (const combination of combinations()) {
    const { selected } = combination;
    if (selected.length === 0) continue;
    const sets = selected.map((name) =>
      TYPES[name]
        .split("")
        .filter(
          (c) => !(combination.options.avoidAmbiguous && AMBIGUOUS.includes(c)),
        ),
    );
    for (const length of [8, 16, 64]) {
      for (let run = 0; run < 100; run++) {
        const password = generatePassword({ ...combination.options, length });
        for (const set of sets) {
          assert.ok(
            set.some((c) => password.includes(c)),
            `${label(combination)}: ${password}`,
          );
        }
      }
    }
  }
});

test("I1 password: every allowed character can appear", () => {
  for (const combination of combinations()) {
    if (combination.selected.length === 0) continue;
    const seen = new Set(
      Array.from({ length: 200 }, () =>
        generatePassword({ ...combination.options, length: 64 }),
      )
        .join("")
        .split(""),
    );
    assert.deepEqual(
      [...seen].sort(),
      allowed(combination).sort(),
      label(combination),
    );
  }
});

test("I1 password: the ambiguous characters are 0, O, 1, l and I", () => {
  const all = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  };
  const seen = (avoidAmbiguous) =>
    new Set(
      Array.from({ length: 300 }, () =>
        generatePassword({ ...all, avoidAmbiguous, length: 64 }),
      )
        .join("")
        .split(""),
    );
  const withThem = seen(false);
  const without = seen(true);
  assert.deepEqual(
    [...withThem].filter((c) => !without.has(c)).sort(),
    [...AMBIGUOUS].sort(),
  );
});

test("I1 password: consecutive passwords differ", () => {
  const options = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    avoidAmbiguous: true,
    length: 16,
  };
  const passwords = new Set(
    Array.from({ length: 100 }, () => generatePassword(options)),
  );
  assert.equal(passwords.size, 100);
});
