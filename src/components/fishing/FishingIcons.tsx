import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

// ──────────────────────────── Nature / Scenery ────────────────────────────

export const CloudIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 40" fill="none" className={className} style={style}>
    <ellipse cx="32" cy="26" rx="20" ry="12" fill="white" opacity="0.9" />
    <ellipse cx="20" cy="22" rx="14" ry="10" fill="white" opacity="0.95" />
    <ellipse cx="42" cy="20" rx="16" ry="11" fill="white" opacity="0.92" />
    <ellipse cx="30" cy="18" rx="12" ry="9" fill="white" />
  </svg>
);

export const SunIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <circle cx="32" cy="32" r="14" fill="#FBBF24" />
    <circle cx="32" cy="32" r="12" fill="#FCD34D" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
      <line key={i} x1="32" y1="32" x2={32 + 22 * Math.cos((deg * Math.PI) / 180)} y2={32 + 22 * Math.sin((deg * Math.PI) / 180)}
        stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
    ))}
  </svg>
);

export const TreeIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 64" fill="none" className={className} style={style}>
    <rect x="20" y="42" width="8" height="18" rx="2" fill="#92400E" />
    <polygon points="24,4 6,30 42,30" fill="#166534" />
    <polygon points="24,14 10,38 38,38" fill="#15803D" />
    <polygon points="24,24 12,46 36,46" fill="#16A34A" />
  </svg>
);

export const PalmTreeIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 56 64" fill="none" className={className} style={style}>
    <path d="M26 30 C26 45, 28 58, 28 62" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
    <path d="M27 28 C10 20, 2 28, 4 32" stroke="#16A34A" strokeWidth="3" fill="none" />
    <path d="M27 28 C44 18, 52 26, 50 30" stroke="#16A34A" strokeWidth="3" fill="none" />
    <path d="M27 26 C18 12, 6 16, 8 22" stroke="#15803D" strokeWidth="3" fill="none" />
    <path d="M27 26 C38 14, 50 18, 48 24" stroke="#15803D" strokeWidth="3" fill="none" />
    <path d="M27 24 C24 10, 28 4, 30 10" stroke="#22C55E" strokeWidth="2.5" fill="none" />
  </svg>
);

export const WaveIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 32" fill="none" className={className} style={style}>
    <path d="M0 20 Q8 10, 16 20 Q24 30, 32 20 Q40 10, 48 20 Q56 30, 64 20" stroke="#38BDF8" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M0 26 Q8 18, 16 26 Q24 34, 32 26 Q40 18, 48 26 Q56 34, 64 26" stroke="#0EA5E9" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />
  </svg>
);

export const RockIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 40" fill="none" className={className} style={style}>
    <path d="M4 36 L12 12 L22 6 L34 10 L44 18 L46 36 Z" fill="#6B7280" />
    <path d="M4 36 L12 12 L22 6 L24 20 L10 36 Z" fill="#9CA3AF" />
    <path d="M22 6 L34 10 L36 24 L24 20 Z" fill="#4B5563" />
  </svg>
);

export const CoralIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <path d="M24 44 L24 24 L18 12 L14 8" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 30 L30 18 L34 10" stroke="#FB923C" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 34 L18 26 L12 22" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
    <circle cx="14" cy="8" r="3" fill="#F472B6" />
    <circle cx="34" cy="10" r="3" fill="#FB923C" />
    <circle cx="12" cy="22" r="3" fill="#A78BFA" />
  </svg>
);

export const WoodLogIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 20" fill="none" className={className} style={style}>
    <rect x="2" y="4" width="44" height="12" rx="6" fill="#92400E" />
    <ellipse cx="46" cy="10" rx="6" ry="6" fill="#B45309" />
    <ellipse cx="46" cy="10" rx="4" ry="4" fill="#D97706" />
    <circle cx="46" cy="10" r="1.5" fill="#92400E" />
  </svg>
);

export const BeachIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 56 40" fill="none" className={className} style={style}>
    <path d="M0 24 Q14 16, 28 20 Q42 24, 56 18 L56 40 L0 40 Z" fill="#FDE68A" />
    <path d="M0 28 Q14 22, 28 26 Q42 30, 56 24 L56 40 L0 40 Z" fill="#FCD34D" />
    <circle cx="12" cy="30" r="2" fill="#D97706" opacity="0.4" />
    <circle cx="38" cy="28" r="1.5" fill="#D97706" opacity="0.3" />
  </svg>
);

export const ShellIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} style={style}>
    <path d="M16 4 C6 4, 2 14, 4 22 C6 28, 14 30, 20 28 C26 26, 30 18, 28 10 C26 4, 20 2, 16 4Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
    <path d="M16 6 Q12 16, 16 26" stroke="#D97706" strokeWidth="1" fill="none" />
    <path d="M16 6 Q20 14, 22 24" stroke="#D97706" strokeWidth="0.8" fill="none" opacity="0.6" />
    <path d="M16 6 Q10 12, 8 22" stroke="#D97706" strokeWidth="0.8" fill="none" opacity="0.6" />
  </svg>
);

