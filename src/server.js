import express from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import { config } from "./config.js";
import { runPipeline } from "./services/pipelineService.js";

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

app.use(express.json({ limit: "2mb" }));
app.use(pinoHttp({ logger }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/process/dry-run", async (req, res) => {
  try {
    const { imageUrl, targetLongEdge } = req.body ?? {};
    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }
    const result = await runPipeline({ imageUrl, targetLongEdge, dryRun: true });
    return res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "dry-run failed");
    return res.status(500).json({ error: error.message });
  }
});

app.post("/process", async (req, res) => {
  try {
    const { imageUrl, targetLongEdge } = req.body ?? {};
    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }
    const result = await runPipeline({ imageUrl, targetLongEdge, dryRun: false });
    return res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "processing failed");
    return res.status(500).json({ error: error.message });
  }
});

app.listen(config.port, () => {
  logger.info({ port: config.port }, "pipeline service running");
});
