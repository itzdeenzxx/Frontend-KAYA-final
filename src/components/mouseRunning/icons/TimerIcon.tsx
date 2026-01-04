interface TimerIconProps {
  className?: string;
}

export function TimerIcon({ className = '' }: TimerIconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      {/* Clock body */}
      <circle cx="20" cy="22" r="16" fill="hsl(220 25% 15%)" stroke="hsl(142 76% 50%)" strokeWidth="2"/>
      <circle cx="20" cy="22" r="13" fill="hsl(220 20% 10%)" stroke="hsl(220 20% 30%)" strokeWidth="1"/>
      
      {/* Top button */}
      <rect x="17" y="2" width="6" height="5" rx="1" fill="hsl(220 20% 40%)"/>
      
      {/* Clock hands */}
      <line x1="20" y1="22" x2="20" y2="13" stroke="hsl(142 76% 50%)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="22" x2="27" y2="22" stroke="hsl(45 100% 55%)" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Center dot */}
      <circle cx="20" cy="22" r="2" fill="hsl(0 85% 55%)"/>
      
      {/* Hour markers */}
      <circle cx="20" cy="11" r="1" fill="hsl(220 20% 50%)"/>
      <circle cx="31" cy="22" r="1" fill="hsl(220 20% 50%)"/>
      <circle cx="20" cy="33" r="1" fill="hsl(220 20% 50%)"/>
      <circle cx="9" cy="22" r="1" fill="hsl(220 20% 50%)"/>
    </svg>
  );
}