// ──────────────────────────── Sea Creatures ────────────────────────────

export const FishIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 40" fill="none" className={className} style={style}>
    <path d="M48 20 C48 10, 36 4, 24 6 C12 8, 4 14, 4 20 C4 26, 12 32, 24 34 C36 36, 48 30, 48 20Z" fill="#38BDF8" />
    <path d="M48 20 L60 8 L60 32 Z" fill="#0EA5E9" />
    <circle cx="16" cy="18" r="3" fill="white" />
    <circle cx="17" cy="17.5" r="1.5" fill="#1E293B" />
    <path d="M24 4 C28 8, 30 12, 28 16" stroke="#0284C7" strokeWidth="1" fill="none" opacity="0.4" />
  </svg>
);

export const TropicalFishIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 44" fill="none" className={className} style={style}>
    <path d="M46 22 C46 12, 36 4, 24 6 C12 8, 4 14, 4 22 C4 30, 12 36, 24 38 C36 40, 46 32, 46 22Z" fill="#FBBF24" />
    <path d="M46 22 L58 10 L58 34 Z" fill="#F59E0B" />
    <path d="M20 6 L22 0 L26 8" fill="#F97316" />
    <path d="M18 10 C22 12, 30 12, 34 10" stroke="#F97316" strokeWidth="2.5" fill="none" />
    <path d="M16 18 C24 20, 32 20, 38 18" stroke="#F97316" strokeWidth="2" fill="none" />
    <circle cx="14" cy="18" r="3.5" fill="white" />
    <circle cx="15" cy="17.5" r="2" fill="#1E293B" />
  </svg>
);

export const SharkIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 72 40" fill="none" className={className} style={style}>
    <path d="M56 20 C56 12, 44 4, 28 6 C14 8, 4 14, 4 20 C4 26, 14 32, 28 34 C44 36, 56 28, 56 20Z" fill="#6B7280" />
    <path d="M56 20 L68 12 L68 28 Z" fill="#4B5563" />
    <path d="M30 6 L34 0 L38 10" fill="#4B5563" />
    <path d="M4 20 L0 16 L2 20 L0 24 Z" fill="#6B7280" />
    <circle cx="18" cy="17" r="3" fill="white" />
    <circle cx="19" cy="16.5" r="1.5" fill="#0F172A" />
    <path d="M10 24 L14 26 L12 24 L16 25 L14 23" stroke="white" strokeWidth="0.8" />
  </svg>
);

export const PufferfishIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 52 52" fill="none" className={className} style={style}>
    <circle cx="26" cy="26" r="18" fill="#FDE68A" />
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
      <line key={i} x1={26 + 18 * Math.cos((deg * Math.PI) / 180)} y1={26 + 18 * Math.sin((deg * Math.PI) / 180)}
        x2={26 + 24 * Math.cos((deg * Math.PI) / 180)} y2={26 + 24 * Math.sin((deg * Math.PI) / 180)}
        stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    ))}
    <circle cx="20" cy="22" r="4" fill="white" />
    <circle cx="32" cy="22" r="4" fill="white" />
    <circle cx="21" cy="21" r="2" fill="#1E293B" />
    <circle cx="33" cy="21" r="2" fill="#1E293B" />
    <ellipse cx="26" cy="30" rx="3" ry="2" fill="#D97706" />
  </svg>
);

export const OctopusIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 56 56" fill="none" className={className} style={style}>
    <ellipse cx="28" cy="22" rx="16" ry="14" fill="#A855F7" />
    <path d="M14 30 Q10 42, 6 48" stroke="#9333EA" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 34 Q16 44, 14 50" stroke="#9333EA" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 36 Q24 46, 22 52" stroke="#9333EA" strokeWidth="3" strokeLinecap="round" />
    <path d="M32 36 Q32 46, 34 52" stroke="#9333EA" strokeWidth="3" strokeLinecap="round" />
    <path d="M38 34 Q40 44, 42 50" stroke="#9333EA" strokeWidth="3" strokeLinecap="round" />
    <path d="M42 30 Q46 42, 50 48" stroke="#9333EA" strokeWidth="3" strokeLinecap="round" />
    <circle cx="22" cy="20" r="3.5" fill="white" />
    <circle cx="34" cy="20" r="3.5" fill="white" />
    <circle cx="23" cy="19.5" r="2" fill="#1E293B" />
    <circle cx="35" cy="19.5" r="2" fill="#1E293B" />
  </svg>
);

