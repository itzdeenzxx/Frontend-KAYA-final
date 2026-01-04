interface PlayersIconProps {
  className?: string;
  count: 1 | 2;
}

export function PlayersIcon({ className = '', count }: PlayersIconProps) {
  return (
    <svg viewBox="0 0 48 32" className={className}>
      {/* First player */}
      <g>
        <circle cx={count === 2 ? 14 : 24} cy="10" r="8" fill="hsl(200 75% 60%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
        <ellipse cx={count === 2 ? 14 : 24} cy="26" rx="10" ry="6" fill="hsl(200 75% 60%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
        {/* Face */}
        <circle cx={count === 2 ? 11 : 21} cy="9" r="1.5" fill="hsl(220 20% 15%)"/>
        <circle cx={count === 2 ? 17 : 27} cy="9" r="1.5" fill="hsl(220 20% 15%)"/>
        <path d={count === 2 ? "M11 13 Q14 16 17 13" : "M21 13 Q24 16 27 13"} fill="none" stroke="hsl(220 20% 15%)" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
      
      {/* Second player (only for multiplayer) */}
      {count === 2 && (
        <g>
          <circle cx="34" cy="10" r="8" fill="hsl(340 75% 65%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
          <ellipse cx="34" cy="26" rx="10" ry="6" fill="hsl(340 75% 65%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
          {/* Face */}
          <circle cx="31" cy="9" r="1.5" fill="hsl(220 20% 15%)"/>
          <circle cx="37" cy="9" r="1.5" fill="hsl(220 20% 15%)"/>
          <path d="M31 13 Q34 16 37 13" fill="none" stroke="hsl(220 20% 15%)" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      )}
    </svg>
  );
}
