import Logo from "./Logo";

interface HeaderProps {
  darkMode: boolean;
}

export default function Header({ darkMode }: HeaderProps) {
  return (
    <div className={`border-b ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="flex items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <Logo className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className={`text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                PyPI
              </h1>
              <span className={`text-xl font-light ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                trends
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 