interface CatIconProps {
  className?: string;
  isAngry?: boolean;
  levelId?: string;
}

function getCatTheme(levelId: string) {
  switch (levelId) {
    case 'easy':
      return {
        fur: 'hsl(142 30% 55%)', furLight: 'hsl(142 30% 68%)',
        earInner: 'hsl(100 45% 60%)', accent: 'hsl(45 90% 55%)',
        antenna: 'hsl(142 25% 40%)', antennaGlow: 'hsl(45 90% 55%)',
      };
    case 'medium':
      return {
        fur: 'hsl(35 50% 55%)', furLight: 'hsl(35 50% 68%)',
        earInner: 'hsl(25 60% 60%)', accent: 'hsl(200 85% 55%)',
        antenna: 'hsl(35 40% 35%)', antennaGlow: 'hsl(35 95% 55%)',
      };
    case 'hard':
      return {
        fur: 'hsl(0 30% 30%)', furLight: 'hsl(0 25% 40%)',
        earInner: 'hsl(0 50% 35%)', accent: 'hsl(0 85% 50%)',
        antenna: 'hsl(0 20% 25%)', antennaGlow: 'hsl(0 85% 55%)',
      };
    case 'party':
      return {
        fur: 'hsl(280 45% 58%)', furLight: 'hsl(280 45% 72%)',
        earInner: 'hsl(300 50% 65%)', accent: 'hsl(180 80% 55%)',
        antenna: 'hsl(280 35% 42%)', antennaGlow: 'hsl(180 80% 55%)',
      };
    default:
      return {
        fur: 'hsl(270 40% 65%)', furLight: 'hsl(270 40% 75%)',
        earInner: 'hsl(340 75% 70%)', accent: 'hsl(0 85% 55%)',
        antenna: 'hsl(220 20% 40%)', antennaGlow: 'hsl(0 85% 55%)',
      };
  }
}

