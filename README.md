# PyPITrends.com

A web application for comparing Python package download trends, similar to [npmtrends.com](https://npmtrends.com) but for the Python ecosystem.

## About

PyPITrends.com allows users to compare download statistics and trends for Python packages from the Python Package Index (PyPI). Users can search for packages, view their download trends over time, and compare multiple packages side by side.

## Features

- **Package Search**: Search for Python packages by name
- **Trend Analysis**: View download trends and statistics over time
- **Package Comparison**: Compare multiple packages side by side
- **Download Statistics**: See total downloads, recent activity, and growth patterns
- **Modern UI**: Clean, responsive interface built with React
- **Caching**: Intelligent caching for improved performance
- **CI/CD Filtering**: Option to exclude CI/CD downloads for more accurate user metrics

## Tech Stack

- **Frontend**: React + React Router
- **Backend**: Hono (lightweight web framework)
- **Deployment**: Cloudflare Workers
- **Build Tool**: Vite
- **Styling**: CSS
- **Data Source**: Google BigQuery (PyPI public dataset)
- **Caching**: Cloudflare Cache API

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Google Cloud Account** with BigQuery access
4. **Cloudflare Account** (for deployment)

## Environment Setup

### 1. Google Cloud Setup

1. Create a new Google Cloud project or use an existing one
2. Enable the BigQuery API
3. Create a service account with BigQuery Data Viewer permissions
4. Download the service account key (JSON format)

### 2. Local Environment Configuration

1. Copy the example environment file:
   ```bash
   cp env.example env.local
   ```

2. Edit `env.local` and add your Google Cloud credentials:
   ```bash
   # Google Cloud Configuration
   GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
   GOOGLE_CLOUD_KEY={"type":"service_account",...}
   ```

### 3. Cloudflare Environment Variables

For production deployment, set these as secrets in Cloudflare:

```bash
# Set the project ID
wrangler secret put GOOGLE_CLOUD_PROJECT_ID

# Set the service account key
wrangler secret put GOOGLE_CLOUD_KEY
```

## Development

### Installation

```bash
npm install
```

### Local Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

## API Endpoints

### Get Package Downloads
```
GET /api/downloads/:packageName?period=1month&exclude_ci_cd=true
```

**Parameters:**
- `packageName` (required): The PyPI package name
- `period` (optional): Time period (`1month`, `3month`, `6month`, `1year`, `2year`, `5year`, `all`)
- `exclude_ci_cd` (optional): Filter out CI/CD downloads (default: `true`)

**Example:**
```bash
curl "http://localhost:3000/api/downloads/requests?period=1month"
```

### Health Check
```
GET /api/health
```

## Deployment

### Deploy to Cloudflare Workers

```bash
npm run deploy
```

This will:
1. Build the application
2. Deploy to Cloudflare Workers
3. Make your API available at your Cloudflare Workers URL

## Project Structure

```
├── app/                    # React frontend
│   ├── routes/            # React Router routes
│   └── ...
├── workers/               # Backend API
│   ├── app.ts            # Main application entry
│   ├── lib/              # External service integrations
│   │   └── bigquery.ts   # BigQuery API functions
│   ├── utils/            # Utility functions
│   │   ├── cache.ts      # Caching utilities
│   │   └── validation.ts # Input validation
│   ├── routes/           # API route handlers
│   │   ├── downloads.ts  # Downloads API
│   │   └── health.ts     # Health check
│   └── types/            # TypeScript type definitions
├── env.example           # Environment variables template
└── env.local             # Local development environment
```

## Contributing

This project is built using a React-Router + Hono template optimized for Cloudflare Workers deployment. The stack combines the power of React for the frontend with Hono's lightweight API capabilities, all deployed on Cloudflare's edge network for fast global performance.

### Development Guidelines

1. Follow the existing code structure and patterns
2. Add proper TypeScript types for new features
3. Include error handling for API endpoints
4. Test your changes locally before deploying
5. Update documentation for new features

## License

[Add your license here]
