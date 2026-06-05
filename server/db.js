const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "tracker.db");

// Ensure the parent directory exists (SQLite won't create it).
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Uses Node's built-in SQLite (node:sqlite) — no native build step, so the tool
// installs and self-hosts with a plain `npm install`. Requires Node >= 22.
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// --- Schema ---------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tracked_links (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    placement_url     TEXT NOT NULL,
    target_url        TEXT DEFAULT '',
    anchor_text       TEXT DEFAULT '',
    partner_name      TEXT DEFAULT '',
    link_type         TEXT DEFAULT ''
                        CHECK (link_type IN ('dofollow','nofollow','sponsored','')),
    particular        TEXT DEFAULT ''
                        CHECK (particular IN ('free','exchange','paid','')),
    particular_details TEXT DEFAULT '',
    paid_amount       TEXT DEFAULT '',
    notes             TEXT DEFAULT '',
    status            TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','live','removed')),
    status_updated_at TEXT,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_links_user_created
    ON tracked_links(user_id, created_at DESC);
`);

// Lightweight migrations for users upgrading an existing tracker.db. SQLite's
// CREATE TABLE IF NOT EXISTS does not add columns to an existing table.
function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name);
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}

ensureColumn("tracked_links", "link_type", "TEXT DEFAULT ''");
ensureColumn("tracked_links", "particular", "TEXT DEFAULT ''");
ensureColumn("tracked_links", "particular_details", "TEXT DEFAULT ''");
ensureColumn("tracked_links", "paid_amount", "TEXT DEFAULT ''");

// --- Single-user seed -----------------------------------------------------
// On first boot, create the admin account from env. Idempotent.
function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      "[db] ADMIN_EMAIL / ADMIN_PASSWORD not set — no user seeded. Set them in .env to log in."
    );
    return;
  }
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return;
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)"
  ).run(email, hash, new Date().toISOString());
  console.log(`[db] seeded admin user: ${email}`);
}

seedAdminUser();

module.exports = db;
