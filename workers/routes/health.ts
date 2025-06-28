import { Hono } from "hono";
import type { Env } from "../types";

const healthRouter = new Hono<{ Bindings: Env }>();

healthRouter.get("/", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoint to check environment variables
healthRouter.get("/debug", (c) => {
  const env = c.env as Env;
  return c.json({
    status: "debug",
    timestamp: new Date().toISOString(),
    environment: {
      GOOGLE_CLOUD_PROJECT_ID: env.GOOGLE_CLOUD_PROJECT_ID ? "SET" : "NOT SET",
      GOOGLE_CLOUD_KEY: env.GOOGLE_CLOUD_KEY ? "SET" : "NOT SET",
      project_id_length: env.GOOGLE_CLOUD_PROJECT_ID?.length || 0,
      key_length: env.GOOGLE_CLOUD_KEY?.length || 0,
    }
  });
});

export default healthRouter;
