import { X } from "lucide-react";

interface PackageTagsProps {
  darkMode: boolean;
  selectedPackages: string[];
  packageColors: string[];
  onRemovePackage: (packageName: string) => void;
}

export default function PackageTags({
  darkMode,
  selectedPackages,
  packageColors,
  onRemovePackage
}: PackageTagsProps) {
  if (selectedPackages.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {selectedPackages.map((pkg, index) => (
        <div
          key={pkg}
          className={`group flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 border ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 hover:shadow-lg' 
              : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:shadow-md'
          }`}
          style={{
            borderColor: darkMode ? undefined : packageColors[index % packageColors.length] + '20',
            backgroundColor: darkMode ? undefined : packageColors[index % packageColors.length] + '08'
          }}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: packageColors[index % packageColors.length] }}
          />
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pkg}</span>
          <button
            onClick={() => onRemovePackage(pkg)}
            className={`p-1 rounded-full transition-all duration-300 opacity-60 hover:opacity-100 ${
              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
} 