export const CrabIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 60 44" fill="none" className={className} style={style}>
    <ellipse cx="30" cy="28" rx="16" ry="12" fill="#EF4444" />
    <path d="M14 24 L6 16 L4 12" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
    <path d="M46 24 L54 16 L56 12" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
    <circle cx="4" cy="10" r="4" fill="#DC2626" />
    <circle cx="56" cy="10" r="4" fill="#DC2626" />
    <circle cx="24" cy="24" r="2.5" fill="#0F172A" />
    <circle cx="36" cy="24" r="2.5" fill="#0F172A" />
    <path d="M16 36 L12 42" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 38 L20 44" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <path d="M38 38 L40 44" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <path d="M44 36 L48 42" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const WhaleIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 80 44" fill="none" className={className} style={style}>
    <path d="M64 22 C64 10, 50 2, 32 4 C14 6, 4 14, 4 22 C4 30, 14 38, 32 40 C50 42, 64 34, 64 22Z" fill="#3B82F6" />
    <path d="M64 22 L76 10 L72 22 L76 34 Z" fill="#2563EB" />
    <path d="M14 8 Q16 2, 18 4" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 6 Q20 0, 22 2" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    <circle cx="18" cy="18" r="3.5" fill="white" />
    <circle cx="19" cy="17.5" r="2" fill="#1E293B" />
    <path d="M10 26 C14 28, 22 30, 30 28" fill="#2563EB" opacity="0.4" />
  </svg>
);

export const SquidIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 44 64" fill="none" className={className} style={style}>
    <ellipse cx="22" cy="18" rx="14" ry="16" fill="#FB923C" />
    <path d="M10 30 Q8 44, 6 56" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 32 Q14 46, 12 58" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 34 Q18 48, 16 60" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 34 Q26 48, 28 60" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 32 Q30 46, 32 58" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
    <path d="M34 30 Q36 44, 38 56" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="16" r="3" fill="white" />
    <circle cx="28" cy="16" r="3" fill="white" />
    <circle cx="17" cy="15.5" r="1.5" fill="#1E293B" />
    <circle cx="29" cy="15.5" r="1.5" fill="#1E293B" />
  </svg>
);

export const LobsterIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <ellipse cx="32" cy="24" rx="14" ry="10" fill="#DC2626" />
    <ellipse cx="32" cy="24" rx="10" ry="7" fill="#EF4444" />
    <path d="M18 20 L8 12 L4 6" stroke="#B91C1C" strokeWidth="3" strokeLinecap="round" />
    <path d="M46 20 L56 12 L60 6" stroke="#B91C1C" strokeWidth="3" strokeLinecap="round" />
    <circle cx="4" cy="4" r="3" fill="#B91C1C" />
    <circle cx="60" cy="4" r="3" fill="#B91C1C" />
    <path d="M20 30 L16 40 L12 46" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <path d="M28 32 L26 42 L24 48" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <path d="M36 32 L38 42 L40 48" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <path d="M44 30 L48 40 L52 46" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <circle cx="26" cy="20" r="2" fill="#1E293B" />
    <circle cx="38" cy="20" r="2" fill="#1E293B" />
  </svg>
);

export const SwordfishIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 80 36" fill="none" className={className} style={style}>
    <path d="M56 18 C56 10, 44 4, 30 6 C18 8, 12 14, 12 18 C12 22, 18 28, 30 30 C44 32, 56 26, 56 18Z" fill="#6366F1" />
    <path d="M12 18 L0 16 L0 20 Z" fill="#818CF8" />
    <path d="M56 18 L68 10 L68 26 Z" fill="#4F46E5" />
    <path d="M36 6 L40 0 L42 8" fill="#4F46E5" />
    <circle cx="20" cy="16" r="3" fill="white" />
    <circle cx="21" cy="15.5" r="1.5" fill="#1E293B" />
  </svg>
);

export const CrocodileIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 80 32" fill="none" className={className} style={style}>
    <path d="M8 16 C8 8, 20 4, 36 4 L64 8 L72 14 L72 18 L64 24 L36 28 C20 28, 8 24, 8 16Z" fill="#16A34A" />
    <path d="M72 14 L80 12 L80 20 L72 18Z" fill="#15803D" />
    <path d="M72 14 L72 18 L68 16Z" fill="#14532D" />
    <circle cx="56" cy="10" r="3" fill="#FBBF24" />
    <circle cx="56" cy="10" r="1.5" fill="#0F172A" />
    <path d="M66 16 L68 14 L70 16 L68 18 Z" fill="#0F172A" opacity="0.5" />
  </svg>
);

