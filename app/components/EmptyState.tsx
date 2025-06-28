import { Search } from "lucide-react";

interface EmptyStateProps {
  darkMode: boolean;
}

export default function EmptyState({ darkMode }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${
        darkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <Search className={`w-10 h-10 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
      <h3 className={`text-xl font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Discover Python packages
      </h3>
      <p className={`max-w-md mx-auto text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Search for Python packages above to compare their download trends and discover insights over time.
      </p>
    </div>
  );
} 