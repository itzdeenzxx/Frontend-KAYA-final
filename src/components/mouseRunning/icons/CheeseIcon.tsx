interface CheeseIconProps {
  className?: string;
}

export function CheeseIcon({ className = '' }: CheeseIconProps) {
  return (
    <svg viewBox="0 0 80 60" className={className}>
      {/* Main cheese wedge */}
      <path 
        d="M5 55 L40 5 L75 55 Z" 
        fill="hsl(45 95% 55%)" 
        stroke="hsl(35 95% 45%)" 
        strokeWidth="2"
      />
      
      {/* Cheese side */}
      <path 
        d="M5 55 L5 50 L40 5 L40 10 Z" 
        fill="hsl(45 90% 50%)" 
        stroke="hsl(35 95% 45%)" 
        strokeWidth="1"
      />
      
      {/* Holes */}
      <ellipse cx="25" cy="40" rx="6" ry="5" fill="hsl(45 85% 45%)"/>
      <ellipse cx="45" cy="45" rx="8" ry="6" fill="hsl(45 85% 45%)"/>
      <ellipse cx="55" cy="35" rx="5" ry="4" fill="hsl(45 85% 45%)"/>
      <ellipse cx="35" cy="30" rx="4" ry="3" fill="hsl(45 85% 45%)"/>
      <ellipse cx="60" cy="48" rx="4" ry="3" fill="hsl(45 85% 45%)"/>
      
      {/* Shine effect */}
      <path 
        d="M15 35 Q20 25 30 20" 
        fill="none" 
        stroke="hsl(45 100% 75%)" 
        strokeWidth="3" 
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* Sparkles */}
      <g className="animate-pulse">
        <path d="M10 15 L12 20 L10 25 L8 20 Z" fill="hsl(45 100% 80%)"/>
        <path d="M70 20 L72 25 L70 30 L68 25 Z" fill="hsl(45 100% 80%)"/>
      </g>
    </svg>
  );
}
