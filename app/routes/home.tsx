import * as React from "react";
import { useState, useEffect } from "react";
import { Moon, Sun, X, Plus, ChevronDown, Loader2, RefreshCw } from "lucide-react";
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
  "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"
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
      // Weekly: "Jan 15" or "Jan 15 '25" for new year
      const isNewYear = date.getMonth() === 0 && date.getDate() <= 7;
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        ...(isNewYear ? { year: '2-digit' } : {})
      });
    
    case "6month":
      // Monthly: "Jan", "Feb", "Mar"
      return date.toLocaleDateString('en-US', { 
        month: 'short'
      });
    
    case "1year":
      // Monthly: "Jan 2025"
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric'
      });
    
    case "2year":
      // Monthly: "Jan '25"
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit'
      });
    
    case "all":
      // Yearly: "2025"
      return date.getFullYear().toString();
    
    default:
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
  }
};

// Skeleton components
const ChartSkeleton = ({ darkMode }: { darkMode: boolean }) => (
  <div style={{ height: "400px", width: "100%", position: "relative" }}>
    <div style={{
      width: "100%",
      height: "100%",
      backgroundColor: darkMode ? "#334155" : "#f1f5f9",
      borderRadius: "8px",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: "-100%",
        width: "100%",
        height: "100%",
        background: `linear-gradient(90deg, transparent, ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)"}, transparent)`,
        animation: "shimmer 2s infinite"
      }} />
    </div>
  </div>
);

