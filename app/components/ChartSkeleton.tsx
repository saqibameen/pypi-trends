interface ChartSkeletonProps {
  darkMode: boolean;
}

export default function ChartSkeleton({ darkMode }: ChartSkeletonProps) {
  return (
    <div className={`w-full h-96 rounded-2xl animate-pulse flex items-center justify-center ${
      darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
    }`}>
      <div className={`text-lg font-light tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Loading chart...
      </div>
    </div>
  );
} 