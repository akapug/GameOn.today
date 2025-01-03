
import { Router } from "express";
import { getChangelog } from "./routes/changelog";

const router = Router();

router.get("/api/changelog", async (_req, res) => {
  try {
    const entries = await getChangelog();
    console.log('Fetched changelog entries:', entries);
    res.setHeader('Content-Type', 'application/json');
    if (!entries || entries.length === 0) {
      return res.status(404).json({ error: "No changelog entries found" });
    }
    return res.json(entries);
  } catch (error) {
    console.error("Failed to fetch changelog:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to fetch changelog entries: ${message}` });
  }
});

export default router;
