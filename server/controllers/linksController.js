const db = require("../db");
const { toCsv, parseCsv } = require("../utils/csv");
const {
  normalizeUrl,
  MAX_URL_LEN,
  MAX_NOTES_LEN,
  MAX_META_LEN,
  MAX_AMOUNT_LEN,
  STATUSES,
  LINK_TYPES,
  PARTICULARS,
} = require("../utils/url");

// Column order for CSV export/import.
const CSV_COLUMNS = [
  "placementUrl",
  "targetUrl",
  "anchorText",
  "partnerName",
  "linkType",
  "particular",
  "particularDetails",
  "paidAmount",
  "status",
  "notes",
  "dateAdded",
];

// Returns a sent 400 response (truthy) if any field is too long, else null.
function lengthError(res, { placementUrl, targetUrl, notes }) {
  if (placementUrl && placementUrl.length > MAX_URL_LEN) {
    return res.status(400).json({ success: false, message: "Placement URL is too long" });
  }
  if (targetUrl && targetUrl.length > MAX_URL_LEN) {
    return res.status(400).json({ success: false, message: "Target URL is too long" });
  }
  if (notes && notes.length > MAX_NOTES_LEN) {
    return res.status(400).json({ success: false, message: "Notes are too long" });
  }
  return null;
}

function metadataError(res, { linkType, particular, particularDetails, paidAmount }) {
  if (linkType && !LINK_TYPES.includes(linkType)) {
    return res.status(400).json({ success: false, message: "Invalid link type" });
  }
  if (particular && !PARTICULARS.includes(particular)) {
    return res.status(400).json({ success: false, message: "Invalid particular" });
  }
  if (particularDetails && particularDetails.length > MAX_META_LEN) {
    return res.status(400).json({ success: false, message: "Details are too long" });
  }
  if (paidAmount && paidAmount.length > MAX_AMOUNT_LEN) {
    return res.status(400).json({ success: false, message: "Amount is too long" });
  }
  return null;
}

// snake_case DB row -> camelCase API shape
function toLink(row) {
  if (!row) return null;
  return {
    id: row.id,
    placementUrl: row.placement_url,
    targetUrl: row.target_url,
    anchorText: row.anchor_text,
    partnerName: row.partner_name,
    linkType: row.link_type,
    particular: row.particular,
    particularDetails: row.particular_details,
    paidAmount: row.paid_amount,
    notes: row.notes,
    status: row.status,
    statusUpdatedAt: row.status_updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getById(id, userId) {
  return db.prepare("SELECT * FROM tracked_links WHERE id = ? AND user_id = ?").get(id, userId);
}

// GET /api/links
function getLinks(req, res) {
  const rows = db
    .prepare("SELECT * FROM tracked_links WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id);
  res.json({ success: true, data: { links: rows.map(toLink) } });
}

// POST /api/links
function createLink(req, res) {
  const {
    placementUrl,
    targetUrl,
    anchorText,
    partnerName,
    linkType,
    particular,
    particularDetails,
    paidAmount,
    notes,
  } = req.body || {};

  if (!placementUrl || !placementUrl.trim()) {
    return res.status(400).json({ success: false, message: "Placement URL is required" });
  }
  if (lengthError(res, { placementUrl, targetUrl, notes })) return;
  if (metadataError(res, { linkType, particular, particularDetails, paidAmount })) return;

  let normalizedPlacement;
  let normalizedTarget = "";
  try {
    normalizedPlacement = normalizeUrl(placementUrl);
    if (targetUrl && targetUrl.trim()) normalizedTarget = normalizeUrl(targetUrl);
  } catch {
    return res.status(400).json({ success: false, message: "Please enter a valid URL" });
  }

  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO tracked_links
         (user_id, placement_url, target_url, anchor_text, partner_name, link_type, particular,
          particular_details, paid_amount, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    )
    .run(
      req.user.id,
      normalizedPlacement,
      normalizedTarget,
      (anchorText || "").trim(),
      (partnerName || "").trim(),
      linkType || "",
      particular || "",
      (particularDetails || "").trim(),
      (paidAmount || "").trim(),
      notes || "",
      now,
      now
    );

  const link = toLink(getById(result.lastInsertRowid, req.user.id));
  res.status(201).json({ success: true, message: "Link added", data: { link } });
}

// PATCH /api/links/:id
function updateLink(req, res) {
  const { id } = req.params;
  const {
    placementUrl,
    targetUrl,
    anchorText,
    partnerName,
    linkType,
    particular,
    particularDetails,
    paidAmount,
    notes,
    status,
  } = req.body || {};

  const existing = getById(id, req.user.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: "Tracked link not found" });
  }
  if (lengthError(res, { placementUrl, targetUrl, notes })) return;
  if (metadataError(res, { linkType, particular, particularDetails, paidAmount })) return;

  const sets = [];
  const params = [];
  try {
    if (placementUrl !== undefined) {
      const n = normalizeUrl(placementUrl);
      if (!n) throw new Error("invalid");
      sets.push("placement_url = ?");
      params.push(n);
    }
    if (targetUrl !== undefined) {
      sets.push("target_url = ?");
      params.push(targetUrl && targetUrl.trim() ? normalizeUrl(targetUrl) : "");
    }
  } catch {
    return res.status(400).json({ success: false, message: "Please enter a valid URL" });
  }

  if (anchorText !== undefined) {
    sets.push("anchor_text = ?");
    params.push((anchorText || "").trim());
  }
  if (partnerName !== undefined) {
    sets.push("partner_name = ?");
    params.push((partnerName || "").trim());
  }
  if (linkType !== undefined) {
    sets.push("link_type = ?");
    params.push(linkType || "");
  }
  if (particular !== undefined) {
    sets.push("particular = ?");
    params.push(particular || "");
  }
  if (particularDetails !== undefined) {
    sets.push("particular_details = ?");
    params.push((particularDetails || "").trim());
  }
  if (paidAmount !== undefined) {
    sets.push("paid_amount = ?");
    params.push((paidAmount || "").trim());
  }
  if (notes !== undefined) {
    sets.push("notes = ?");
    params.push(notes || "");
  }
  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "status must be pending, live, or removed" });
    }
    sets.push("status = ?", "status_updated_at = ?");
    params.push(status, new Date().toISOString());
  }

  if (sets.length === 0) {
    return res.json({ success: true, message: "Nothing to update", data: { link: toLink(existing) } });
  }

  sets.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(id, req.user.id);

  db.prepare(`UPDATE tracked_links SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`).run(...params);

  res.json({ success: true, message: "Link updated", data: { link: toLink(getById(id, req.user.id)) } });
}

