const { test } = require("node:test");
const assert = require("node:assert/strict");
const { toCsv, parseCsv } = require("../utils/csv");

const COLS = ["a", "b", "c"];

test("round-trips plain values", () => {
  const rows = [{ a: "1", b: "2", c: "3" }];
  assert.deepEqual(parseCsv(toCsv(rows, COLS)), rows);
});

test("round-trips commas, quotes, and newlines", () => {
  const rows = [
    { a: "has,comma", b: 'has "quote"', c: "line\nbreak" },
    { a: "plain", b: "", c: "ok" },
  ];
  assert.deepEqual(parseCsv(toCsv(rows, COLS)), rows);
});

test("parses a header-keyed file", () => {
  const out = parseCsv("placementUrl,status\r\nhttps://a.com,live\r\n");
  assert.deepEqual(out, [{ placementUrl: "https://a.com", status: "live" }]);
});

test("skips fully-blank lines", () => {
  const out = parseCsv("a,b\r\n1,2\r\n\r\n3,4\r\n");
  assert.equal(out.length, 2);
});

test("handles a missing trailing newline", () => {
  const out = parseCsv("a,b\n1,2");
  assert.deepEqual(out, [{ a: "1", b: "2" }]);
});

test("strips a UTF-8 BOM", () => {
  const out = parseCsv("﻿a,b\n1,2\n");
  assert.deepEqual(out, [{ a: "1", b: "2" }]);
});

test("empty input yields no rows", () => {
  assert.deepEqual(parseCsv(""), []);
});
