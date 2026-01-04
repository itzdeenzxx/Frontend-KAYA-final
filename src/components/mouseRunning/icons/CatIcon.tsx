interface CatIconProps {
  className?: string;
  isAngry?: boolean;
}

export function CatIcon({ className = '', isAngry = false }: CatIconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      {/* Ears */}
      <path d="M15 45 L25 10 L40 40 Z" fill="hsl(270 40% 65%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
      <path d="M60 40 L75 10 L85 45 Z" fill="hsl(270 40% 65%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
      <path d="M22 40 L28 18 L36 38 Z" fill="hsl(340 75% 70%)"/>
      <path d="M64 38 L72 18 L78 40 Z" fill="hsl(340 75% 70%)"/>
      
      {/* Head */}
      <ellipse cx="50" cy="55" rx="40" ry="38" fill="hsl(270 40% 65%)" stroke="hsl(220 20% 25%)" strokeWidth="2"/>
      
      {/* Eyes */}
      {isAngry ? (
        <>
          <path d="M25 45 L42 55 L42 50 L25 40 Z" fill="hsl(220 20% 10%)"/>
          <path d="M75 45 L58 55 L58 50 L75 40 Z" fill="hsl(220 20% 10%)"/>
          <circle cx="35" cy="50" r="3" fill="hsl(0 85% 55%)"/>
          <circle cx="65" cy="50" r="3" fill="hsl(0 85% 55%)"/>
        </>
      ) : (
        <>
          <ellipse cx="35" cy="50" rx="10" ry="12" fill="hsl(220 20% 10%)"/>
          <ellipse cx="65" cy="50" rx="10" ry="12" fill="hsl(220 20% 10%)"/>
          <circle cx="38" cy="47" r="4" fill="white"/>
          <circle cx="68" cy="47" r="4" fill="white"/>
        </>
      )}
      
      {/* Nose */}
      <path d="M50 62 L45 68 L55 68 Z" fill="hsl(340 75% 60%)"/>
      
      {/* Mouth */}
      <path d="M50 68 L50 75" stroke="hsl(220 20% 25%)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M40 75 Q50 82 60 75" fill="none" stroke="hsl(220 20% 25%)" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Whiskers */}
      <line x1="10" y1="60" x2="28" y2="63" stroke="hsl(220 20% 25%)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="68" x2="28" y2="68" stroke="hsl(220 20% 25%)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="76" x2="28" y2="73" stroke="hsl(220 20% 25%)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="72" y1="63" x2="90" y2="60" stroke="hsl(220 20% 25%)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="72" y1="68" x2="90" y2="68" stroke="hsl(220 20% 25%)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="72" y1="73" x2="90" y2="76" stroke="hsl(220 20% 25%)" strokeWidth="1.5" strokeLinecap="round"/>
      
      {/* Robot antenna */}
      <line x1="50" y1="15" x2="50" y2="5" stroke="hsl(220 20% 40%)" strokeWidth="3"/>
      <circle cx="50" cy="3" r="4" fill="hsl(0 85% 55%)">
        {isAngry && <animate attributeName="fill" values="hsl(0 85% 55%);hsl(0 85% 75%);hsl(0 85% 55%)" dur="0.5s" repeatCount="indefinite"/>}
      </circle>
    </svg>
  );
}