// DELETE /api/links/:id
function deleteLink(req, res) {
  const result = db
    .prepare("DELETE FROM tracked_links WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: "Tracked link not found" });
  }
  res.json({ success: true, message: "Link deleted" });
}

// GET /api/links/export.csv
function exportCsv(req, res) {
  const rows = db
    .prepare("SELECT * FROM tracked_links WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id)
    .map((r) => ({
      placementUrl: r.placement_url,
      targetUrl: r.target_url,
      anchorText: r.anchor_text,
      partnerName: r.partner_name,
      linkType: r.link_type,
      particular: r.particular,
      particularDetails: r.particular_details,
      paidAmount: r.paid_amount,
      status: r.status,
      notes: r.notes,
      dateAdded: r.created_at,
    }));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="swappsy-links.csv"');
  res.send(toCsv(rows, CSV_COLUMNS));
}

// POST /api/links/import  { csv }  -> { imported, skipped }
function importCsv(req, res) {
  const { csv } = req.body || {};
  if (!csv || typeof csv !== "string") {
    return res.status(400).json({ success: false, message: "Provide CSV text in a `csv` field" });
  }

  let parsed;
  try {
    parsed = parseCsv(csv);
  } catch {
    return res.status(400).json({ success: false, message: "Could not parse the CSV file" });
  }
  if (parsed.length === 0) {
    return res.status(400).json({ success: false, message: "No rows found in the CSV" });
  }

  const insert = db.prepare(
    `INSERT INTO tracked_links
       (user_id, placement_url, target_url, anchor_text, partner_name, link_type, particular,
        particular_details, paid_amount, notes, status, status_updated_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let imported = 0;
  let skipped = 0;
  db.exec("BEGIN");
  try {
    for (const row of parsed) {
      try {
        const placement = normalizeUrl(row.placementUrl);
        if (!placement) {
          skipped++;
          continue;
        }
        if (placement.length > MAX_URL_LEN) {
          skipped++;
          continue;
        }
        const target = row.targetUrl && row.targetUrl.trim() ? normalizeUrl(row.targetUrl) : "";
        const status = STATUSES.includes((row.status || "").trim()) ? row.status.trim() : "pending";
        const linkType = LINK_TYPES.includes((row.linkType || "").trim()) ? row.linkType.trim() : "";
        const particular = PARTICULARS.includes((row.particular || "").trim()) ? row.particular.trim() : "";
        const now = new Date().toISOString();
        insert.run(
          req.user.id,
          placement,
          target,
          (row.anchorText || "").trim(),
          (row.partnerName || "").trim(),
          linkType,
          particular,
          (row.particularDetails || "").trim().slice(0, MAX_META_LEN),
          (row.paidAmount || "").trim().slice(0, MAX_AMOUNT_LEN),
          (row.notes || "").slice(0, MAX_NOTES_LEN),
          status,
          status !== "pending" ? now : null,
          now,
          now
        );
        imported++;
      } catch {
        // Bad URL or row — skip it, keep importing the rest.
        skipped++;
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    console.error("CSV import failed:", err);
    return res.status(500).json({ success: false, message: "Import failed" });
  }

  res.json({ success: true, message: `Imported ${imported} link(s)`, data: { imported, skipped } });
}

module.exports = { getLinks, createLink, updateLink, deleteLink, exportCsv, importCsv, normalizeUrl, toLink };
