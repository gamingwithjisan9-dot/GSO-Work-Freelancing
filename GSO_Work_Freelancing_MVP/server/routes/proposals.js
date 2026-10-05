const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  if (req.user.role !== "freelancer") return res.status(403).json({ error: "Only freelancers can submit proposals" });
  const { job_id, cover_letter, bid_amount } = req.body;
  if (!job_id || !cover_letter) return res.status(400).json({ error: "Job and cover letter are required" });

  try {
    const result = await pool.query(
      "INSERT INTO proposals (job_id,freelancer_id,cover_letter,bid_amount) VALUES ($1,$2,$3,$4) RETURNING *",
      [job_id, req.user.id, cover_letter, bid_amount || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "You already applied to this job" });
    res.status(500).json({ error: "Could not submit proposal" });
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT p.*, j.title AS job_title
     FROM proposals p JOIN jobs j ON j.id=p.job_id
     WHERE p.freelancer_id=$1 ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

module.exports = router;
