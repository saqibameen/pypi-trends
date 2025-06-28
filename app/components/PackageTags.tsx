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
    <div className="flex flex-wrap gap-2 mt-6 justify-center">
      {selectedPackages.map((pkg, index) => (
        <div
          key={pkg}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border ${
            darkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-300'
          }`}
        >
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: packageColors[index % packageColors.length] }}
          />
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pkg}</span>
          <button
            onClick={() => onRemovePackage(pkg)}
            className={`ml-1 p-0.5 rounded-full transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <X className={`w-3 h-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>
      ))}
    </div>
  );
} 