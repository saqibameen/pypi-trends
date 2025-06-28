import * as React from "react";
import { useState, useEffect } from "react";
import { Moon, Sun, X, Plus, ChevronDown, Loader2, RefreshCw, Search } from "lucide-react";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

// Period options for the dropdown
const PERIOD_OPTIONS = [
  { value: "1month", label: "1 Month" },
  { value: "3month", label: "3 Months" },
  { value: "6month", label: "6 Months" },
  { value: "1year", label: "1 Year" },
  { value: "2year", label: "2 Years" },
  { value: "all", label: "All Time" },
] as const;

type Period = typeof PERIOD_OPTIONS[number]["value"];

// Package search results interface
interface Package {
  name: string;
  description: string;
  downloads?: number;
}

// API response interface
interface PackageTimeSeriesData {
  package: string;
  period: string;
  exclude_ci_cd: boolean;
  data: Array<{
    date: string;
    downloads: number;
  }>;
  total_downloads: number;
  query_time: string;
  cached?: boolean;
  error?: string;
}

const packageColors = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"
];

// Search packages with both predefined and API search
const searchPackages = async (query: string): Promise<Package[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    // Common packages for quick search
    const commonPackages = [
      { name: "requests", description: "Python HTTP for Humans." },
      { name: "numpy", description: "The fundamental package for scientific computing with Python." },
      { name: "pandas", description: "Powerful data structures for data analysis, time series, and statistics." },
      { name: "matplotlib", description: "A comprehensive library for creating static, animated, and interactive visualizations." },
      { name: "scipy", description: "A collection of mathematical algorithms and convenience functions." },
      { name: "flask", description: "A lightweight WSGI web application framework." },
      { name: "django", description: "A high-level Python web framework that encourages rapid development." },
      { name: "pillow", description: "The friendly PIL fork (Python Imaging Library)." },
      { name: "boto3", description: "The AWS SDK for Python." },
      { name: "pytest", description: "Simple powerful testing with Python." },
      { name: "click", description: "Composable command line interface toolkit." },
      { name: "jinja2", description: "A modern and designer-friendly templating language for Python." },
      { name: "sqlalchemy", description: "Database Abstraction Library." },
      { name: "fastapi", description: "FastAPI framework, high performance, easy to learn, fast to code." },
      { name: "tensorflow", description: "TensorFlow is an open source machine learning framework." },
      { name: "torch", description: "Tensors and Dynamic neural networks in Python." },
      { name: "scikit-learn", description: "A set of python modules for machine learning." },
      { name: "beautifulsoup4", description: "Screen-scraping library." },
      { name: "selenium", description: "Python bindings for Selenium WebDriver." },
      { name: "poetry", description: "Python dependency management and packaging made easy." },
    ];
    
    const filteredCommon = commonPackages
      .filter(pkg => pkg.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3);

    // If exact match or similar match found, return it
    const exactMatch = commonPackages.find(pkg => 
      pkg.name.toLowerCase() === query.toLowerCase()
    );
    
    if (exactMatch) {
      return [exactMatch, ...filteredCommon.filter(p => p.name !== exactMatch.name)];
    }

    // If user typed something not in our list, allow them to add it manually
    const results = [...filteredCommon];
    
    // Add the user's query as a searchable option if it's not already in results
    if (!results.some(pkg => pkg.name.toLowerCase() === query.toLowerCase())) {
      results.unshift({
        name: query.toLowerCase(),
        description: `Search for "${query}" package on PyPI`
      });
    }
    
    return results.slice(0, 5);
  } catch (error) {
    console.error("Error searching packages:", error);
    // Fallback: allow manual entry
    return [{
      name: query.toLowerCase(),
      description: `Search for "${query}" package on PyPI`
    }];
  }
};

