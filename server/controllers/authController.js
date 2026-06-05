const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");

const TOKEN_TTL = "30d";

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

// POST /api/auth/login  { email, password } -> { token, user }
function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }
  const user = db.prepare("SELECT id, email, password_hash FROM users WHERE email = ?").get(email);
  // Same generic message whether the email or the password is wrong.
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }
  const token = sign(user);
  res.json({ success: true, data: { token, user: { id: user.id, email: user.email } } });
}

// GET /api/auth/me -> { user }  (requires auth)
function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}

module.exports = { login, me };
