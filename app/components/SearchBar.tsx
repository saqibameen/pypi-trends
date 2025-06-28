import * as React from "react";
import { useEffect } from "react";
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
      <div className="relative w-full">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search Python packages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            className={`w-full pl-14 pr-5 py-4 text-base font-light rounded-2xl transition-all duration-300 border
                     focus:outline-none focus:ring-3 hover:shadow-md ${
                       darkMode 
                         ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500/30 focus:border-blue-500/50 hover:bg-gray-750' 
                         : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500/30 focus:border-blue-500/50 hover:bg-gray-50'
                     }`}
          />
        </div>
        
        {/* Search Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className={`absolute z-10 w-full mt-2 rounded-2xl shadow-xl max-h-80 overflow-y-auto border ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 shadow-black/25' 
              : 'bg-white border-gray-200 shadow-gray-200/50'
          }`}>
            {searchResults.map((pkg, index) => (
              <button
                key={index}
                onClick={() => onAddPackage(pkg.name)}
                className={`w-full px-5 py-4 text-left transition-all duration-200 first:rounded-t-2xl last:rounded-b-2xl ${
                  darkMode 
                    ? 'hover:bg-gray-700 hover:shadow-inner' 
                    : 'hover:bg-blue-50 hover:shadow-inner'
                }`}
              >
                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</div>
                <div className={`text-xs mt-1 opacity-70 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{pkg.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 