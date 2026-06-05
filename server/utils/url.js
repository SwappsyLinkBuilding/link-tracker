// URL validation/normalization + shared field limits. Kept dependency-free and
// DB-free so it can be unit-tested in isolation.

const MAX_URL_LEN = 2048;
const MAX_NOTES_LEN = 5000;
const MAX_META_LEN = 1000;
const MAX_AMOUNT_LEN = 120;
const STATUSES = ["pending", "live", "removed"];
const LINK_TYPES = ["dofollow", "nofollow", "sponsored"];
const PARTICULARS = ["free", "exchange", "paid"];

// Validate & normalize a URL string — ported from the main app's deal flow.
// Returns null for empty input; throws on an unparseable/host-less URL.
function normalizeUrl(value) {
  if (!value || !value.trim()) return null;
  const urlStr = value.trim();
  const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    throw new Error("invalid");
  }
  return parsed.toString();
}

module.exports = {
  normalizeUrl,
  MAX_URL_LEN,
  MAX_NOTES_LEN,
  MAX_META_LEN,
  MAX_AMOUNT_LEN,
  STATUSES,
  LINK_TYPES,
  PARTICULARS,
};
