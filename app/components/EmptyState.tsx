import { Search } from "lucide-react";

interface EmptyStateProps {
  darkMode: boolean;
}

export default function EmptyState({ darkMode }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center shadow-sm border ${
        darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
      }`}>
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Search for Python packages
      </h3>
      <p className={`max-w-md mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Start by searching for Python packages above to compare their download trends over time.
      </p>
    </div>
  );
} 