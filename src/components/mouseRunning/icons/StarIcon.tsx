interface StarIconProps {
  className?: string;
  filled?: boolean;
}

export function StarIcon({ className = '', filled = true }: StarIconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <path 
        d="M20 2 L24 14 L37 14 L27 22 L31 35 L20 27 L9 35 L13 22 L3 14 L16 14 Z" 
        fill={filled ? "hsl(45 100% 55%)" : "none"} 
        stroke="hsl(35 95% 45%)" 
        strokeWidth="2"
      />
      {filled && (
        <path 
          d="M20 6 L16 14 L20 12 L24 14 Z" 
          fill="hsl(45 100% 75%)" 
          opacity="0.5"
        />
      )}
    </svg>
  );
}
