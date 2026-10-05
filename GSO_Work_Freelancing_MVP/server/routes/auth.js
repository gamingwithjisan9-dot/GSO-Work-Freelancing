const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { signToken } = require("../auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "freelancer" } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required" });
    if (!["client", "freelancer"].includes(role)) return res.status(400).json({ error: "Invalid role" });

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role",
      [name.trim(), email.trim().toLowerCase(), hash, role]
    );
    const user = result.rows[0];
    res.json({ user, token: signToken(user) });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email.trim().toLowerCase()]);
    if (!result.rows[0] || !(await bcrypt.compare(password, result.rows[0].password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const u = result.rows[0];
    const user = { id: u.id, name: u.name, email: u.email, role: u.role };
    res.json({ user, token: signToken(user) });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
