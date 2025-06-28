const PERIOD_OPTIONS = [
  { label: "1 Month", value: "1month" },
  { label: "3 Months", value: "3month" },
  { label: "6 Months", value: "6month" },
  { label: "1 Year", value: "1year" },
  { label: "2 Years", value: "2year" },
  { label: "5 Years", value: "5year" },
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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Downloads in past{" "}
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as Period)}
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
  );
}

export type { Period }; 