export const SnakeIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 40" fill="none" className={className} style={style}>
    <path d="M8 20 Q16 8, 28 16 Q40 28, 52 16 L58 14" stroke="#16A34A" strokeWidth="6" strokeLinecap="round" fill="none" />
    <circle cx="60" cy="12" r="6" fill="#15803D" />
    <circle cx="58" cy="10" r="2" fill="#FBBF24" />
    <circle cx="58" cy="10" r="1" fill="#0F172A" />
    <path d="M64 14 L68 12 L64 16" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const TurtleIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 56 44" fill="none" className={className} style={style}>
    <ellipse cx="28" cy="24" rx="18" ry="14" fill="#16A34A" />
    <path d="M28 10 C20 10, 14 16, 14 24 C14 32, 20 38, 28 38 C36 38, 42 32, 42 24 C42 16, 36 10, 28 10Z" fill="#15803D" />
    <path d="M20 16 L28 12 L36 16 L36 28 L28 32 L20 28 Z" stroke="#22C55E" strokeWidth="1" fill="none" />
    <circle cx="10" cy="18" r="4" fill="#16A34A" />
    <circle cx="8" cy="16" r="1.5" fill="#0F172A" />
    <path d="M12 32 L6 38" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
    <path d="M44 32 L50 38" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
    <path d="M12 18 L6 14" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
    <path d="M44 18 L50 14" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const FrogIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 52 44" fill="none" className={className} style={style}>
    <ellipse cx="26" cy="28" rx="18" ry="12" fill="#22C55E" />
    <circle cx="16" cy="16" r="8" fill="#22C55E" />
    <circle cx="36" cy="16" r="8" fill="#22C55E" />
    <circle cx="16" cy="14" r="4" fill="white" />
    <circle cx="36" cy="14" r="4" fill="white" />
    <circle cx="17" cy="13.5" r="2" fill="#0F172A" />
    <circle cx="37" cy="13.5" r="2" fill="#0F172A" />
    <path d="M20 32 Q26 36, 32 32" stroke="#15803D" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M10 34 L4 40" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
    <path d="M42 34 L48 40" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const LizardIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 36" fill="none" className={className} style={style}>
    <path d="M12 18 C12 10, 24 6, 36 8 L52 12 L56 16 L56 20 L52 24 L36 28 C24 30, 12 26, 12 18Z" fill="#84CC16" />
    <circle cx="48" cy="14" r="3" fill="#FBBF24" />
    <circle cx="48" cy="14" r="1.5" fill="#0F172A" />
    <path d="M16 12 L8 6" stroke="#84CC16" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M16 24 L8 30" stroke="#84CC16" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M38 10 L34 4" stroke="#84CC16" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M38 26 L34 32" stroke="#84CC16" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M8 18 L2 16 L0 18 L2 20 Z" fill="#84CC16" />
  </svg>
);

// ──────────────────────────── Equipment / Items ────────────────────────────

export const FishingRodIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 56 56" fill="none" className={className} style={style}>
    <path d="M8 48 L38 8" stroke="#92400E" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M38 8 L40 6" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
    <circle cx="40" cy="6" r="2" fill="#D97706" />
    <path d="M40 6 Q48 12, 50 24 Q52 32, 48 38" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" fill="none" />
    <path d="M48 38 L50 40 L46 40 Z" fill="#94A3B8" />
    <circle cx="8" cy="48" r="3" fill="#78350F" />
    <path d="M22 28 C24 26, 26 26, 28 28" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
  </svg>
);

export const BaitIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} style={style}>
    <path d="M20 6 Q26 12, 24 20 Q22 28, 16 32 Q12 34, 10 30 Q8 26, 14 22 Q18 18, 20 14" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" fill="none" />
    <circle cx="20" cy="6" r="3" fill="#EF4444" />
    <circle cx="10" cy="30" r="2.5" fill="#EF4444" />
    <path d="M16 14 C18 12, 20 12, 22 14" stroke="#B91C1C" strokeWidth="1" fill="none" />
  </svg>
);

export const BoatIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <path d="M8 28 L16 40 L48 40 L56 28 Z" fill="#1E40AF" />
    <path d="M8 28 L16 40 L32 40 L24 28 Z" fill="#2563EB" />
    <rect x="28" y="14" width="3" height="16" fill="#92400E" />
    <path d="M31 14 L52 22 L31 28 Z" fill="white" />
    <path d="M31 14 L31 28 L22 22 Z" fill="#E5E7EB" opacity="0.6" />
    <path d="M0 34 Q8 30, 16 34 Q24 38, 32 34 Q40 30, 48 34 Q56 38, 64 34" stroke="#38BDF8" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
);

export const ShipIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 72 56" fill="none" className={className} style={style}>
    <path d="M12 32 L18 48 L54 48 L60 32 Z" fill="#1E3A5F" />
    <path d="M12 32 L18 48 L36 48 L28 32 Z" fill="#2563EB" />
    <rect x="30" y="8" width="4" height="26" fill="#92400E" />
    <path d="M34 8 L58 20 L34 30 Z" fill="white" />
    <rect x="20" y="24" width="32" height="8" rx="1" fill="#1E293B" />
    <rect x="24" y="26" width="4" height="4" rx="1" fill="#FBBF24" opacity="0.8" />
    <rect x="32" y="26" width="4" height="4" rx="1" fill="#FBBF24" opacity="0.8" />
    <rect x="40" y="26" width="4" height="4" rx="1" fill="#FBBF24" opacity="0.8" />
  </svg>
);

export const CoinIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} style={style}>
    <circle cx="20" cy="20" r="16" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
    <circle cx="20" cy="20" r="12" fill="#FCD34D" />
    <text x="20" y="25" textAnchor="middle" fill="#92400E" fontWeight="bold" fontSize="16">$</text>
  </svg>
);

// ──────────────────────────── UI / Status ────────────────────────────

export const StarFilledIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 2 L14.9 8.6 L22 9.3 L16.8 14 L18.2 21 L12 17.5 L5.8 21 L7.2 14 L2 9.3 L9.1 8.6 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
  </svg>
);