// Fetch package time series data
const fetchPackageData = async (packageName: string, period: Period): Promise<PackageTimeSeriesData> => {
  try {
    const response = await fetch(`/api/downloads/${packageName}/timeseries?period=${period}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${packageName}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data for ${packageName}:`, error);
    return {
      package: packageName,
      period,
      exclude_ci_cd: true,
      data: [],
      total_downloads: 0,
      query_time: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Transform API data for chart consumption
const transformDataForChart = (packagesData: PackageTimeSeriesData[]): any[] => {
  if (!packagesData.length || !packagesData[0]?.data?.length) return [];

  // Get all unique dates from all packages
  const allDates = new Set<string>();
  packagesData.forEach(pkg => {
    if (pkg.data && !pkg.error) {
      pkg.data.forEach(item => allDates.add(item.date));
    }
  });

  const sortedDates = Array.from(allDates).sort();
  
  // If we have too many dates (mixed granularity), sample them based on period
  const currentPeriod = packagesData[0]?.period as Period;
  const maxExpectedDates: Record<Period, number> = {
    "1month": 35,    // Daily for 1 month (with some tolerance)
    "3month": 15,    // Weekly for 3 months  
    "6month": 8,     // Monthly for 6 months
    "1year": 15,     // Monthly for 1 year
    "2year": 30,     // Monthly for 2 years
    "all": 10        // Yearly
  };

  let finalDates = sortedDates;
  const maxDates = maxExpectedDates[currentPeriod];
  
  // If we have too many dates, sample them evenly
  if (sortedDates.length > maxDates) {
    const step = Math.floor(sortedDates.length / maxDates);
    finalDates = sortedDates.filter((_, index) => index % step === 0).slice(0, maxDates);
  }

  // Create chart data points with all packages
  return finalDates.map(date => {
    const dataPoint: any = { date };
    
    packagesData.forEach(pkg => {
      if (pkg.error) {
        dataPoint[pkg.package] = 0;
      } else {
        const dataForDate = pkg.data?.find(item => item.date === date);
        dataPoint[pkg.package] = dataForDate?.downloads || 0;
      }
    });
    
    return dataPoint;
  });
};

// Format numbers for display
const formatNumber = (num: number) => {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

// Format date for display based on the selected period
const formatDate = (dateStr: string, period: Period) => {
  const date = new Date(dateStr);
  
  switch (period) {
    case "1month":
      // Daily: "Jan 15"
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    case "3month":
    case "6month":
    case "1year":
      // Monthly: "Jan 2024"
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric'
      });
    case "2year":
    case "all":
      // Yearly: "2024"
      return date.getFullYear().toString();
    default:
      return dateStr;
  }
};

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.dataKey}:</span>
            <span className="font-medium text-gray-900">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Loading skeleton for chart
const ChartSkeleton = ({ darkMode }: { darkMode: boolean }) => (
  <div className={`w-full h-96 rounded-lg animate-pulse flex items-center justify-center ${
    darkMode ? 'bg-gray-800' : 'bg-gray-50'
  }`}>
    <div className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading chart...</div>
  </div>
);

// Loading skeleton for stats
const StatsSkeleton = ({ darkMode }: { darkMode: boolean }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`rounded-lg p-4 animate-pulse ${
        darkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className={`h-4 rounded mb-2 ${
          darkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}></div>
        <div className={`h-6 rounded ${
          darkMode ? 'bg-gray-600' : 'bg-gray-300'
        }`}></div>
      </div>
    ))}
  </div>
);

