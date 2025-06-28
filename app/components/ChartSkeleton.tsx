interface ChartSkeletonProps {
  darkMode: boolean;
}

export default function ChartSkeleton({ darkMode }: ChartSkeletonProps) {
  return (
    <div className={`w-full h-96 rounded-lg animate-pulse flex items-center justify-center ${
      darkMode ? 'bg-gray-800' : 'bg-gray-50'
    }`}>
      <div className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading chart...</div>
    </div>
  );
} 