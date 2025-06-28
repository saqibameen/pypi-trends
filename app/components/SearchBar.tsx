import * as React from "react";

const PERIODS = [
  { value: "1month", label: "1 Month" },
  { value: "3month", label: "3 Months" },
  { value: "6month", label: "6 Months" },
  { value: "1year", label: "1 Year" },
  { value: "all", label: "All Time" },
];

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  period: string;
  onPeriodChange: (v: string) => void;
  loading: boolean;
  error: string | null;
}

export function SearchBar({ value, onChange, onSubmit, period, onPeriodChange, loading, error }: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-xl">
      <input
        type="text"
        className="border rounded px-4 py-2 flex-1 text-base"
        placeholder="Enter package names (comma or space separated)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      />
      <select
        className="border rounded px-4 py-2 text-base"
        value={period}
        onChange={(e) => onPeriodChange(e.target.value)}
        disabled={loading}
      >
        {PERIODS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <button
        type="submit"
        className="bg-black text-white rounded px-6 py-2 font-semibold hover:bg-gray-800 transition"
        disabled={loading}
      >
        {loading ? "Loading..." : "Compare"}
      </button>
      <div className="mt-2 text-red-500 min-h-[24px] w-full">{error}</div>
    </form>
  );
} 