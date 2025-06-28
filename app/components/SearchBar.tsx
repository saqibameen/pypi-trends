import * as React from "react";
import { Search } from "lucide-react";

const PERIODS = [
  { value: "1month", label: "1 Month" },
  { value: "3month", label: "3 Months" },
  { value: "6month", label: "6 Months" },
  { value: "1year", label: "1 Year" },
  { value: "all", label: "All Time" },
];

interface Package {
  name: string;
  description: string;
  downloads?: number;
}

interface SearchBarProps {
  darkMode: boolean;
  searchQuery: string;
  searchResults: Package[];
  showDropdown: boolean;
  onSearchChange: (query: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onAddPackage: (packageName: string) => void;
}

export default function SearchBar({
  darkMode,
  searchQuery,
  searchResults,
  showDropdown,
  onSearchChange,
  onKeyDown,
  onFocus,
  onAddPackage
}: SearchBarProps) {
  return (
    <div className="mb-8">
      <div className="relative max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Enter a Python package..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
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
                onClick={() => onAddPackage(pkg.name)}
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
    </div>
  );
} 