export const NewBadgeIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 24" fill="none" className={className} style={style}>
    <rect x="2" y="2" width="36" height="20" rx="4" fill="#2563EB" />
    <text x="20" y="16" textAnchor="middle" fill="white" fontWeight="bold" fontSize="11">NEW</text>
  </svg>
);

export const WarningIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 2 L22 20 L2 20 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
    <line x1="12" y1="9" x2="12" y2="14" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="17" r="1" fill="#92400E" />
  </svg>
);

export const ChartIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="12" width="4" height="8" rx="1" fill="#3B82F6" />
    <rect x="10" y="6" width="4" height="14" rx="1" fill="#2563EB" />
    <rect x="17" y="3" width="4" height="17" rx="1" fill="#1D4ED8" />
  </svg>
);

export const CameraIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="2" y="6" width="20" height="14" rx="3" fill="#374151" />
    <path d="M8 6 L10 3 L14 3 L16 6" stroke="#374151" strokeWidth="2" />
    <circle cx="12" cy="13" r="4" fill="#60A5FA" />
    <circle cx="12" cy="13" r="2" fill="#93C5FD" />
  </svg>
);

export const GearIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="4" fill="none" stroke="#6B7280" strokeWidth="2" />
    <path d="M12 2 L13 5 L11 5 Z M12 22 L13 19 L11 19 Z M2 12 L5 13 L5 11 Z M22 12 L19 13 L19 11 Z M4.9 4.9 L7 6.5 L6.5 7 Z M19.1 19.1 L17 17.5 L17.5 17 Z M19.1 4.9 L17.5 7 L17 6.5 Z M4.9 19.1 L6.5 17 L7 17.5 Z"
      fill="#6B7280" />
  </svg>
);

export const ToolsIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M14 4 L18 8 L8 18 L4 20 L6 16 Z" fill="#6B7280" stroke="#4B5563" strokeWidth="1" />
    <path d="M14 4 L16 2 L22 8 L18 8 Z" fill="#9CA3AF" />
  </svg>
);

export const PackageIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <path d="M6 16 L24 6 L42 16 L42 36 L24 46 L6 36 Z" fill="#D97706" stroke="#92400E" strokeWidth="2" />
    <path d="M6 16 L24 26 L42 16" stroke="#92400E" strokeWidth="2" fill="none" />
    <path d="M24 26 L24 46" stroke="#92400E" strokeWidth="2" />
    <path d="M15 11 L33 21" stroke="#FCD34D" strokeWidth="1.5" opacity="0.6" />
  </svg>
);

export const GiftIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} style={style}>
    <rect x="4" y="16" width="32" height="20" rx="2" fill="#EF4444" />
    <rect x="4" y="12" width="32" height="8" rx="2" fill="#DC2626" />
    <rect x="18" y="12" width="4" height="24" fill="#FBBF24" />
    <path d="M20 12 Q14 4, 8 8" stroke="#FBBF24" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M20 12 Q26 4, 32 8" stroke="#FBBF24" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

export const LightningIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 32" fill="none" className={className} style={style}>
    <path d="M14 2 L6 16 L12 16 L10 30 L20 14 L14 14 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
  </svg>
);

export const TrophyIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} style={style}>
    <path d="M12 8 L28 8 L26 22 C26 26, 22 28, 20 28 C18 28, 14 26, 14 22 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
    <path d="M12 8 C8 8, 4 12, 6 16 C8 20, 12 18, 14 16" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />
    <path d="M28 8 C32 8, 36 12, 34 16 C32 20, 28 18, 26 16" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />
    <rect x="16" y="28" width="8" height="4" fill="#D97706" />
    <rect x="12" y="32" width="16" height="4" rx="1" fill="#92400E" />
  </svg>
);

export const SparkleIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path d="M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8 Z" fill="#FBBF24" />
    <path d="M19 2 L20 5 L23 5 L20.5 7 L21.5 10 L19 8 L16.5 10 L17.5 7 L15 5 L18 5 Z" fill="#FCD34D" />
  </svg>
);

export const DiamondIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} style={style}>
    <path d="M16 4 L28 14 L16 28 L4 14 Z" fill="#60A5FA" stroke="#3B82F6" strokeWidth="1.5" />
    <path d="M4 14 L16 4 L28 14" fill="#93C5FD" />
    <path d="M8 14 L16 8 L24 14 L16 26 Z" fill="#3B82F6" opacity="0.3" />
  </svg>
);

export const DragonIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <path d="M48 24 C48 14, 38 6, 26 8 C14 10, 6 16, 6 24 C6 32, 14 38, 26 40 C38 42, 48 34, 48 24Z" fill="#DC2626" />
    <path d="M48 24 L58 16 L58 32 Z" fill="#B91C1C" />
    <path d="M30 6 L28 0 L34 4" fill="#DC2626" />
    <path d="M22 6 L18 0 L24 2" fill="#DC2626" />
    <path d="M16 8 L10 2 L14 0" stroke="#FBBF24" strokeWidth="1" fill="none" />
    <circle cx="18" cy="20" r="4" fill="#FBBF24" />
    <circle cx="19" cy="19.5" r="2" fill="#0F172A" />
    <path d="M10 28 L6 32 L12 30" fill="#DC2626" />
  </svg>
);

