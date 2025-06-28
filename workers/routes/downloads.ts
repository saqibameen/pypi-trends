import { Hono } from "hono";
import { generateQuery, getAccessToken, queryBigQuery, generateTimeSeriesQuery } from "../lib/bigquery";
import {
  getCacheKey,
  getCacheUntilEndOfDay,
  getCachedResponse,
  cacheResponse,
} from "../utils/cache";
import {
  validatePeriod,
  validatePackageName,
  validateEnvironment,
  VALID_PERIODS,
} from "../utils/validation";
import type { Env } from "../types";

const downloadsRouter = new Hono<{ Bindings: Env }>();

// Time series endpoint for single package
downloadsRouter.get("/:packageName/timeseries", async (c) => {
  try {
    const packageName = c.req.param("packageName");
    const period = c.req.query("period") || "1year";
    const excludeCiCd = c.req.query("exclude_ci_cd") !== "false"; // Default to true
    const cacheBust = c.req.query("_t"); // Cache busting timestamp

    console.log("=== Time Series API Call Debug ===");
    console.log("Package:", packageName);
    console.log("Period:", period);
    console.log("Exclude CI/CD:", excludeCiCd);
    console.log("Cache bust:", cacheBust ? "YES" : "NO");

    if (!validatePackageName(packageName)) {
      return c.json({ error: "Package name is required" }, 400);
    }

    // Validate period parameter
    if (!validatePeriod(period)) {
      return c.json(
        {
          error:
            "Invalid period. Valid options: 1month, 3month, 6month, 1year, 2year, 5year, all",
          validPeriods: VALID_PERIODS,
        },
        400
      );
    }

    const cacheKey = getCacheKey(
      `${packageName}_timeseries`,
      period + (excludeCiCd ? "_no_ci" : "_with_ci")
    );

    // Try to get from cache first (skip if cache busting)
    if (!cacheBust) {
      const cachedData = await getCachedResponse(cacheKey);
      if (cachedData) {
        return c.json({
          ...cachedData,
          cached: true,
        });
      }
    }

    // Get environment variables
    const env = c.env as Env;
    console.log("Environment variables in route:");
    console.log("GOOGLE_CLOUD_PROJECT_ID:", env.GOOGLE_CLOUD_PROJECT_ID ? "SET" : "NOT SET");
    console.log("GOOGLE_CLOUD_KEY:", env.GOOGLE_CLOUD_KEY ? "SET" : "NOT SET");

    if (!validateEnvironment(env)) {
      return c.json(
        {
          error:
            "Missing required environment variables: GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_KEY",
        },
        500
      );
    }

    // Get access token and query BigQuery
    const accessToken = await getAccessToken(env.GOOGLE_CLOUD_KEY);
    const query = generateTimeSeriesQuery(packageName, period, excludeCiCd);
    const result = await queryBigQuery(
      query,
      env.GOOGLE_CLOUD_PROJECT_ID,
      accessToken
    );

    // Transform BigQuery result into time series data
    const timeSeriesData = result.rows?.map((row: any) => ({
      date: row.f[0].v, // First column: date
      downloads: parseInt(row.f[1].v) || 0, // Second column: download count
    })) || [];

    const responseData = {
      package: packageName,
      period,
      exclude_ci_cd: excludeCiCd,
      data: timeSeriesData,
      total_downloads: timeSeriesData.reduce((sum: number, item: any) => sum + item.downloads, 0),
      query_time: new Date().toISOString(),
      cached: false,
    };

    // Cache the response
    c.executionCtx.waitUntil(
      (async () => {
        const cacheSeconds = getCacheUntilEndOfDay();
        await cacheResponse(cacheKey, responseData, cacheSeconds);
      })()
    );

    return c.json(responseData);
  } catch (error) {
    console.error("Error fetching time series data:", error);
    return c.json(
      {
        error: "Failed to fetch time series data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Original aggregate endpoint (keeping for backward compatibility)
downloadsRouter.get("/:packageName", async (c) => {
  try {
    const packageName = c.req.param("packageName");
    const period = c.req.query("period") || "1month";
    const excludeCiCd = c.req.query("exclude_ci_cd") !== "false"; // Default to true, set to false to include CI/CD

    console.log("=== API Call Debug ===");
    console.log("Package:", packageName);
    console.log("Period:", period);
    console.log("Exclude CI/CD:", excludeCiCd);

    if (!validatePackageName(packageName)) {
      return c.json({ error: "Package name is required" }, 400);
    }

    // Validate period parameter
    if (!validatePeriod(period)) {
      return c.json(
        {
          error:
            "Invalid period. Valid options: 1month, 3month, 6month, 1year, 2year, 5year, all",
          validPeriods: VALID_PERIODS,
        },
        400
      );
    }

    const cacheKey = getCacheKey(
      packageName,
      period + (excludeCiCd ? "_no_ci" : "_with_ci")
    );

    // Try to get from cache first
    const cachedData = await getCachedResponse(cacheKey);
    if (cachedData) {
      return c.json({
        ...cachedData,
        cached: true,
      });
    }

    // Get environment variables
    const env = c.env as Env;
    console.log("Environment variables in route:");
    console.log("GOOGLE_CLOUD_PROJECT_ID:", env.GOOGLE_CLOUD_PROJECT_ID ? "SET" : "NOT SET");
    console.log("GOOGLE_CLOUD_KEY:", env.GOOGLE_CLOUD_KEY ? "SET" : "NOT SET");
    console.log("================================");

    if (!validateEnvironment(env)) {
      return c.json(
        {
          error:
            "Missing required environment variables: GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_KEY",
        },
        500
      );
    }

    // Get access token and query BigQuery
    const accessToken = await getAccessToken(env.GOOGLE_CLOUD_KEY);
    const query = generateQuery(packageName, period, excludeCiCd);
    const result = await queryBigQuery(
      query,
      env.GOOGLE_CLOUD_PROJECT_ID,
      accessToken
    );

    // Extract download count from result
    const downloadCount = result.rows?.[0]?.f?.[0]?.v || "0";

    const responseData = {
      package: packageName,
      period,
      downloads: parseInt(downloadCount),
      exclude_ci_cd: excludeCiCd,
      query_time: new Date().toISOString(),
      cached: false,
    };

    // Use waitUntil to cache asynchronously (non-blocking)
    c.executionCtx.waitUntil(
      (async () => {
        const cacheSeconds = getCacheUntilEndOfDay();
        await cacheResponse(cacheKey, responseData, cacheSeconds);
      })()
    );

    // Return response immediately (before caching completes)
    return c.json(responseData);
  } catch (error) {
    console.error("Error fetching download data:", error);
    return c.json(
      {
        error: "Failed to fetch download data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default downloadsRouter;
