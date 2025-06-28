import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ChartSkeleton from "./ChartSkeleton";
import CustomTooltip from "./CustomTooltip";
import { type Period } from "./PeriodSelector";

const formatNumber = (num: number) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

const formatDate = (dateStr: string, period: Period) => {
  const date = new Date(dateStr);
  
  if (period === "1month" || period === "3month") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } else if (period === "6month" || period === "1year") {
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  } else {
    return date.toLocaleDateString("en-US", { year: "numeric" });
  }
};

interface DownloadChartProps {
  darkMode: boolean;
  loading: boolean;
  chartData: any[];
  selectedPackages: string[];
  packageColors: string[];
  period: Period;
}

export default function DownloadChart({
  darkMode,
  loading,
  chartData,
  selectedPackages,
  packageColors,
  period
}: DownloadChartProps) {
  return (
    <div className={`rounded-2xl mb-8 transition-all duration-300 border ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200 shadow-lg shadow-gray-100/50'
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
                  fontWeight={300}
                  tickFormatter={(value) => formatDate(value, period)}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis 
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  fontSize={12}
                  fontWeight={300}
                  tickFormatter={formatNumber}
                  axisLine={false}
                  tickLine={false}
                  dx={-8}
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
                    activeDot={{ r: 5, fill: packageColors[index % packageColors.length], strokeWidth: 2, stroke: 'white' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className={`text-base font-light ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No data available for the selected packages and period
          </div>
        </div>
      )}
    </div>
  );
} 