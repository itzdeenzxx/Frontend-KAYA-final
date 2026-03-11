interface MouseIconProps {
  className?: string;
  isRunning?: boolean;
  isHit?: boolean;
  color?: 'pink' | 'blue';
  levelId?: string;
  style?: React.CSSProperties;
}

/** Per-level color palettes for the mouse character */
function getThemeColors(levelId: string, color: 'pink' | 'blue') {
  // If multiplayer, P2 always blue; P1 uses level theme
  if (color === 'blue') {
    return {
      body: 'hsl(200 75% 60%)', bodyLight: 'hsl(200 75% 75%)',
      shirt: 'hsl(220 85% 55%)', shirtAccent: 'hsl(220 85% 70%)',
      accessory: 'hsl(200 80% 50%)', accessory2: 'hsl(210 70% 65%)',
    };
  }
  switch (levelId) {
    case 'easy':
      return {
        body: 'hsl(35 60% 70%)', bodyLight: 'hsl(35 60% 82%)',
        shirt: 'hsl(142 55% 45%)', shirtAccent: 'hsl(142 55% 58%)',
        accessory: 'hsl(45 90% 55%)', accessory2: 'hsl(100 50% 55%)',
      };
    case 'medium':
      return {
        body: 'hsl(25 55% 65%)', bodyLight: 'hsl(25 55% 78%)',
        shirt: 'hsl(35 90% 50%)', shirtAccent: 'hsl(25 90% 60%)',
        accessory: 'hsl(200 85% 55%)', accessory2: 'hsl(35 95% 60%)',
      };
    case 'hard':
      return {
        body: 'hsl(260 15% 55%)', bodyLight: 'hsl(260 15% 68%)',
        shirt: 'hsl(0 70% 35%)', shirtAccent: 'hsl(0 85% 45%)',
        accessory: 'hsl(0 80% 50%)', accessory2: 'hsl(270 40% 50%)',
      };
    case 'party':
      return {
        body: 'hsl(300 50% 72%)', bodyLight: 'hsl(300 50% 84%)',
        shirt: 'hsl(280 70% 55%)', shirtAccent: 'hsl(280 70% 68%)',
        accessory: 'hsl(180 80% 55%)', accessory2: 'hsl(50 90% 60%)',
      };
    default:
      return {
        body: 'hsl(340 75% 70%)', bodyLight: 'hsl(340 75% 80%)',
        shirt: 'hsl(0 85% 55%)', shirtAccent: 'hsl(0 85% 65%)',
        accessory: 'hsl(45 90% 55%)', accessory2: 'hsl(340 75% 60%)',
      };
  }
}

