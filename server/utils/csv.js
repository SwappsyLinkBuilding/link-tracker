// Tiny dependency-free CSV (RFC-4180-ish) parse + serialize.
// Handles quoted fields, embedded commas/newlines, and "" escaping.

// Serialize an array of objects to CSV given an ordered list of columns.
function toCsv(rows, columns) {
  const escape = (val) => {
    const s = val == null ? "" : String(val);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => escape(row[c])).join(","));
  }
  return lines.join("\r\n");
}

// Parse CSV text into an array of objects keyed by the header row.
function parseCsv(text) {
  const records = [];
  let field = "";
  let record = [];
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  // Strip a UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  const endField = () => {
    record.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    // Skip fully-blank lines.
    if (!(record.length === 1 && record[0] === "")) records.push(record);
    record = [];
  };

  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        endField();
        i++;
      } else if (ch === "\n") {
        endRecord();
        i++;
      } else if (ch === "\r") {
        if (text[i + 1] === "\n") i++;
        endRecord();
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  // Flush trailing field/record (file not ending in newline).
  if (field !== "" || record.length > 0) endRecord();

  if (records.length === 0) return [];
  const headers = records[0].map((h) => h.trim());
  return records.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] !== undefined ? cells[idx] : "";
    });
    return obj;
  });
}

module.exports = { toCsv, parseCsv };
