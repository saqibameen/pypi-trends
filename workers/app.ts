import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRequestHandler } from "react-router";
import downloadsRouter from "./routes/downloads";
import healthRouter from "./routes/health";
import type { Env } from "./types";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

const app = new Hono<{ Bindings: Env }>();

// Debug logging for environment variables
console.log("=== Environment Variables Debug ===");
console.log("NODE_ENV:", import.meta.env.MODE);
console.log("Note: Environment variables will be available in route handlers via c.env");
console.log("===================================");

// Enable CORS for all routes
app.use("*", cors());

// Mount API routes
app.route("/api/downloads", downloadsRouter);
app.route("/api/health", healthRouter);

// React Router fallback - this should be last
app.all("*", (c) => {
  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx as ExecutionContext },
  });
});

export default app;