export function CatIcon({ className = '', isAngry = false, levelId = '' }: CatIconProps) {
  const t = getCatTheme(levelId);

  return (
    <svg viewBox="0 0 100 100" className={className} style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))' }}>
      <defs>
        <linearGradient id={`catFur_${levelId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.furLight} />
          <stop offset="100%" stopColor={t.fur} />
        </linearGradient>
        <radialGradient id={`catEye_${levelId}`}>
          <stop offset="0%" stopColor="hsl(220 20% 18%)" />
          <stop offset="100%" stopColor="hsl(220 20% 6%)" />
        </radialGradient>
      </defs>

      {/* Ears */}
      <path d="M15 45 L25 10 L40 40 Z" fill={`url(#catFur_${levelId})`} stroke="hsl(220 18% 22%)" strokeWidth="2"/>
      <path d="M60 40 L75 10 L85 45 Z" fill={`url(#catFur_${levelId})`} stroke="hsl(220 18% 22%)" strokeWidth="2"/>
      <path d="M22 40 L28 18 L36 38 Z" fill={t.earInner} opacity="0.6"/>
      <path d="M64 38 L72 18 L78 40 Z" fill={t.earInner} opacity="0.6"/>

      {/* Head */}
      <ellipse cx="50" cy="55" rx="40" ry="38" fill={`url(#catFur_${levelId})`} stroke="hsl(220 18% 22%)" strokeWidth="2"/>
      {/* Fur highlight */}
      <ellipse cx="45" cy="42" rx="18" ry="12" fill="white" opacity="0.06"/>

      {/* Level-specific head accessories */}
      {levelId === 'easy' && (
        /* Flower on ear */
        <g transform="translate(80, 28)">
          <circle cx="0" cy="0" r="5" fill={t.accent} opacity="0.8"/>
          <circle cx="0" cy="0" r="2" fill="white" opacity="0.5"/>
        </g>
      )}
      {levelId === 'medium' && (
        /* Collar / tag */
        <ellipse cx="50" cy="88" rx="14" ry="3" fill={t.accent} opacity="0.5"/>
      )}
      {levelId === 'hard' && (
        /* Scar over eye + horns */
        <>
          <path d="M18 38 L20 5 L28 35" fill={t.accent} stroke="hsl(0 40% 18%)" strokeWidth="1" opacity="0.7"/>
          <path d="M72 35 L80 5 L82 38" fill={t.accent} stroke="hsl(0 40% 18%)" strokeWidth="1" opacity="0.7"/>
          <line x1="28" y1="40" x2="40" y2="55" stroke="hsl(0 50% 35%)" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
        </>
      )}
      {levelId === 'party' && (
        /* Bow tie */
        <>
          <path d="M40 88 L50 84 L60 88 L50 92 Z" fill={t.accent} opacity="0.7"/>
          <circle cx="50" cy="88" r="2.5" fill={t.antennaGlow} opacity="0.6"/>
        </>
      )}

      {/* Eyes */}
      {isAngry ? (
        <>
          <path d="M25 45 L42 55 L42 50 L25 40 Z" fill={`url(#catEye_${levelId})`}/>
          <path d="M75 45 L58 55 L58 50 L75 40 Z" fill={`url(#catEye_${levelId})`}/>
          <circle cx="35" cy="50" r="3" fill={t.accent}>
            <animate attributeName="opacity" values="1;0.5;1" dur="0.6s" repeatCount="indefinite"/>
          </circle>
          <circle cx="65" cy="50" r="3" fill={t.accent}>
            <animate attributeName="opacity" values="1;0.5;1" dur="0.6s" repeatCount="indefinite"/>
          </circle>
        </>
      ) : (
        <>
          <ellipse cx="35" cy="50" rx="10" ry="12" fill={`url(#catEye_${levelId})`}/>
          <ellipse cx="65" cy="50" rx="10" ry="12" fill={`url(#catEye_${levelId})`}/>
          <circle cx="38" cy="47" r="4" fill="white" opacity="0.85"/>
          <circle cx="68" cy="47" r="4" fill="white" opacity="0.85"/>
          <circle cx="33" cy="52" r="1.8" fill="white" opacity="0.35"/>
          <circle cx="63" cy="52" r="1.8" fill="white" opacity="0.35"/>
        </>
      )}

      {/* Nose */}
      <path d="M50 62 L45 68 L55 68 Z" fill="hsl(340 65% 50%)"/>
      <ellipse cx="50" cy="64" rx="2" ry="1.5" fill="hsl(340 65% 65%)" opacity="0.4"/>

      {/* Mouth */}
      <path d="M50 68 L50 74" stroke="hsl(220 18% 22%)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M41 74 Q50 80 59 74" fill="none" stroke="hsl(220 18% 22%)" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Whiskers */}
      <line x1="10" y1="60" x2="28" y2="63" stroke="hsl(220 18% 30%)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10" y1="68" x2="28" y2="68" stroke="hsl(220 18% 30%)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10" y1="76" x2="28" y2="73" stroke="hsl(220 18% 30%)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="72" y1="63" x2="90" y2="60" stroke="hsl(220 18% 30%)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="72" y1="68" x2="90" y2="68" stroke="hsl(220 18% 30%)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="72" y1="73" x2="90" y2="76" stroke="hsl(220 18% 30%)" strokeWidth="1.2" strokeLinecap="round"/>

      {/* Robot antenna */}
      <line x1="50" y1="15" x2="50" y2="5" stroke={t.antenna} strokeWidth="3"/>
      <circle cx="50" cy="3" r="4" fill={t.antennaGlow}>
        {isAngry && <animate attributeName="fill" values={`${t.antennaGlow};white;${t.antennaGlow}`} dur="0.5s" repeatCount="indefinite"/>}
      </circle>
      {/* Antenna glow */}
      <circle cx="50" cy="3" r="6" fill={t.antennaGlow} opacity="0.15"/>
    </svg>
  );
}
