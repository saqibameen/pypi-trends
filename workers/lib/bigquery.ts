// Helper function to generate BigQuery SQL for time series data
export function generateTimeSeriesQuery(
  packageName: string,
  period: string,
  excludeCiCd: boolean = true
): string {
  // Base WHERE conditions
  let whereConditions = [`file.project = '${packageName}'`];

  // Add CI/CD exclusion filter if requested
  if (excludeCiCd) {
    whereConditions.push(`details.installer.name = 'pip'`); // Only include pip installs, excludes most CI/CD
  }

  // Determine granularity and date range based on period
  let dateFormat: string;
  let dateRangeClause: string;

  switch (period) {
    case "1month":
    case "1m":
      dateFormat = "DATE(timestamp)"; // Daily granularity for 1 month (~30 data points)
      dateRangeClause = "DATE(timestamp) >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 0 MONTH) AND DATE(timestamp) < DATE_ADD(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 1 MONTH)";
      break;
    case "3month":
    case "3m":
      dateFormat = "DATE_TRUNC(DATE(timestamp), WEEK)"; // Weekly granularity for 3 months (~12 data points)
      dateRangeClause = "DATE(timestamp) >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 2 MONTH) AND DATE(timestamp) < DATE_ADD(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 1 MONTH)";
      break;
    case "6month":
    case "6m":
      dateFormat = "DATE_TRUNC(DATE(timestamp), MONTH)"; // Monthly granularity for 6 months (6 data points)
      dateRangeClause = "DATE(timestamp) >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 5 MONTH) AND DATE(timestamp) < DATE_ADD(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 1 MONTH)";
      break;
    case "1year":
    case "1y":
      dateFormat = "DATE_TRUNC(DATE(timestamp), MONTH)"; // Monthly granularity for 1 year (12 data points)
      dateRangeClause = "DATE(timestamp) >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 11 MONTH) AND DATE(timestamp) < DATE_ADD(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 1 MONTH)";
      break;
    case "2year":
    case "2y":
      dateFormat = "DATE_TRUNC(DATE(timestamp), MONTH)"; // Monthly granularity for 2 years (24 data points)
      dateRangeClause = "DATE(timestamp) >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 23 MONTH) AND DATE(timestamp) < DATE_ADD(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 1 MONTH)";
      break;
    case "all":
    case "alltime":
      // For all time, we'll use yearly granularity
      return `
        SELECT 
          DATE_TRUNC(DATE(timestamp), YEAR) AS date,
          COUNT(*) AS downloads
        FROM \`bigquery-public-data.pypi.file_downloads\`
        WHERE ${whereConditions.join(" AND ")}
        GROUP BY date
        ORDER BY date ASC
      `;
    default:
      dateFormat = "DATE(timestamp)";
      dateRangeClause = "DATE(timestamp) >= DATE_SUB(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 0 MONTH) AND DATE(timestamp) < DATE_ADD(DATE_TRUNC(CURRENT_DATE(), MONTH), INTERVAL 1 MONTH)";
  }

  // Add date filter
  whereConditions.push(dateRangeClause);

  return `
    SELECT 
      ${dateFormat} AS date,
      COUNT(*) AS downloads
    FROM \`bigquery-public-data.pypi.file_downloads\`
    WHERE ${whereConditions.join(" AND ")}
    GROUP BY date
    ORDER BY date ASC
  `;
}

// Helper function to generate BigQuery SQL based on period
export function generateQuery(
  packageName: string,
  period: string,
  excludeCiCd: boolean = true
): string {
  let intervalClause: string;

  // Base WHERE conditions
  let whereConditions = [`file.project = '${packageName}'`];

  // Add CI/CD exclusion filter if requested
  if (excludeCiCd) {
    whereConditions.push(`details.installer.name = 'pip'`); // Only include pip installs, excludes most CI/CD
    // Alternative: you could also exclude specific CI/CD installers:
    // whereConditions.push(`details.installer.name NOT IN ('bandersnatch', 'browser_download', 'setuptools')`)
  }

  switch (period) {
    case "1month":
    case "1m":
      intervalClause = "INTERVAL 30 DAY";
      break;
    case "3month":
    case "3m":
      intervalClause = "INTERVAL 90 DAY";
      break;
    case "6month":
    case "6m":
      intervalClause = "INTERVAL 180 DAY";
      break;
    case "1year":
    case "1y":
      intervalClause = "INTERVAL 365 DAY";
      break;
    case "2year":
    case "2y":
      intervalClause = "INTERVAL 730 DAY";
      break;
    case "all":
    case "alltime":
      // For all time, we don't add date filter
      return `
        SELECT COUNT(*) AS num_downloads
        FROM \`bigquery-public-data.pypi.file_downloads\`
        WHERE ${whereConditions.join(" AND ")}
      `;
    default:
      intervalClause = "INTERVAL 30 DAY"; // default to 1 month
  }

  // Add date filter
  whereConditions.push(
    `DATE(timestamp) BETWEEN DATE_SUB(CURRENT_DATE(), ${intervalClause}) AND CURRENT_DATE()`
  );

  return `
    SELECT COUNT(*) AS num_downloads
    FROM \`bigquery-public-data.pypi.file_downloads\`
    WHERE ${whereConditions.join(" AND ")}
  `;
}

// Helper function to get Google Cloud access token
export async function getAccessToken(serviceAccountKey: string): Promise<string> {
  console.log("=== Access Token Debug ===");
  
  const key = JSON.parse(serviceAccountKey);
  console.log("Service account email:", key.client_email);
  console.log("Project ID from key:", key.project_id);
  
  const now = Math.floor(Date.now() / 1000);
  const jwt = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/bigquery.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  console.log("JWT payload:", jwt);

  // Create JWT header and payload
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify(jwt));
  
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(
      atob(
        key.private_key
          .replace(/-----BEGIN PRIVATE KEY-----/, "")
          .replace(/-----END PRIVATE KEY-----/, "")
          .replace(/\s/g, "")
      ),
      (c) => c.charCodeAt(0)
    ),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );

  const signedJWT = `${header}.${payload}.${btoa(
    String.fromCharCode(...new Uint8Array(signature))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")}`;

  console.log("Signed JWT (first 50 chars):", signedJWT.substring(0, 50) + "...");

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJWT}`,
  });

  console.log("Token response status:", tokenResponse.status);
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.log("Token error response:", errorText);
    throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };
  console.log("Access token obtained successfully");
  console.log("================================");
  return tokenData.access_token;
}

// Helper function to query BigQuery
export async function queryBigQuery(
  query: string,
  projectId: string,
  accessToken: string
): Promise<any> {
  console.log("=== BigQuery Debug ===");
  console.log("Project ID:", projectId);
  console.log("Access Token (first 20 chars):", accessToken.substring(0, 20) + "...");
  console.log("Query:", query);
  
  const response = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        useLegacySql: false,
        maxResults: 10000, // Increased from 1 to allow time series data
      }),
    }
  );

  console.log("Response status:", response.status);
  console.log("Response status text:", response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.log("Error response body:", errorText);
    throw new Error(
      `BigQuery API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const result = await response.json();
  console.log("BigQuery result:", result);
  console.log("=====================");
  return result;
} 