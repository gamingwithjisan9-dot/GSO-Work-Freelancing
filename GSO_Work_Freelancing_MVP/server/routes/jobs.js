const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const result = await pool.query(
    `SELECT j.*, u.name AS client_name
     FROM jobs j JOIN users u ON u.id=j.client_id
     ORDER BY j.created_at DESC`
  );
  res.json(result.rows);
});

router.get("/:id", async (req, res) => {
  const result = await pool.query(
    `SELECT j.*, u.name AS client_name
     FROM jobs j JOIN users u ON u.id=j.client_id WHERE j.id=$1`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Job not found" });
  res.json(result.rows[0]);
});

router.post("/", requireAuth, async (req, res) => {
  if (req.user.role !== "client") return res.status(403).json({ error: "Only clients can post jobs" });
  const { title, description, budget, category } = req.body;
  if (!title || !description) return res.status(400).json({ error: "Title and description are required" });

  const result = await pool.query(
    "INSERT INTO jobs (client_id,title,description,budget,category) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [req.user.id, title, description, budget || null, category || null]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
