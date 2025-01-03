
import { Router } from "express";
import { getChangelog } from "./routes/changelog";

const router = Router();

router.get("/api/changelog", async (_req, res) => {
  try {
    const entries = await getChangelog();
    console.log('Fetched changelog entries:', entries);
    res.json(entries);
  } catch (error) {
    console.error("Failed to fetch changelog:", error);
    res.status(500).json({ error: "Failed to fetch changelog entries" });
  }
});

export default router;
