const formatNumber = (num: number) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

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

interface PackageStatsProps {
  darkMode: boolean;
  loading: boolean;
  packagesData: PackageTimeSeriesData[];
  packageColors: string[];
}

export default function PackageStats({
  darkMode,
  loading,
  packagesData,
  packageColors
}: PackageStatsProps) {
  if (loading || packagesData.length === 0) return null;

  return (
    <div className={`grid gap-4 ${
      packagesData.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
      packagesData.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
      'grid-cols-1 md:grid-cols-3'
    }`}>
      {packagesData.map((pkg, index) => {
        const totalForPackage = pkg.data.reduce((sum: number, item: any) => sum + item.downloads, 0);
        return (
          <div key={pkg.package} className={`rounded-2xl p-6 transition-all duration-300 border ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:shadow-md shadow-gray-100/50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: packageColors[index % packageColors.length] }}
              />
              <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{pkg.package}</div>
            </div>
            <div className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatNumber(totalForPackage)}
            </div>
          </div>
        );
      })}
    </div>
  );
} 