export default function Home() {
  // State management
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [packagesData, setPackagesData] = useState<PackageTimeSeriesData[]>([]);
  const [period, setPeriod] = useState<Period>("1year");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Package[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState<string[]>([]);

  // Theme management
  useEffect(() => {
    // Always start in light mode - don't read from localStorage yet
    setDarkMode(false);
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch data for all selected packages
  const fetchAllPackagesData = async () => {
    if (selectedPackages.length === 0) {
      setPackagesData([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const promises = selectedPackages.map(pkg => fetchPackageData(pkg, period));
      const results = await Promise.all(promises);
      setPackagesData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Refresh specific package data
  const refreshPackageData = async (packageName: string) => {
    setLoadingPackages(prev => [...prev, packageName]);
    
    try {
      const refreshedData = await fetchPackageData(packageName, period);
      setPackagesData(prev => 
        prev.map(pkg => 
          pkg.package === packageName ? refreshedData : pkg
        )
      );
    } catch (err) {
      console.error("Error refreshing package data:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh data");
    } finally {
      setLoadingPackages(prev => prev.filter(pkg => pkg !== packageName));
    }
  };

  // Handle search input
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const results = await searchPackages(query);
    setSearchResults(results);
    setShowDropdown(true);
  };

  // Handle search input key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        addPackage(searchQuery.trim().toLowerCase());
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Add package to selection
  const addPackage = (packageName: string) => {
    if (!selectedPackages.includes(packageName)) {
      setSelectedPackages(prev => [...prev, packageName]);
    }
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Remove package from selection
  const removePackage = (packageName: string) => {
    setSelectedPackages(prev => prev.filter(pkg => pkg !== packageName));
  };

  // Change time period
  const changePeriod = (period: Period) => {
    setPeriod(period);
  };

  // Fetch data when packages or period changes
  useEffect(() => {
    fetchAllPackagesData();
  }, [selectedPackages, period]);

  // Prepare chart data
  const chartData = transformDataForChart(packagesData);

  // Calculate summary stats
  const totalDownloads = packagesData.reduce((sum, pkg) => sum + (pkg.total_downloads || 0), 0);
  const avgDownloads = selectedPackages.length > 0 ? Math.round(totalDownloads / selectedPackages.length) : 0;
  const mostPopular = packagesData.reduce((max, pkg) => 
    (pkg.total_downloads || 0) > (max.total_downloads || 0) ? pkg : max, 
    packagesData[0] || { package: "N/A", total_downloads: 0 }
  );

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header */}
      <div className={`border-b flex-shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm" />
              </div>
              <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>pypi trends</h1>
          </div>
            
          <button
            onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors border ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
            >
              {darkMode ? (
                <Sun className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              ) : (
                <Moon className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              )}
          </button>
        </div>

          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Compare and discover download trends for Python packages over time
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Search Section */}
          <div className="mb-8">
            <div className="relative max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
                  placeholder="Enter a Python package..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  className={`w-full pl-12 pr-4 py-3 text-base border rounded-lg shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                             darkMode 
                               ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                               : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                           }`}
                />
              </div>
              
              {/* Search Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}>
                  {searchResults.map((pkg, index) => (
                    <button
                      key={index}
                      onClick={() => addPackage(pkg.name)}
                      className={`w-full px-4 py-3 text-left transition-colors border-b last:border-b-0 ${
                        darkMode 
                          ? 'hover:bg-gray-700 border-gray-600' 
                          : 'hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</div>
                      <div className={`text-xs mt-1 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{pkg.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Packages */}
            {selectedPackages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {selectedPackages.map((pkg, index) => (
                  <div
                    key={pkg}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: packageColors[index % packageColors.length] }}
                    />
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pkg}</span>
                    <button
                      onClick={() => removePackage(pkg)}
                      className={`ml-1 p-0.5 rounded-full transition-colors ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                      }`}
                    >
                      <X className={`w-3 h-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          {selectedPackages.length > 0 && (
            <>
              {/* Period Selector */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Downloads in past{" "}
                  <select
                    value={period}
                    onChange={(e) => changePeriod(e.target.value as Period)}
                    className={`ml-2 px-3 py-1 border rounded-md text-base
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                               darkMode 
                                 ? 'bg-gray-800 border-gray-600 text-white'
                                 : 'bg-white border-gray-300 text-gray-900'
                             }`}
                        >
                    {PERIOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </h2>
              </div>

              {/* Chart */}
              <div className={`rounded-xl shadow-sm mb-6 border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600' 
                  : 'bg-white border-gray-300'
              }`}>
              {loading ? (
                  <div className="p-8">
                <ChartSkeleton darkMode={darkMode} />
                  </div>
              ) : chartData.length > 0 ? (
                  <div className="p-6">
                    <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis 
                        dataKey="date" 
                            stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                            fontSize={12}
                            tickFormatter={(value) => formatDate(value, period)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                            stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                            fontSize={12}
                            tickFormatter={formatNumber}
                        axisLine={false}
                        tickLine={false}
                      />
                          <Tooltip content={<CustomTooltip />} />
                          {selectedPackages.map((pkg, index) => (
                          <Line
                            key={pkg}
                            type="monotone"
                            dataKey={pkg}
                            stroke={packageColors[index % packageColors.length]}
                              strokeWidth={2.5}
                              dot={false}
                              activeDot={{ r: 4, fill: packageColors[index % packageColors.length] }}
                          />
                          ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                        </div>
                      ) : (
                  <div className="p-8 text-center">
                    <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No data available for the selected packages and period
                          </div>
                          </div>
                      )}
                    </div>

              {/* Package Download Totals */}
              {!loading && packagesData.length > 0 && (
                <div className={`grid gap-4 ${
                  packagesData.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
                  packagesData.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  'grid-cols-1 md:grid-cols-3'
                }`}>
                  {packagesData.map((pkg, index) => {
                    const totalForPackage = pkg.data.reduce((sum: number, item: any) => sum + item.downloads, 0);
                    return (
                      <div key={pkg.package} className={`rounded-xl shadow-sm p-6 border ${
                        darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: packageColors[index % packageColors.length] }}
                          />
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{pkg.package}</div>
                        </div>
                        <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatNumber(totalForPackage)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {selectedPackages.length === 0 && (
            <div className="text-center py-20">
              <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center shadow-sm border ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
              }`}>
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Search for Python packages
              </h3>
              <p className={`max-w-md mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Start by searching for Python packages above to compare their download trends over time.
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="text-red-800 dark:text-red-200 text-sm">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