export function MouseIcon({ className = '', isRunning = false, isHit = false, color = 'pink', levelId = '', style }: MouseIconProps) {
  const t = getThemeColors(levelId, color);

  return (
    <svg viewBox="0 0 100 145" className={className} style={{
      ...style,
      filter: isHit ? 'drop-shadow(0 0 12px hsl(0 85% 55%))' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
    }}>
      <defs>
        <linearGradient id={`mouseBody_${levelId}_${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.bodyLight} />
          <stop offset="100%" stopColor={t.body} />
        </linearGradient>
        <linearGradient id={`mouseShirt_${levelId}_${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.shirtAccent} />
          <stop offset="100%" stopColor={t.shirt} />
        </linearGradient>
        <radialGradient id={`mouseEye_${levelId}`}>
          <stop offset="0%" stopColor="hsl(220 20% 18%)" />
          <stop offset="100%" stopColor="hsl(220 20% 8%)" />
        </radialGradient>
      </defs>

      {/* ── Ears ── */}
      <ellipse cx="25" cy="20" rx="18" ry="22" fill={`url(#mouseBody_${levelId}_${color})`} stroke="hsl(220 18% 22%)" strokeWidth="2"/>
      <ellipse cx="75" cy="20" rx="18" ry="22" fill={`url(#mouseBody_${levelId}_${color})`} stroke="hsl(220 18% 22%)" strokeWidth="2"/>
      <ellipse cx="25" cy="20" rx="10" ry="14" fill={t.bodyLight} opacity="0.7"/>
      <ellipse cx="75" cy="20" rx="10" ry="14" fill={t.bodyLight} opacity="0.7"/>
      {/* Inner-ear accent per theme */}
      <ellipse cx="25" cy="22" rx="6" ry="9" fill={t.accessory} opacity="0.3"/>
      <ellipse cx="75" cy="22" rx="6" ry="9" fill={t.accessory} opacity="0.3"/>

      {/* ── Head ── */}
      <ellipse cx="50" cy="45" rx="33" ry="29" fill={`url(#mouseBody_${levelId}_${color})`} stroke="hsl(220 18% 22%)" strokeWidth="2"/>
      {/* Cheek blush */}
      <ellipse cx="28" cy="52" rx="7" ry="4" fill={t.accessory} opacity="0.18"/>
      <ellipse cx="72" cy="52" rx="7" ry="4" fill={t.accessory} opacity="0.18"/>

      {/* ── Eyes ── */}
      <ellipse cx="38" cy="42" rx="9" ry="10" fill={`url(#mouseEye_${levelId})`}/>
      <ellipse cx="62" cy="42" rx="9" ry="10" fill={`url(#mouseEye_${levelId})`}/>
      {/* Iris highlight */}
      <circle cx="41" cy="39" r="3.5" fill="white" opacity="0.9"/>
      <circle cx="65" cy="39" r="3.5" fill="white" opacity="0.9"/>
      <circle cx="36" cy="44" r="1.5" fill="white" opacity="0.4"/>
      <circle cx="60" cy="44" r="1.5" fill="white" opacity="0.4"/>

      {/* ── Nose ── */}
      <ellipse cx="50" cy="55" rx="5" ry="3.5" fill="hsl(350 75% 50%)"/>
      <ellipse cx="49" cy="54" rx="2" ry="1.5" fill="hsl(350 75% 70%)" opacity="0.5"/>

      {/* ── Mouth ── */}
      <path d="M44 59 Q50 64 56 59" fill="none" stroke="hsl(220 18% 22%)" strokeWidth="1.5" strokeLinecap="round"/>

      {/* ── Whiskers ── */}
      <line x1="18" y1="50" x2="32" y2="52" stroke="hsl(220 18% 30%)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="18" y1="56" x2="32" y2="55" stroke="hsl(220 18% 30%)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="68" y1="52" x2="82" y2="50" stroke="hsl(220 18% 30%)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="68" y1="55" x2="82" y2="56" stroke="hsl(220 18% 30%)" strokeWidth="1.2" strokeLinecap="round"/>

      {/* ── Level accessories on head ── */}
      {levelId === 'easy' && (
        /* Leaf on head */
        <g transform="translate(58, 18) rotate(25)">
          <ellipse cx="0" cy="0" rx="5" ry="9" fill="hsl(130 60% 45%)" opacity="0.85"/>
          <line x1="0" y1="-8" x2="0" y2="6" stroke="hsl(130 35% 30%)" strokeWidth="1"/>
        </g>
      )}
      {levelId === 'medium' && (
        /* Headband */
        <>
          <path d="M20 35 Q50 25 80 35" fill="none" stroke={t.accessory} strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
          <circle cx="50" cy="29" r="3" fill={t.accessory2} opacity="0.7"/>
        </>
      )}
      {levelId === 'hard' && (
        /* Horn-like spikes on head */
        <>
          <path d="M30 22 L24 6 L36 20" fill="hsl(0 60% 30%)" stroke="hsl(0 50% 20%)" strokeWidth="1"/>
          <path d="M70 22 L76 6 L64 20" fill="hsl(0 60% 30%)" stroke="hsl(0 50% 20%)" strokeWidth="1"/>
          {/* Glowing red eye accents */}
          <circle cx="38" cy="42" r="11" fill="none" stroke="hsl(0 85% 50%)" strokeWidth="0.8" opacity="0.35"/>
          <circle cx="62" cy="42" r="11" fill="none" stroke="hsl(0 85% 50%)" strokeWidth="0.8" opacity="0.35"/>
        </>
      )}
      {levelId === 'party' && (
        /* Party hat / crown */
        <>
          <path d="M35 22 L50 2 L65 22" fill={t.shirt} stroke={t.accessory} strokeWidth="1.5" opacity="0.85"/>
          <circle cx="50" cy="4" r="3" fill={t.accessory} opacity="0.9"/>
          <circle cx="42" cy="16" r="1.5" fill={t.accessory2} opacity="0.7"/>
          <circle cx="58" cy="16" r="1.5" fill={t.accessory} opacity="0.7"/>
        </>
      )}

      {/* ── Body / Shirt ── */}
      <rect x="33" y="70" width="34" height="42" rx="10" fill={`url(#mouseShirt_${levelId}_${color})`} stroke="hsl(220 18% 22%)" strokeWidth="2"/>
      {/* Shirt detail - center stripe / emblem */}
      {levelId === 'easy' && (
        <circle cx="50" cy="86" r="6" fill={t.accessory} opacity="0.3"/>
      )}
      {levelId === 'medium' && (
        <>
          <line x1="50" y1="74" x2="50" y2="108" stroke={t.accessory} strokeWidth="2.5" opacity="0.3"/>
          <rect x="42" y="82" width="16" height="8" rx="2" fill="none" stroke={t.accessory} strokeWidth="1.2" opacity="0.35"/>
        </>
      )}
      {levelId === 'hard' && (
        /* Armor plates */
        <>
          <path d="M38 76 L50 72 L62 76 L62 95 L50 100 L38 95 Z" fill="none" stroke={t.accessory} strokeWidth="1.5" opacity="0.4"/>
          <line x1="50" y1="72" x2="50" y2="100" stroke={t.accessory} strokeWidth="1" opacity="0.25"/>
        </>
      )}
      {levelId === 'party' && (
        /* Sparkle pattern */
        <>
          <circle cx="43" cy="80" r="1.5" fill={t.accessory} opacity="0.5"/>
          <circle cx="57" cy="85" r="1.5" fill={t.accessory2} opacity="0.5"/>
          <circle cx="45" cy="95" r="1" fill={t.accessory2} opacity="0.4"/>
          <circle cx="55" cy="78" r="1" fill={t.accessory} opacity="0.4"/>
        </>
      )}

      {/* ── Arms ── */}
      <ellipse cx="27" cy="86" rx="8" ry="17" fill={`url(#mouseBody_${levelId}_${color})`}
        stroke="hsl(220 18% 22%)" strokeWidth="2"
        style={{ transformOrigin: '27px 75px', animation: isRunning ? 'armSwing 0.3s ease-in-out infinite alternate' : undefined }} />
      <ellipse cx="73" cy="86" rx="8" ry="17" fill={`url(#mouseBody_${levelId}_${color})`}
        stroke="hsl(220 18% 22%)" strokeWidth="2"
        style={{ transformOrigin: '73px 75px', animation: isRunning ? 'armSwing 0.3s ease-in-out infinite alternate-reverse' : undefined }} />
      {/* Arm shine */}
      <ellipse cx="25" cy="82" rx="3" ry="6" fill="white" opacity="0.08"/>
      <ellipse cx="75" cy="82" rx="3" ry="6" fill="white" opacity="0.08"/>

      {/* ── Legs ── */}
      <ellipse cx="40" cy="127" rx="9" ry="15" fill={`url(#mouseBody_${levelId}_${color})`}
        stroke="hsl(220 18% 22%)" strokeWidth="2"
        style={{ transformOrigin: '40px 115px', animation: isRunning ? 'legRun 0.2s ease-in-out infinite alternate' : undefined }} />
      <ellipse cx="60" cy="127" rx="9" ry="15" fill={`url(#mouseBody_${levelId}_${color})`}
        stroke="hsl(220 18% 22%)" strokeWidth="2"
        style={{ transformOrigin: '60px 115px', animation: isRunning ? 'legRun 0.2s ease-in-out infinite alternate-reverse' : undefined }} />
      {/* Shoes / feet accent */}
      <ellipse cx="40" cy="138" rx="9" ry="5" fill={t.shirt} opacity="0.5"/>
      <ellipse cx="60" cy="138" rx="9" ry="5" fill={t.shirt} opacity="0.5"/>

      {/* ── Hit effect ── */}
      {isHit && (
        <circle cx="50" cy="70" r="45" fill="none" stroke="hsl(0 85% 55%)" strokeWidth="3" opacity="0.6">
          <animate attributeName="r" from="30" to="60" dur="0.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.8" to="0" dur="0.5s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  );
}
