interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-8 h-8" }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chart lines */}
      <path 
        d="M15 75 L35 45 L55 55 L85 25" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Data points */}
      <circle cx="15" cy="75" r="8" fill="currentColor" />
      <circle cx="35" cy="45" r="8" fill="currentColor" />
      <circle cx="55" cy="55" r="8" fill="currentColor" />
      <circle cx="85" cy="25" r="8" fill="currentColor" />
      
      {/* Inner dots for contrast */}
      <circle cx="15" cy="75" r="3" fill="white" />
      <circle cx="35" cy="45" r="3" fill="white" />
      <circle cx="55" cy="55" r="3" fill="white" />
      <circle cx="85" cy="25" r="3" fill="white" />
    </svg>
  );
} 