interface RunningPersonIconProps {
  className?: string;
  isRunning?: boolean;
}

export function RunningPersonIcon({ className = '', isRunning = false }: RunningPersonIconProps) {
  return (
    <svg viewBox="0 0 40 50" className={className}>
      {/* Head */}
      <circle cx="20" cy="8" r="6" fill="hsl(35 85% 70%)" stroke="hsl(220 20% 25%)" strokeWidth="1.5"/>
      
      {/* Body */}
      <path 
        d="M20 14 L20 28" 
        stroke="hsl(142 76% 50%)" 
        strokeWidth="4" 
        strokeLinecap="round"
      />
      
      {/* Arms */}
      <path 
        d={isRunning ? "M20 18 L10 14 M20 18 L30 22" : "M20 18 L10 24 M20 18 L30 24"}
        stroke="hsl(142 76% 50%)" 
        strokeWidth="3" 
        strokeLinecap="round"
        style={isRunning ? {
          animation: 'armWave 0.3s ease-in-out infinite alternate'
        } : undefined}
      />
      
      {/* Legs */}
      <path 
        d={isRunning ? "M20 28 L12 42 M20 28 L28 38" : "M20 28 L15 45 M20 28 L25 45"}
        stroke="hsl(200 75% 55%)" 
        strokeWidth="3" 
        strokeLinecap="round"
        style={isRunning ? {
          animation: 'legWave 0.2s ease-in-out infinite alternate'
        } : undefined}
      />
      
      {/* Motion lines when running */}
      {isRunning && (
        <>
          <line x1="5" y1="20" x2="2" y2="20" stroke="hsl(220 20% 50%)" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
          <line x1="6" y1="25" x2="2" y2="25" stroke="hsl(220 20% 50%)" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
          <line x1="7" y1="30" x2="3" y2="30" stroke="hsl(220 20% 50%)" strokeWidth="2" strokeLinecap="round" opacity="0.2"/>
        </>
      )}
    </svg>
  );
}
