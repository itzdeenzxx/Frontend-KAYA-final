interface LevelIconProps {
  levelId: string;
  className?: string;
}

export function LevelIcon({ levelId, className = 'w-10 h-10' }: LevelIconProps) {
  switch (levelId) {
    case 'easy':
      // Sun with rays
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <circle cx="24" cy="24" r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="24" cy="24" r="7" fill="#fde68a" opacity="0.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="24"
              y1="24"
              x2={24 + 18 * Math.cos((angle * Math.PI) / 180)}
              y2={24 + 18 * Math.sin((angle * Math.PI) / 180)}
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
        </svg>
      );

    case 'medium':
      // City buildings
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="18" width="10" height="26" rx="1" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
          <rect x="19" y="8" width="10" height="36" rx="1" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
          <rect x="34" y="14" width="10" height="30" rx="1" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
          {/* Windows */}
          <rect x="7" y="22" width="3" height="3" rx="0.5" fill="#fef3c7" />
          <rect x="7" y="28" width="3" height="3" rx="0.5" fill="#fef3c7" />
          <rect x="22" y="12" width="3" height="3" rx="0.5" fill="#fef3c7" />
          <rect x="22" y="18" width="3" height="3" rx="0.5" fill="#fef3c7" />
          <rect x="22" y="24" width="3" height="3" rx="0.5" fill="#fef3c7" />
          <rect x="37" y="18" width="3" height="3" rx="0.5" fill="#fef3c7" />
          <rect x="37" y="24" width="3" height="3" rx="0.5" fill="#fef3c7" />
        </svg>
      );

    case 'hard':
      // Skull
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <path d="M24 6C14 6 8 14 8 22c0 5 2 8 5 10v6a2 2 0 002 2h18a2 2 0 002-2v-6c3-2 5-5 5-10 0-8-6-16-16-16z"
            fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
          <circle cx="18" cy="20" r="4" fill="#1e1e1e" />
          <circle cx="30" cy="20" r="4" fill="#1e1e1e" />
          <circle cx="18" cy="19" r="1.5" fill="#ef4444" opacity="0.6" />
          <circle cx="30" cy="19" r="1.5" fill="#ef4444" opacity="0.6" />
          <path d="M18 32v6M24 32v6M30 32v6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'party':
      // Disco ball
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <circle cx="24" cy="26" r="14" fill="#a855f7" stroke="#9333ea" strokeWidth="2" />
          <circle cx="24" cy="26" r="14" fill="url(#discoGrad)" opacity="0.5" />
          {/* Mirror facets */}
          <rect x="18" y="18" width="4" height="4" rx="0.5" fill="rgba(255,255,255,0.5)" transform="rotate(10 20 20)" />
          <rect x="26" y="20" width="4" height="4" rx="0.5" fill="rgba(255,255,255,0.4)" transform="rotate(-5 28 22)" />
          <rect x="20" y="28" width="4" height="4" rx="0.5" fill="rgba(255,255,255,0.35)" transform="rotate(15 22 30)" />
          <rect x="28" y="30" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.45)" />
          <rect x="16" y="24" width="3" height="3" rx="0.5" fill="rgba(255,255,255,0.3)" />
          {/* String */}
          <line x1="24" y1="12" x2="24" y2="6" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="5" r="2" fill="#9333ea" />
          {/* Light rays */}
          <line x1="10" y1="16" x2="6" y2="12" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="38" y1="16" x2="42" y2="12" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="10" y1="36" x2="6" y2="40" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="38" y1="36" x2="42" y2="40" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <defs>
            <radialGradient id="discoGrad" cx="0.35" cy="0.35" r="0.65">
              <stop offset="0%" stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
        </svg>
      );

    default:
      return <div className={className} />;
  }
}
