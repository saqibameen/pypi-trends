export interface Env {
  GOOGLE_CLOUD_PROJECT_ID: string;
  GOOGLE_CLOUD_KEY: string;
}

export interface DownloadResponse {
  package: string;
  period: string;
  downloads: number;
  exclude_ci_cd: boolean;
  query_time: string;
  cached: boolean;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  validPeriods?: string[];
} 