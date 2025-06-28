// Valid time periods for download statistics
export const VALID_PERIODS = [
  "1month",
  "1m",
  "3month",
  "3m",
  "6month",
  "6m",
  "1year",
  "1y",
  "2year",
  "2y",
  "5year",
  "5y",
  "all",
  "alltime",
] as const;

export type ValidPeriod = typeof VALID_PERIODS[number];

// Validate period parameter
export function validatePeriod(period: string): period is ValidPeriod {
  return VALID_PERIODS.includes(period as ValidPeriod);
}

// Validate package name
export function validatePackageName(packageName: string): boolean {
  return packageName && packageName.trim().length > 0;
}

// Validate environment variables
export function validateEnvironment(env: any): env is { GOOGLE_CLOUD_PROJECT_ID: string; GOOGLE_CLOUD_KEY: string } {
  return typeof env.GOOGLE_CLOUD_PROJECT_ID === 'string' && 
         typeof env.GOOGLE_CLOUD_KEY === 'string' &&
         env.GOOGLE_CLOUD_PROJECT_ID.length > 0 &&
         env.GOOGLE_CLOUD_KEY.length > 0;
} 