export const ButterflyIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 40" fill="none" className={className} style={style}>
    <ellipse cx="14" cy="14" rx="12" ry="10" fill="#A855F7" opacity="0.8" />
    <ellipse cx="34" cy="14" rx="12" ry="10" fill="#A855F7" opacity="0.8" />
    <ellipse cx="14" cy="28" rx="10" ry="8" fill="#C084FC" opacity="0.7" />
    <ellipse cx="34" cy="28" rx="10" ry="8" fill="#C084FC" opacity="0.7" />
    <rect x="22" y="6" width="4" height="28" rx="2" fill="#6B21A8" />
    <path d="M22 8 L18 2" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M26 8 L30 2" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="18" cy="2" r="1.5" fill="#6B21A8" />
    <circle cx="30" cy="2" r="1.5" fill="#6B21A8" />
  </svg>
);

export const GhostFishIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 52 52" fill="none" className={className} style={style}>
    <path d="M26 6 C14 6, 6 16, 6 28 L6 42 L12 36 L18 42 L24 36 L30 42 L36 36 L42 42 L46 42 L46 28 C46 16, 38 6, 26 6Z" fill="white" opacity="0.85" />
    <circle cx="18" cy="22" r="4" fill="#1E293B" />
    <circle cx="34" cy="22" r="4" fill="#1E293B" />
    <ellipse cx="26" cy="32" rx="4" ry="3" fill="#1E293B" opacity="0.5" />
  </svg>
);

export const SnowflakeIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} style={style}>
    <line x1="16" y1="2" x2="16" y2="30" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
    <line x1="4" y1="9" x2="28" y2="23" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
    <line x1="4" y1="23" x2="28" y2="9" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="16" r="3" fill="#BFDBFE" />
    {[0, 60, 120, 180, 240, 300].map((deg, i) => (
      <line key={i} x1={16 + 10 * Math.cos((deg * Math.PI) / 180)} y1={16 + 10 * Math.sin((deg * Math.PI) / 180)}
        x2={16 + 14 * Math.cos(((deg + 20) * Math.PI) / 180)} y2={16 + 14 * Math.sin(((deg + 20) * Math.PI) / 180)}
        stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
    ))}
  </svg>
);

export const WaterDropIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 32" fill="none" className={className} style={style}>
    <path d="M12 2 Q4 16, 4 22 C4 28, 8 30, 12 30 C16 30, 20 28, 20 22 Q20 16, 12 2Z" fill="#38BDF8" stroke="#0EA5E9" strokeWidth="1" />
    <path d="M10 22 Q8 18, 12 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
  </svg>
);

export const LeafIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 28 32" fill="none" className={className} style={style}>
    <path d="M14 4 C4 8, 2 20, 8 26 C14 32, 24 28, 26 18 C28 8, 20 2, 14 4Z" fill="#22C55E" stroke="#16A34A" strokeWidth="1" />
    <path d="M14 4 Q16 16, 10 26" stroke="#16A34A" strokeWidth="1.5" fill="none" />
    <path d="M10 12 L16 14" stroke="#16A34A" strokeWidth="1" fill="none" opacity="0.5" />
    <path d="M8 18 L14 20" stroke="#16A34A" strokeWidth="1" fill="none" opacity="0.5" />
  </svg>
);

export const MountainIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 32" fill="none" className={className} style={style}>
    <path d="M0 32 L16 4 L24 16 L32 6 L48 32 Z" fill="#6B7280" />
    <path d="M16 4 L20 12 L12 12 Z" fill="white" />
    <path d="M32 6 L36 14 L28 14 Z" fill="white" />
    <path d="M0 32 L16 4 L24 16 L18 32 Z" fill="#9CA3AF" />
  </svg>
);

export const RiverIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 32" fill="none" className={className} style={style}>
    <path d="M0 8 Q12 4, 24 12 Q36 20, 48 16" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M0 18 Q12 14, 24 22 Q36 30, 48 26" stroke="#0EA5E9" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M4 4 L4 2" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M42 10 L42 8" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const SeagullIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 24" fill="none" className={className} style={style}>
    <path d="M2 16 Q10 4, 20 12 Q30 4, 38 16" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <circle cx="20" cy="14" r="3" fill="#374151" />
    <path d="M18 16 L16 18" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const FishermanIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 64" fill="none" className={className} style={style}>
    <circle cx="24" cy="12" r="8" fill="#FBBF24" />
    <path d="M16 12 Q24 4, 32 12" fill="#1E40AF" />
    <rect x="18" y="20" width="12" height="20" rx="3" fill="#2563EB" />
    <rect x="16" y="40" width="6" height="18" rx="2" fill="#1E40AF" />
    <rect x="26" y="40" width="6" height="18" rx="2" fill="#1E40AF" />
    <circle cx="20" cy="14" r="1.5" fill="#0F172A" />
    <circle cx="28" cy="14" r="1.5" fill="#0F172A" />
    <path d="M22 18 Q24 20, 26 18" stroke="#0F172A" strokeWidth="1" fill="none" />
    <path d="M32 24 L44 10" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const DockIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 56 40" fill="none" className={className} style={style}>
    <rect x="8" y="12" width="40" height="6" rx="1" fill="#92400E" />
    <rect x="12" y="18" width="4" height="20" fill="#78350F" />
    <rect x="28" y="18" width="4" height="20" fill="#78350F" />
    <rect x="40" y="18" width="4" height="20" fill="#78350F" />
    <rect x="4" y="10" width="48" height="4" rx="1" fill="#B45309" />
    <path d="M14 8 L14 4 L18 10" stroke="#6B7280" strokeWidth="1.5" fill="none" />
  </svg>
);

