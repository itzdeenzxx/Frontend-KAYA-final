interface MouseIconProps {
  className?: string;
  isRunning?: boolean;
  isHit?: boolean;
  color?: 'pink' | 'blue';
}

export function MouseIcon({ className = '', isRunning = false, isHit = false, color = 'pink' }: MouseIconProps) {
  const bodyColor = color === 'pink' ? 'hsl(340 75% 70%)' : 'hsl(200 75% 60%)';
  const bodyLight = color === 'pink' ? 'hsl(340 75% 80%)' : 'hsl(200 75% 75%)';
  const shirtColor = color === 'pink' ? 'hsl(0 85% 55%)' : 'hsl(220 85% 55%)';
  
  return (
    <svg 
      viewBox="0 0 100 140" 
      className={className}
      style={{ filter: isHit ? 'drop-shadow(0 0 10px hsl(0 85% 55%))' : undefined }}
    >
      {/* Ears */}
      <ellipse cx="25" cy="20" rx="18" ry="22" fill={bodyColor} stroke="hsl(220 20% 25%)" strokeWidth="2"/>
      <ellipse cx="75" cy="20" rx="18" ry="22" fill={bodyColor} stroke="hsl(220 20% 25%)" strokeWidth="2"/>
      <ellipse cx="25" cy="20" rx="10" ry="14" fill={bodyLight}/>
      <ellipse cx="75" cy="20" rx="10" ry="14" fill={bodyLight}/>
      
      {/* Head */}
      <ellipse cx="50" cy="45" rx="32" ry="28" fill={bodyColor} stroke="hsl(220 20% 25%)" strokeWidth="2"/>
      
      {/* Eyes */}
      <ellipse cx="38" cy="42" rx="8" ry="9" fill="hsl(220 20% 10%)"/>
      <ellipse cx="62" cy="42" rx="8" ry="9" fill="hsl(220 20% 10%)"/>
      <circle cx="40" cy="40" r="3" fill="white"/>
      <circle cx="64" cy="40" r="3" fill="white"/>
      
      {/* Nose */}
      <ellipse cx="50" cy="55" rx="6" ry="4" fill="hsl(350 80% 55%)"/>
      
      {/* Whiskers */}
      <line x1="20" y1="50" x2="35" y2="52" stroke="hsl(220 20% 25%)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="55" x2="35" y2="55" stroke="hsl(220 20% 25%)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="65" y1="52" x2="80" y2="50" stroke="hsl(220 20% 25%)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="65" y1="55" x2="80" y2="55" stroke="hsl(220 20% 25%)" strokeWidth="1.5" strokeLinecap="round"/>
      
      {/* Body/Shirt */}
      <rect x="35" y="70" width="30" height="40" rx="8" fill={shirtColor} stroke="hsl(220 20% 25%)" strokeWidth="2"/>
      
      {/* Arms */}
      <ellipse 
        cx="28" cy="85" rx="8" ry="16" 
        fill={bodyColor} 
        stroke="hsl(220 20% 25%)" 
        strokeWidth="2"
        style={{ 
          transformOrigin: '28px 75px',
          animation: isRunning ? 'armSwing 0.3s ease-in-out infinite alternate' : undefined
        }}
      />
      <ellipse 
        cx="72" cy="85" rx="8" ry="16" 
        fill={bodyColor} 
        stroke="hsl(220 20% 25%)" 
        strokeWidth="2"
        style={{ 
          transformOrigin: '72px 75px',
          animation: isRunning ? 'armSwing 0.3s ease-in-out infinite alternate-reverse' : undefined
        }}
      />
      
      {/* Legs */}
      <ellipse 
        cx="40" cy="125" rx="8" ry="14" 
        fill={bodyColor} 
        stroke="hsl(220 20% 25%)" 
        strokeWidth="2"
        style={{ 
          transformOrigin: '40px 115px',
          animation: isRunning ? 'legRun 0.2s ease-in-out infinite alternate' : undefined
        }}
      />
      <ellipse 
        cx="60" cy="125" rx="8" ry="14" 
        fill={bodyColor} 
        stroke="hsl(220 20% 25%)" 
        strokeWidth="2"
        style={{ 
          transformOrigin: '60px 115px',
          animation: isRunning ? 'legRun 0.2s ease-in-out infinite alternate-reverse' : undefined
        }}
      />
      
      {/* Hit effect */}
      {isHit && (
        <>
          <circle cx="50" cy="70" r="45" fill="none" stroke="hsl(0 85% 55%)" strokeWidth="3" opacity="0.6">
            <animate attributeName="r" from="30" to="60" dur="0.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.8" to="0" dur="0.5s" repeatCount="indefinite"/>
          </circle>
        </>
      )}
    </svg>
  );
}
