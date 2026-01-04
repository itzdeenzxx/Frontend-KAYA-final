interface SparkleIconProps {
  className?: string;
}

export function SparkleIcon({ className = '' }: SparkleIconProps) {
  return (
    <svg viewBox="0 0 30 30" className={className}>
      <path 
        d="M15 2 L17 12 L27 15 L17 18 L15 28 L13 18 L3 15 L13 12 Z" 
        fill="hsl(45 100% 70%)"
      />
      <path 
        d="M15 5 L16 12 L15 10 L14 12 Z" 
        fill="hsl(45 100% 85%)"
        opacity="0.8"
      />
    </svg>
  );
}
