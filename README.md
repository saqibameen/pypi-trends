# PyPI Trends

A modern web application for comparing Python package download trends, inspired by [npmtrends.com](https://npmtrends.com) but built specifically for the Python ecosystem.

🚀 **Live App**: [https://pypi-trends.saqib-1a3.workers.dev](https://pypi-trends.saqib-1a3.workers.dev)

## About

PyPI Trends allows developers to visualize and compare download statistics for Python packages from the Python Package Index (PyPI). Search for packages, analyze their popularity trends over time, and make data-driven decisions about which packages to use in your projects.

## Features

- **📊 Interactive Charts**: Visualize download trends with responsive, interactive charts
- **🔍 Smart Package Search**: Search with autocomplete for popular Python packages
- **📈 Multiple Time Periods**: Analyze trends from 1 month to all-time data
- **⚡ Fast Performance**: Built on Cloudflare Workers for global edge performance
- **🎯 CI/CD Filtering**: Option to exclude CI/CD downloads for more accurate user metrics
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **⚡ Real-time Data**: Fresh data from Google BigQuery's PyPI public dataset

## Tech Stack

- **Frontend**: React 19 + React Router 7
- **Backend**: Hono (lightweight web framework)
- **Runtime**: Cloudflare Workers + Pages
- **Charts**: Recharts for interactive visualizations
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite 6
- **Data Source**: Google BigQuery (PyPI public dataset)
- **Caching**: Cloudflare Cache API for optimal performance

## API

The application provides a public API for accessing PyPI download data:

### Get Package Time Series Data
```
GET /api/downloads/{package}/timeseries?period={period}&exclude_ci_cd={boolean}
```

**Parameters:**
- `package` (required): PyPI package name (e.g., "requests", "numpy")
- `period` (optional): Time period - `1month`, `3month`, `6month`, `1year`, `2year`, `all` (default: `1year`)
- `exclude_ci_cd` (optional): Filter out CI/CD downloads - `true`/`false` (default: `true`)

**Example:**
```bash
curl "https://pypi-trends.saqib-1a3.workers.dev/api/downloads/requests/timeseries?period=6month"
```

**Response:**
```json
{
  "package": "requests",
  "period": "6month",
  "exclude_ci_cd": true,
  "data": [
    {"date": "2024-01-01", "downloads": 12500000},
    {"date": "2024-02-01", "downloads": 13200000}
  ],
  "total_downloads": 75000000,
  "query_time": "2024-06-28T10:30:00Z",
  "cached": false
}
```

### Health Check
```
GET /api/health
```

Returns API status and basic metrics.

## Development

### Prerequisites

- Node.js 18+
- Google Cloud account with BigQuery access
- Cloudflare account (for deployment)

### Local Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd pypi-trends
   npm install
   ```

2. **Set up Google Cloud credentials:**
   - Create a service account with BigQuery Data Viewer permissions
   - Download the service account key JSON
   - Add to your environment variables

3. **Configure environment variables:**
   ```bash
   # For local development, create .env.local with:
   
   # Required for BigQuery API access
   GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
   GOOGLE_CLOUD_KEY={"type":"service_account","project_id":"your-project",...}
   
   # Optional: Google Analytics Measurement ID (format: G-XXXXXXXXXX)
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   
   # For production deployment, set these as Cloudflare secrets:
   wrangler secret put GOOGLE_CLOUD_PROJECT_ID
   wrangler secret put GOOGLE_CLOUD_KEY
   # GA tracking ID can be set as a regular var in wrangler.jsonc
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   App will be available at `http://localhost:5173`

### Building and Deployment

```bash
# Build the application
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run deploy` - Build and deploy to Cloudflare
- `npm run typecheck` - Run TypeScript checks

## Project Structure

```
├── app/                      # React frontend application
│   ├── components/          # Reusable UI components
│   │   ├── DownloadChart.tsx    # Interactive chart component
│   │   ├── SearchBar.tsx        # Package search interface
│   │   ├── PackageStats.tsx     # Statistics display
│   │   └── ...
│   ├── routes/              # React Router pages
│   │   └── home.tsx        # Main application page
│   ├── app.css             # Global styles
│   └── root.tsx            # App root component
├── workers/                 # Cloudflare Workers backend
│   ├── app.ts              # Main worker entry point
│   ├── lib/                # External service integrations
│   │   └── bigquery.ts     # BigQuery API client
│   ├── routes/             # API route handlers
│   │   ├── downloads.ts    # Download statistics API
│   │   └── health.ts       # Health check endpoint
│   ├── utils/              # Utility functions
│   │   ├── cache.ts        # Caching utilities
│   │   └── validation.ts   # Input validation
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
│   └── favicon.ico
├── package.json
├── wrangler.jsonc          # Cloudflare Workers configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── vite.config.ts          # Vite build configuration
```

## Performance Features

- **Edge Caching**: Responses cached at Cloudflare edge locations globally
- **Smart Caching**: Cache TTL optimized based on data freshness requirements
- **Bundle Optimization**: Code splitting and tree shaking for minimal bundle size
- **CDN Assets**: Static assets served from Cloudflare's global CDN

## Data Source

This application uses Google BigQuery's public PyPI dataset, which contains:
- Download events for all PyPI packages
- Metadata about downloads (timestamp, file info, installer type)
- Updated daily with fresh download statistics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using modern web technologies and deployed on Cloudflare's edge network for blazing-fast performance worldwide.
