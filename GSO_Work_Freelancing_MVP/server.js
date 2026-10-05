require("dotenv").config();

const express = require("express");
const path = require("path");
const { initDb } = require("./server/db");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => res.json({ ok: true, app: "GSO Work Freelancing" }));

app.use("/api/auth", require("./server/routes/auth"));
app.use("/api/jobs", require("./server/routes/jobs"));
app.use("/api/proposals", require("./server/routes/proposals"));

app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 10000;

initDb()
  .then(() => app.listen(port, "0.0.0.0", () => console.log(`GSO Work running on ${port}`)))
  .catch(err => {
    console.error("Database initialization failed:", err);
    process.exit(1);
  });