export const BoneIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 20" fill="none" className={className} style={style}>
    <rect x="10" y="7" width="20" height="6" rx="3" fill="#E5E7EB" />
    <circle cx="8" cy="6" r="4" fill="#E5E7EB" />
    <circle cx="8" cy="14" r="4" fill="#E5E7EB" />
    <circle cx="32" cy="6" r="4" fill="#E5E7EB" />
    <circle cx="32" cy="14" r="4" fill="#E5E7EB" />
  </svg>
);

export const LungsIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} style={style}>
    <path d="M20 8 L20 32" stroke="#EF4444" strokeWidth="2" />
    <path d="M20 12 Q10 16, 8 24 C6 30, 10 34, 14 32 Q18 30, 20 26" fill="#FCA5A5" stroke="#EF4444" strokeWidth="1.5" />
    <path d="M20 12 Q30 16, 32 24 C34 30, 30 34, 26 32 Q22 30, 20 26" fill="#FCA5A5" stroke="#EF4444" strokeWidth="1.5" />
  </svg>
);

// ──────────────────────────── Biome SVG Icons ────────────────────────────

export const BiomeIcons: Record<string, (props: IconProps) => JSX.Element> = {
  ocean: WaveIcon,
  river: RiverIcon,
  lake: MountainIcon,
  ice: SnowflakeIcon,
  pond: WaterDropIcon,
  swamp: LeafIcon,
};

// ──────────────────────────── Fish SVG Mapping ────────────────────────────
// Maps fish emoji identifiers to SVG components for rendering

export const FishSvgMap: Record<string, (props: IconProps) => JSX.Element> = {
  fish: FishIcon,
  tropical: TropicalFishIcon,
  shark: SharkIcon,
  pufferfish: PufferfishIcon,
  octopus: OctopusIcon,
  crab: CrabIcon,
  whale: WhaleIcon,
  squid: SquidIcon,
  lobster: LobsterIcon,
  swordfish: SwordfishIcon,
  crocodile: CrocodileIcon,
  snake: SnakeIcon,
  turtle: TurtleIcon,
  frog: FrogIcon,
  lizard: LizardIcon,
  trophy: TrophyIcon,
  sparkle: SparkleIcon,
  diamond: DiamondIcon,
  dragon: DragonIcon,
  butterfly: ButterflyIcon,
  ghost: GhostFishIcon,
  snowflake: SnowflakeIcon,
  bone: BoneIcon,
  lungs: LungsIcon,
  circle: FishIcon, // fallback
};

export const CrownIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 32" fill="none" className={className} style={style}>
    <path d="M4 28 L8 10 L14 18 L20 4 L26 18 L32 10 L36 28 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
    <rect x="4" y="26" width="32" height="4" rx="1" fill="#D97706" />
    <circle cx="14" cy="18" r="2" fill="#EF4444" />
    <circle cx="20" cy="10" r="2" fill="#3B82F6" />
    <circle cx="26" cy="18" r="2" fill="#22C55E" />
  </svg>
);

export const TigerFishIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 44" fill="none" className={className} style={style}>
    <path d="M48 22 C48 12, 36 4, 24 6 C12 8, 4 14, 4 22 C4 30, 12 36, 24 38 C36 40, 48 32, 48 22Z" fill="#F59E0B" />
    <path d="M48 22 L60 12 L60 32 Z" fill="#D97706" />
    <path d="M14 10 L20 18 L26 10" stroke="#92400E" strokeWidth="2.5" fill="none" />
    <path d="M24 14 L30 22 L36 14" stroke="#92400E" strokeWidth="2.5" fill="none" />
    <path d="M32 18 L38 26 L44 18" stroke="#92400E" strokeWidth="2.5" fill="none" />
    <circle cx="16" cy="18" r="3" fill="white" />
    <circle cx="17" cy="17.5" r="1.5" fill="#0F172A" />
  </svg>
);

export const ToothIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 32 40" fill="none" className={className} style={style}>
    <path d="M16 4 C8 4, 4 10, 4 18 C4 24, 8 28, 12 36 L16 34 L20 36 C24 28, 28 24, 28 18 C28 10, 24 4, 16 4Z" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1.5" />
    <path d="M12 8 Q16 12, 20 8" stroke="#E5E7EB" strokeWidth="1" fill="none" />
  </svg>
);

