const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeUrl } = require("../utils/url");

test("returns null for empty/blank input", () => {
  assert.equal(normalizeUrl(""), null);
  assert.equal(normalizeUrl("   "), null);
  assert.equal(normalizeUrl(undefined), null);
});

test("adds https:// when scheme is missing", () => {
  assert.equal(normalizeUrl("partner.com/post"), "https://partner.com/post");
});

test("preserves an existing scheme", () => {
  assert.equal(normalizeUrl("http://x.com/a"), "http://x.com/a");
  assert.equal(normalizeUrl("https://x.com/a"), "https://x.com/a");
});

test("trims surrounding whitespace", () => {
  assert.equal(normalizeUrl("  mysite.com  "), "https://mysite.com/");
});

test("throws on a host without a dot", () => {
  assert.throws(() => normalizeUrl("localhost"));
  assert.throws(() => normalizeUrl("not a url"));
});
