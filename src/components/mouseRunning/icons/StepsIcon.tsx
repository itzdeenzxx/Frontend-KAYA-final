interface StepsIconProps {
  className?: string;
}

export function StepsIcon({ className = '' }: StepsIconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      {/* Left foot */}
      <path 
        d="M8 25 C5 25 3 22 3 18 C3 12 6 8 10 8 C14 8 17 12 17 18 C17 22 15 25 12 25 L10 32 C10 34 9 35 8 35 L7 35 C6 35 5 34 5 32 L8 25" 
        fill="hsl(200 75% 60%)" 
        stroke="hsl(220 20% 25%)" 
        strokeWidth="1.5"
      />
      
      {/* Right foot */}
      <path 
        d="M28 18 C25 18 23 15 23 11 C23 5 26 1 30 1 C34 1 37 5 37 11 C37 15 35 18 32 18 L30 25 C30 27 29 28 28 28 L27 28 C26 28 25 27 25 25 L28 18" 
        fill="hsl(142 76% 50%)" 
        stroke="hsl(220 20% 25%)" 
        strokeWidth="1.5"
      />
      
      {/* Motion lines */}
      <path d="M18 30 L22 28" stroke="hsl(220 20% 50%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M16 33 L20 31" stroke="hsl(220 20% 50%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M14 36 L18 34" stroke="hsl(220 20% 50%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
    </svg>
  );
}