const StatsSkeleton = ({ darkMode }: { darkMode: boolean }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`
  }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{
        padding: "16px",
        borderRadius: "8px",
        backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
        border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`
      }}>
        <div style={{
          height: "20px",
          backgroundColor: darkMode ? "#334155" : "#e2e8f0",
          borderRadius: "4px",
          marginBottom: "8px",
          width: "60%"
        }} />
        <div style={{
          height: "24px",
          backgroundColor: darkMode ? "#334155" : "#e2e8f0",
          borderRadius: "4px",
          marginBottom: "4px",
          width: "80%"
        }} />
        <div style={{
          height: "14px",
          backgroundColor: darkMode ? "#334155" : "#e2e8f0",
          borderRadius: "4px",
          width: "40%"
        }} />
      </div>
    ))}
  </div>
);

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPackages, setSelectedPackages] = useState<string[]>(["requests", "numpy", "pandas"]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1year");
  const [searchResults, setSearchResults] = useState<Package[]>([]);
  const [packagesData, setPackagesData] = useState<PackageTimeSeriesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [refreshingPackages, setRefreshingPackages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = localStorage.getItem("darkMode") === "true";
      setDarkMode(isDark);
      
      // Add CSS animation for shimmer effect
      const style = document.createElement('style');
      style.textContent = `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  // Fetch data when packages or period changes
  useEffect(() => {
    if (selectedPackages.length > 0) {
      fetchAllPackagesData();
    } else {
      setPackagesData([]);
    }
  }, [selectedPackages, selectedPeriod]);

  const fetchAllPackagesData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const promises = selectedPackages.map(pkg => fetchPackageData(pkg, selectedPeriod));
      const results = await Promise.all(promises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        setError(`Failed to fetch data for: ${errors.map(e => e.package).join(', ')}`);
      }
      
      // Only include successful results
      const successfulResults = results.filter(result => !result.error);
      setPackagesData(successfulResults);
    } catch (err) {
      console.error("Error fetching packages data:", err);
      setError("Failed to fetch package data. Please try again.");
      setPackagesData([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh specific package data (with cache busting)
  const refreshPackageData = async (packageName: string) => {
    setRefreshingPackages(prev => new Set(prev).add(packageName));
    
    try {
      // Add timestamp to bust cache
      const timestamp = Date.now();
      const response = await fetch(`/api/downloads/${packageName}/timeseries?period=${selectedPeriod}&_t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${packageName}: ${response.statusText}`);
      }
      
      const newData: PackageTimeSeriesData = await response.json();
      
      // Update the packagesData with fresh data for this package
      setPackagesData(prevData => 
        prevData.map(pkg => 
          pkg.package === packageName ? newData : pkg
        )
      );
      
    } catch (error) {
      console.error(`Error refreshing data for ${packageName}:`, error);
      setError(`Failed to refresh data for ${packageName}. Please try again.`);
    } finally {
      setRefreshingPackages(prev => {
        const newSet = new Set(prev);
        newSet.delete(packageName);
        return newSet;
      });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const results = await searchPackages(query);
      // Filter out already selected packages
      const filtered = results.filter(pkg => !selectedPackages.includes(pkg.name));
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (searchResults.length > 0) {
        // Add the first search result
        addPackage(searchResults[0].name);
      } else if (searchQuery.trim().length > 0) {
        // Add the typed query as package name
        addPackage(searchQuery.trim().toLowerCase());
      }
    }
  };

  const addPackage = (packageName: string) => {
    if (!selectedPackages.includes(packageName) && selectedPackages.length < 8) {
      setSelectedPackages([...selectedPackages, packageName]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removePackage = (packageName: string) => {
    setSelectedPackages(selectedPackages.filter((pkg) => pkg !== packageName));
  };

  const changePeriod = (period: Period) => {
    setSelectedPeriod(period);
    setShowPeriodDropdown(false);
  };

  const chartData = transformDataForChart(packagesData);

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
  };

  const mainStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 16px"
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px 0",
    borderBottom: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`
  };

  const searchSectionStyle: React.CSSProperties = {
    padding: "32px 0",
    borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`
  };

  const searchContainerStyle: React.CSSProperties = {
    position: "relative",
    maxWidth: "500px"
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "48px",
    padding: "0 16px",
    border: `2px solid ${darkMode ? "#475569" : "#e2e8f0"}`,
    borderRadius: "12px",
    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
    color: darkMode ? "#ffffff" : "#0f172a",
    outline: "none",
    fontSize: "16px",
    transition: "border-color 0.2s ease"
  };

  const controlsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginTop: "16px"
  };

  const dropdownStyle: React.CSSProperties = {
    position: "relative"
  };

  const dropdownButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    border: `1px solid ${darkMode ? "#475569" : "#e2e8f0"}`,
    borderRadius: "8px",
    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
    color: darkMode ? "#ffffff" : "#0f172a",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  };

  const chartSectionStyle: React.CSSProperties = {
    padding: "40px 0"
  };

  const chartCardStyle: React.CSSProperties = {
    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
    boxShadow: darkMode ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  };

  const packageTagsStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "24px"
  };

  return (
    <div style={containerStyle}>
      <div style={mainStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={{ 
              fontSize: "32px", 
              fontWeight: "700", 
              color: darkMode ? "#ffffff" : "#0f172a",
              margin: "0 0 8px 0" 
            }}>
              PyPI Trends
            </h1>
            <p style={{
              fontSize: "16px",
              color: darkMode ? "#94a3b8" : "#64748b",
              margin: 0
            }}>
              Compare Python package download statistics
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              border: `1px solid ${darkMode ? "#475569" : "#e2e8f0"}`,
              backgroundColor: darkMode ? "#334155" : "#f8fafc",
              color: darkMode ? "#ffffff" : "#0f172a",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? "#475569" : "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? "#334155" : "#f8fafc";
            }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Search Section */}
        <div style={searchSectionStyle}>
          <div style={searchContainerStyle}>
            <input
              type="text"
              placeholder="Search PyPI packages..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = darkMode ? "#475569" : "#e2e8f0";
              }}
            />
            {searchResults.length > 0 && (
              <div style={{
                position: "absolute",
                top: "56px",
                left: "0",
                right: "0",
                backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                border: `1px solid ${darkMode ? "#475569" : "#e2e8f0"}`,
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                zIndex: 10,
                maxHeight: "300px",
                overflowY: "auto"
              }}>
                {searchResults.map((pkg) => (
                  <div
                    key={pkg.name}
                    onClick={() => addPackage(pkg.name)}
                    style={{
                      padding: "16px 20px",
                      cursor: "pointer",
                      borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`,
                      color: darkMode ? "#ffffff" : "#0f172a"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? "#334155" : "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ fontWeight: "600", fontSize: "16px", marginBottom: "4px" }}>
                      {pkg.name}
                    </div>
                    <div style={{ 
                      fontSize: "14px", 
                      color: darkMode ? "#94a3b8" : "#64748b" 
                    }}>
                      {pkg.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={controlsStyle}>
            {/* Period Dropdown */}
            <div style={dropdownStyle}>
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                style={dropdownButtonStyle}
              >
                <span>
                  {PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label}
                </span>
                <ChevronDown size={16} />
              </button>
              
              {showPeriodDropdown && (
                <div style={{
                  position: "absolute",
                  top: "40px",
                  left: "0",
                  backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                  border: `1px solid ${darkMode ? "#475569" : "#e2e8f0"}`,
                  borderRadius: "8px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  zIndex: 20,
                  minWidth: "120px"
                }}>
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => changePeriod(option.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: selectedPeriod === option.value 
                          ? (darkMode ? "#334155" : "#f1f5f9")
                          : "transparent",
                        color: darkMode ? "#ffffff" : "#0f172a",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPeriod !== option.value) {
                          e.currentTarget.style.backgroundColor = darkMode ? "#334155" : "#f8fafc";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPeriod !== option.value) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Loading indicator */}
            {loading && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: darkMode ? "#94a3b8" : "#64748b",
                fontSize: "14px"
              }}>
                <Loader2 size={16} className="spin" />
                Loading data...
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: "16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#dc2626",
            fontSize: "14px",
            margin: "16px 0"
          }}>
            {error}
          </div>
        )}

        {/* Chart Section */}
        <div style={chartSectionStyle}>
          {selectedPackages.length > 0 ? (
            <div style={chartCardStyle}>
              {/* Package Tags */}
              <div style={packageTagsStyle}>
                {selectedPackages.map((pkg, index) => {
                  const pkgData = packagesData.find(p => p.package === pkg);
                  
                  return (
                    <div
                      key={pkg}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        backgroundColor: packageColors[index % packageColors.length] + "20",
                        border: `2px solid ${packageColors[index % packageColors.length]}`,
                        borderRadius: "24px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: darkMode ? "#ffffff" : "#0f172a",
                        opacity: loading ? 0.5 : (pkgData?.error ? 0.5 : 1)
                      }}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: packageColors[index % packageColors.length]
                        }}
                      />
                      {pkg}
                      {loading && (
                        <Loader2 size={12} className="spin" />
                      )}
                      {!loading && pkgData?.error && (
                        <span style={{ fontSize: "12px", color: "#dc2626" }}>
                          (error)
                        </span>
                      )}
                      {!loading && pkgData && (
                        <button
                          onClick={() => refreshPackageData(pkg)}
                          disabled={refreshingPackages.has(pkg)}
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "none",
                            backgroundColor: "transparent",
                            color: darkMode ? "#94a3b8" : "#64748b",
                            cursor: refreshingPackages.has(pkg) ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            opacity: refreshingPackages.has(pkg) ? 0.5 : 0.7
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = refreshingPackages.has(pkg) ? "0.5" : "0.7";
                          }}
                          title="Refresh data"
                        >
                          {refreshingPackages.has(pkg) ? (
                            <Loader2 size={12} className="spin" />
                          ) : (
                            <RefreshCw size={12} />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => removePackage(pkg)}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: "none",
                          backgroundColor: "transparent",
                          color: darkMode ? "#ffffff" : "#0f172a",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Chart */}
              {loading ? (
                <ChartSkeleton darkMode={darkMode} />
              ) : chartData.length > 0 ? (
                <div style={{ height: "400px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: darkMode ? '#94a3b8' : '#64748b' }}
                        tickFormatter={(str) => formatDate(str, selectedPeriod)}
                        interval={selectedPeriod === "1month" ? 2 : 
                                 selectedPeriod === "3month" ? 3 :
                                 selectedPeriod === "6month" ? 0 :
                                 selectedPeriod === "1year" ? 1 :
                                 selectedPeriod === "2year" ? 2 : 
                                 selectedPeriod === "all" ? 0 : 0}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: darkMode ? '#94a3b8' : '#64748b' }}
                        tickFormatter={formatNumber}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                          border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: darkMode ? '#ffffff' : '#0f172a',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: string) => [formatNumber(value), name]}
                        labelFormatter={(date: string) => formatDate(date, selectedPeriod)}
                      />
                      {selectedPackages.map((pkg, index) => {
                        const pkgData = packagesData.find(p => p.package === pkg);
                        if (pkgData?.error) return null;
                        
                        return (
                          <Line
                            key={pkg}
                            type="monotone"
                            dataKey={pkg}
                            stroke={packageColors[index % packageColors.length]}
                            strokeWidth={3}
                            dot={{ fill: packageColors[index % packageColors.length], strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, fill: packageColors[index % packageColors.length] }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{
                  height: "400px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: darkMode ? "#94a3b8" : "#64748b"
                }}>
                  No data available
                </div>
              )}

              {/* Package Stats */}
              {loading ? (
                <StatsSkeleton darkMode={darkMode} />
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  marginTop: "32px",
                  paddingTop: "24px",
                  borderTop: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`
                }}>
                  {packagesData.map((pkgData, index) => (
                    <div key={pkgData.package} style={{
                      padding: "16px",
                      borderRadius: "8px",
                      backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
                      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      opacity: pkgData.error ? 0.5 : 1
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px"
                      }}>
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            backgroundColor: packageColors[index % packageColors.length]
                          }}
                        />
                        <span style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: darkMode ? "#ffffff" : "#0f172a"
                        }}>
                          {pkgData.package}
                        </span>
                        {pkgData.cached && (
                          <span style={{
                            fontSize: "10px",
                            color: darkMode ? "#94a3b8" : "#64748b",
                            backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                            padding: "2px 6px",
                            borderRadius: "4px"
                          }}>
                            cached
                          </span>
                        )}
                      </div>
                      {pkgData.error ? (
                        <div style={{
                          fontSize: "12px",
                          color: "#dc2626"
                        }}>
                          Error loading data
                        </div>
                      ) : (
                        <>
                          <div style={{
                            fontSize: "20px",
                            fontWeight: "700",
                            color: darkMode ? "#ffffff" : "#0f172a",
                            marginBottom: "4px"
                          }}>
                            {formatNumber(pkgData.total_downloads)}
                          </div>
                          <div style={{
                            fontSize: "12px",
                            color: darkMode ? "#94a3b8" : "#64748b"
                          }}>
                            total downloads ({pkgData.period})
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              ...chartCardStyle,
              textAlign: "center",
              padding: "80px 32px"
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px"
              }}>
                <Plus size={32} color={darkMode ? "#94a3b8" : "#64748b"} />
              </div>
              <h3 style={{
                fontSize: "20px",
                fontWeight: "600",
                color: darkMode ? "#ffffff" : "#0f172a",
                margin: "0 0 8px 0"
              }}>
                Start Comparing Packages
              </h3>
              <p style={{
                fontSize: "16px",
                color: darkMode ? "#94a3b8" : "#64748b",
                margin: 0
              }}>
                Search for Python packages above to compare their download trends
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
