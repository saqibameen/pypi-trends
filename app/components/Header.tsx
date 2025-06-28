import { Sun, Moon } from "lucide-react";

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  return (
    <div className={`border-b flex-shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>pypi trends</h1>
          </div>
          
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition-colors border ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
            }`}
          >
            {darkMode ? (
              <Sun className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            ) : (
              <Moon className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            )}
          </button>
        </div>

        <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Compare and discover download trends for Python packages over time
        </p>
      </div>
    </div>
  );
} 