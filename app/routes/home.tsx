import * as React from "react";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import PackageTags from "../components/PackageTags";
import PeriodSelector, { type Period } from "../components/PeriodSelector";
import DownloadChart from "../components/DownloadChart";
import PackageStats from "../components/PackageStats";
import EmptyState from "../components/EmptyState";
import type { Route } from "./+types/home";

// Package colors for chart lines
const packageColors = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"
];

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

// Add meta function for SEO
export const meta: Route.MetaFunction = () => {
  return [
    { title: "PyPI Trends - Compare Python Package Download Statistics" },
    { 
      name: "description", 
      content: "Compare Python package download trends and statistics from PyPI. Visualize and analyze package popularity over time with interactive charts and detailed statistics." 
    },
    { name: "keywords", content: "PyPI, Python packages, download trends, package statistics, Python analytics, package comparison" },
    { property: "og:title", content: "PyPI Trends - Compare Python Package Download Statistics" },
    { property: "og:description", content: "Compare Python package download trends and statistics from PyPI. Visualize and analyze package popularity over time." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://pypi-trends.saqib-1a3.workers.dev" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "PyPI Trends - Compare Python Package Download Statistics" },
    { name: "twitter:description", content: "Compare Python package download trends and statistics from PyPI. Visualize and analyze package popularity over time." },
  ];
};

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

  // Load saved selected packages from localStorage on mount
  useEffect(() => {
    const savedPackages = localStorage.getItem('pypi-trends-packages');
    if (savedPackages) {
      try {
        const packages = JSON.parse(savedPackages);
        if (Array.isArray(packages) && packages.length > 0) {
          setSelectedPackages(packages);
        }
      } catch (error) {
        console.error('Error loading saved packages:', error);
      }
    }
  }, []);

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

  // Save selected packages to localStorage whenever they change
  useEffect(() => {
    if (selectedPackages.length > 0) {
      localStorage.setItem('pypi-trends-packages', JSON.stringify(selectedPackages));
    } else {
      localStorage.removeItem('pypi-trends-packages');
    }
  }, [selectedPackages]);

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
      <Header darkMode={darkMode} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <SearchBar
            darkMode={darkMode}
            searchQuery={searchQuery}
            searchResults={searchResults}
            showDropdown={showDropdown}
            onSearchChange={handleSearch}
            onKeyDown={handleKeyDown}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onAddPackage={addPackage}
          />

          {selectedPackages.length > 0 ? (
            <div className="flex items-center justify-between mb-6">
              <PackageTags
                darkMode={darkMode}
                selectedPackages={selectedPackages}
                packageColors={packageColors}
                onRemovePackage={removePackage}
              />
              <PeriodSelector
                darkMode={darkMode}
                period={period}
                onPeriodChange={changePeriod}
              />
            </div>
          ) : (
            <PackageTags
              darkMode={darkMode}
              selectedPackages={selectedPackages}
              packageColors={packageColors}
              onRemovePackage={removePackage}
            />
          )}

          {selectedPackages.length > 0 && (
            <>

              <DownloadChart
                darkMode={darkMode}
                loading={loading}
                chartData={chartData}
                selectedPackages={selectedPackages}
                packageColors={packageColors}
                period={period}
              />

              <PackageStats
                darkMode={darkMode}
                loading={loading}
                packagesData={packagesData}
                packageColors={packageColors}
              />
            </>
          )}

          {selectedPackages.length === 0 && (
            <EmptyState darkMode={darkMode} />
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
