interface RocketIconProps {
  className?: string;
  animated?: boolean;
}

export function RocketIcon({ className = '', animated = false }: RocketIconProps) {
  return (
    <svg viewBox="0 0 60 80" className={className}>
      {/* Rocket body */}
      <path 
        d="M30 5 C15 20 15 50 20 65 L40 65 C45 50 45 20 30 5" 
        fill="hsl(0 0% 95%)" 
        stroke="hsl(220 20% 30%)" 
        strokeWidth="2"
      />
      
      {/* Rocket nose */}
      <path 
        d="M30 5 C22 15 22 25 25 30 L35 30 C38 25 38 15 30 5" 
        fill="hsl(0 85% 55%)" 
        stroke="hsl(0 70% 45%)" 
        strokeWidth="1"
      />
      
      {/* Window */}
      <circle cx="30" cy="35" r="8" fill="hsl(200 90% 60%)" stroke="hsl(220 20% 30%)" strokeWidth="2"/>
      <circle cx="32" cy="33" r="3" fill="hsl(200 90% 80%)" opacity="0.6"/>
      
      {/* Fins */}
      <path d="M20 55 L8 70 L20 65 Z" fill="hsl(0 85% 55%)" stroke="hsl(0 70% 45%)" strokeWidth="1"/>
      <path d="M40 55 L52 70 L40 65 Z" fill="hsl(0 85% 55%)" stroke="hsl(0 70% 45%)" strokeWidth="1"/>
      
      {/* Flames */}
      {animated && (
        <g>
          <path d="M25 65 L30 85 L35 65" fill="hsl(35 95% 55%)">
            <animate attributeName="d" 
              values="M25 65 L30 85 L35 65;M25 65 L30 90 L35 65;M25 65 L30 85 L35 65" 
              dur="0.2s" 
              repeatCount="indefinite"/>
          </path>
          <path d="M27 65 L30 78 L33 65" fill="hsl(45 100% 60%)">
            <animate attributeName="d" 
              values="M27 65 L30 78 L33 65;M27 65 L30 82 L33 65;M27 65 L30 78 L33 65" 
              dur="0.15s" 
              repeatCount="indefinite"/>
          </path>
          <path d="M28 65 L30 72 L32 65" fill="hsl(45 100% 80%)">
            <animate attributeName="d" 
              values="M28 65 L30 72 L32 65;M28 65 L30 75 L32 65;M28 65 L30 72 L32 65" 
              dur="0.1s" 
              repeatCount="indefinite"/>
          </path>
        </g>
      )}
    </svg>
  );
}