export const HandWaveIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} style={style}>
    <path d="M20 32 Q10 30, 8 22 Q6 14, 12 10 L14 18 Z" fill="#FBBF24" />
    <path d="M14 18 L16 8 Q18 4, 20 8 L18 18 Z" fill="#FCD34D" />
    <path d="M18 16 L20 6 Q22 2, 24 6 L22 16 Z" fill="#FCD34D" />
    <path d="M22 16 L24 8 Q26 4, 28 8 L26 18 Z" fill="#FCD34D" />
    <path d="M26 18 L28 12 Q30 8, 32 12 L30 22 Q28 30, 20 32 Z" fill="#FCD34D" />
    <path d="M16 6 L18 4" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M24 2 L24 0" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M30 6 L32 4" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const PartyPopperIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} style={style}>
    <path d="M4 36 L16 16 L24 24 Z" fill="#FBBF24" />
    <path d="M4 36 L16 16 L20 20 Z" fill="#F59E0B" />
    <circle cx="20" cy="8" r="2" fill="#EF4444" />
    <circle cx="30" cy="12" r="2" fill="#3B82F6" />
    <circle cx="34" cy="24" r="2" fill="#22C55E" />
    <circle cx="26" cy="6" r="1.5" fill="#A855F7" />
    <circle cx="36" cy="18" r="1.5" fill="#FBBF24" />
    <path d="M22 10 L28 4" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M28 14 L34 8" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M30 22 L36 16" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const CrossIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#EF4444" />
    <path d="M8 8 L16 16 M16 8 L8 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const CheckIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" fill="#22C55E" />
    <path d="M7 12 L10.5 15.5 L17 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ──────────────────────────── Emoji → SVG Mapping ────────────────────────────

const EMOJI_TO_SVG: Record<string, (props: IconProps) => JSX.Element> = {
  '🐟': FishIcon,
  '🐠': TropicalFishIcon,
  '🦈': SharkIcon,
  '🐡': PufferfishIcon,
  '🐙': OctopusIcon,
  '🦀': CrabIcon,
  '🐋': WhaleIcon,
  '🦑': SquidIcon,
  '🦞': LobsterIcon,
  '🗡️': SwordfishIcon,
  '🐊': CrocodileIcon,
  '🐍': SnakeIcon,
  '🐢': TurtleIcon,
  '🐸': FrogIcon,
  '🦎': LizardIcon,
  '🏆': TrophyIcon,
  '✨': SparkleIcon,
  '💎': DiamondIcon,
  '🐉': DragonIcon,
  '🦋': ButterflyIcon,
  '👻': GhostFishIcon,
  '❄️': SnowflakeIcon,
  '🦴': BoneIcon,
  '🫁': LungsIcon,
  '⚪': FishIcon,
  '🐅': TigerFishIcon,
  '⚡': LightningIcon,
  '🦷': ToothIcon,
  '👑': CrownIcon,
  '☁️': CloudIcon,
  '☀️': SunIcon,
  '🌲': TreeIcon,
  '🌴': PalmTreeIcon,
  '🌳': TreeIcon,
  '🌊': WaveIcon,
  '🪨': RockIcon,
  '🪸': CoralIcon,
  '🪵': WoodLogIcon,
  '🏖️': BeachIcon,
  '🐚': ShellIcon,
  '⭐': StarFilledIcon,
  '🎣': FishingRodIcon,
  '⛵': BoatIcon,
  '🚢': ShipIcon,
  '🧑‍🌾': FishermanIcon,
  '🏚️': DockIcon,
  '🦜': SeagullIcon,
  '💰': CoinIcon,
  '📦': PackageIcon,
  '🎁': GiftIcon,
  '⚙️': GearIcon,
  '🛠️': ToolsIcon,
  '📷': CameraIcon,
  '📊': ChartIcon,
  '⚠️': WarningIcon,
  '🆕': NewBadgeIcon,
  '🌟': StarFilledIcon,
  '🪱': BaitIcon,
  '🎉': PartyPopperIcon,
  '👋': HandWaveIcon,
  '🏞️': RiverIcon,
  '🏔️': MountainIcon,
  '💧': WaterDropIcon,
  '🌿': LeafIcon,
};

// Renders an SVG icon based on emoji string. Falls back to the emoji text if no mapping exists.
export function EmojiIcon({ emoji, className, style }: { emoji: string } & IconProps) {
  const Component = EMOJI_TO_SVG[emoji];
  if (Component) {
    return <Component className={className} style={style} />;
  }
  // Fallback: render as FishIcon for unknown fish emojis
  return <FishIcon className={className} style={style} />;
}

// Renders a fish SVG by its svgType key, with fallback to generic fish
export function FishSvg({ type, className, style }: { type: string } & IconProps) {
  const Component = FishSvgMap[type] || FishIcon;
  return <Component className={className} style={style} />;
}
