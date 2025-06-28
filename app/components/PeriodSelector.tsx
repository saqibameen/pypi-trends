const PERIOD_OPTIONS = [
  { label: "1 Month", value: "1month" },
  { label: "3 Months", value: "3month" },
  { label: "6 Months", value: "6month" },
  { label: "1 Year", value: "1year" },
  { label: "2 Years", value: "2year" },
  { label: "All Time", value: "all" },
] as const;

type Period = typeof PERIOD_OPTIONS[number]["value"];

interface PeriodSelectorProps {
  darkMode: boolean;
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export default function PeriodSelector({
  darkMode,
  period,
  onPeriodChange
}: PeriodSelectorProps) {
  return (
    <div className="flex">
      <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl `}>
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Downloads in past:
        </span>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as Period)}
          className={`px-3 py-1 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 border
                   focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                     darkMode 
                       ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                       : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm'
                   }`}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export type { Period }; 