const formatNumber = (num: number) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

export default function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl p-5 shadow-2xl border-0">
        <p className="text-base font-light text-gray-900 dark:text-white mb-3 tracking-wide">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 mb-2 last:mb-0">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-light text-gray-700 dark:text-gray-300">
              {entry.dataKey}:
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
} 