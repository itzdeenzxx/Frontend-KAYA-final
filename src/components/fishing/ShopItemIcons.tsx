// Unique SVG icons for every shop item — rods, baits, boats
// More expensive items have more elaborate, futuristic designs

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

// ════════════════════════════════════════════════════════════════════════════
//  FISHING RODS (14 unique designs — bamboo → golden dragon)
// ════════════════════════════════════════════════════════════════════════════

/** rod_bamboo — คันเบ็ดไม้ไผ่ : simple green bamboo stick */
export const RodBambooIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <path d="M12 54 L44 10" stroke="#6B8E23" strokeWidth="4" strokeLinecap="round" />
    <path d="M18 46 L17 47" stroke="#556B2F" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
    <path d="M24 38 L23 39" stroke="#556B2F" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
    <path d="M30 30 L29 31" stroke="#556B2F" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
    <path d="M36 22 L35 23" stroke="#556B2F" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
    <path d="M44 10 Q50 16, 52 28" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,2" fill="none" />
    <circle cx="52" cy="28" r="2" fill="#94A3B8" />
    <ellipse cx="14" cy="56" rx="4" ry="2" fill="#556B2F" opacity="0.3" />
  </svg>
);

/** rod_wooden — คันเบ็ดไม้ : carved wood rod with simple reel */
export const RodWoodenIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <path d="M10 52 L42 12" stroke="#8B4513" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M10 52 L42 12" stroke="#A0522D" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <circle cx="18" cy="44" r="4" fill="#6B3A1F" stroke="#5C3317" strokeWidth="1" />
    <circle cx="18" cy="44" r="2" fill="#8B4513" />
    <circle cx="42" cy="12" r="1.5" fill="#D4A76A" />
    <path d="M42 12 Q50 18, 52 30 Q53 36, 50 40" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,2" fill="none" />
    <path d="M48 40 L50 42 L52 40" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
  </svg>
);

/** rod_basic_fiberglass — คันเบ็ดไฟเบอร์กลาสพื้นฐาน : white/grey fiberglass tube */
export const RodFiberglassIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="fg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E5E7EB" />
        <stop offset="100%" stopColor="#9CA3AF" />
      </linearGradient>
    </defs>
    <path d="M10 52 L44 10" stroke="url(#fg1)" strokeWidth="3.5" strokeLinecap="round" />
    <rect x="8" y="40" width="8" height="14" rx="2" fill="#4B5563" transform="rotate(-52 12 47)" />
    <circle cx="14" cy="44" r="3.5" fill="#374151" stroke="#6B7280" strokeWidth="1" />
    <circle cx="14" cy="44" r="1.5" fill="#9CA3AF" />
    <circle cx="44" cy="10" r="1.5" fill="#D1D5DB" />
    <path d="M44 10 Q52 16, 54 28" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2,2" fill="none" />
    <circle cx="54" cy="28" r="2" fill="#94A3B8" />
  </svg>
);

/** rod_carbon — คันเบ็ดคาร์บอนไฟเบอร์ : sleek dark rod with metallic accents */
export const RodCarbonIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="cb1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1F2937" />
        <stop offset="50%" stopColor="#374151" />
        <stop offset="100%" stopColor="#111827" />
      </linearGradient>
    </defs>
    <path d="M10 52 L46 8" stroke="url(#cb1)" strokeWidth="3" strokeLinecap="round" />
    <path d="M10 52 L46 8" stroke="#60A5FA" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
    <circle cx="16" cy="46" r="4" fill="#1F2937" stroke="#3B82F6" strokeWidth="1" />
    <circle cx="16" cy="46" r="2" fill="#374151" />
    <path d="M16 42 L17 41" stroke="#3B82F6" strokeWidth="1" />
    <circle cx="46" cy="8" r="1.5" fill="#60A5FA" />
    <path d="M46 8 Q54 14, 56 26 Q57 32, 54 36" stroke="#60A5FA" strokeWidth="0.8" strokeDasharray="2,2" fill="none" />
    <circle cx="54" cy="36" r="1.5" fill="#3B82F6" />
    <path d="M28 30 L30 28" stroke="#3B82F6" strokeWidth="0.8" opacity="0.4" />
  </svg>
);

/** rod_spinning — คันเบ็ดสปินนิ่ง : medium rod with visible spinning reel */
export const RodSpinningIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <path d="M10 54 L44 10" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
    <rect x="8" y="36" width="10" height="6" rx="2" fill="#1F2937" transform="rotate(-52 13 39)" />
    {/* Spinning reel */}
    <ellipse cx="16" cy="46" rx="6" ry="5" fill="#374151" stroke="#6B7280" strokeWidth="1" />
    <ellipse cx="16" cy="46" rx="4" ry="3" fill="#1F2937" />
    <circle cx="16" cy="46" r="1.5" fill="#9CA3AF" />
    <path d="M12 46 L20 46" stroke="#6B7280" strokeWidth="0.5" />
    <path d="M16 42 L16 50" stroke="#6B7280" strokeWidth="0.5" />
    {/* Line guides */}
    <circle cx="32" cy="24" r="1" fill="#9CA3AF" />
    <circle cx="38" cy="16" r="1" fill="#9CA3AF" />
    <circle cx="44" cy="10" r="1.5" fill="#D1D5DB" />
    <path d="M44 10 Q52 16, 54 28" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="2,2" fill="none" />
    <circle cx="54" cy="28" r="1.5" fill="#94A3B8" />
  </svg>
);

/** rod_baitcasting — คันเบ็ดเบทแคสติ้ง : short powerful rod with baitcaster reel on top */
export const RodBaitcastingIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="bc1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    <path d="M12 52 L46 14" stroke="url(#bc1)" strokeWidth="3.5" strokeLinecap="round" />
    {/* Baitcaster reel (mounted on top) */}
    <rect x="16" y="38" width="12" height="8" rx="3" fill="#0F172A" stroke="#475569" strokeWidth="1" transform="rotate(-50 22 42)" />
    <circle cx="20" cy="42" r="3" fill="#1E293B" stroke="#64748B" strokeWidth="0.8" />
    <circle cx="20" cy="42" r="1.2" fill="#94A3B8" />
    {/* Handle */}
    <path d="M10 54 L8 56" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
    <circle cx="8" cy="56" r="2" fill="#92400E" />
    {/* Guides */}
    <circle cx="34" cy="26" r="1.2" fill="#CBD5E1" />
    <circle cx="40" cy="18" r="1.2" fill="#CBD5E1" />
    <circle cx="46" cy="14" r="1.5" fill="#E2E8F0" />
    <path d="M46 14 Q54 20, 54 30" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="2,2" fill="none" />
  </svg>
);

/** rod_telescopic — คันเบ็ดหดได้ : telescoping sections visible */
export const RodTelescopicIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="tl1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
    </defs>
    {/* Telescoping sections — each thinner */}
    <path d="M12 54 L20 44" stroke="#4C1D95" strokeWidth="5" strokeLinecap="round" />
    <path d="M20 44 L28 34" stroke="#6D28D9" strokeWidth="4" strokeLinecap="round" />
    <path d="M28 34 L36 24" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
    <path d="M36 24 L42 16" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M42 16 L48 8" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
    {/* Joint rings */}
    <circle cx="20" cy="44" r="1.5" fill="#DDD6FE" />
    <circle cx="28" cy="34" r="1.3" fill="#DDD6FE" />
    <circle cx="36" cy="24" r="1.1" fill="#DDD6FE" />
    <circle cx="42" cy="16" r="1" fill="#DDD6FE" />
    {/* Reel */}
    <circle cx="14" cy="52" r="3.5" fill="#3B0764" stroke="#7C3AED" strokeWidth="1" />
    <circle cx="14" cy="52" r="1.5" fill="#A78BFA" />
    {/* Line */}
    <path d="M48 8 Q56 14, 56 26" stroke="#C4B5FD" strokeWidth="0.8" strokeDasharray="2,2" fill="none" />
    <circle cx="56" cy="26" r="1.5" fill="#A78BFA" />
  </svg>
);

/** rod_fly — คันเบ็ดฟลายฟิชชิ่ง : long thin fly rod with distinctive fly reel */
export const RodFlyIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="fly1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#065F46" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    {/* Very long thin rod */}
    <path d="M8 56 L52 6" stroke="url(#fly1)" strokeWidth="2" strokeLinecap="round" />
    <path d="M48 10 L52 6" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
    {/* Fly reel — distinctive large disc */}
    <circle cx="12" cy="52" r="6" fill="#064E3B" stroke="#34D399" strokeWidth="1" />
    <circle cx="12" cy="52" r="4" fill="#065F46" />
    <circle cx="12" cy="52" r="1.5" fill="#6EE7B7" />
    <path d="M8 52 L16 52" stroke="#34D399" strokeWidth="0.5" />
    <path d="M12 48 L12 56" stroke="#34D399" strokeWidth="0.5" />
    {/* Cork grip */}
    <path d="M14 50 L20 44" stroke="#D4A76A" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    {/* Fly line loops */}
    <path d="M52 6 Q56 4, 58 8 Q60 12, 56 14 Q52 16, 54 20" stroke="#FCD34D" strokeWidth="0.8" fill="none" />
    {/* Fly lure at end */}
    <circle cx="54" cy="20" r="2" fill="#EF4444" />
    <path d="M52 18 L50 16" stroke="#F59E0B" strokeWidth="0.5" />
    <path d="M56 18 L58 16" stroke="#F59E0B" strokeWidth="0.5" />
  </svg>
);

/** rod_surf — คันเบ็ดชายหาด : extra long heavy-duty surf rod */
export const RodSurfIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="sf1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0C4A6E" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
    </defs>
    {/* Extra long rod */}
    <path d="M6 58 L50 4" stroke="url(#sf1)" strokeWidth="3" strokeLinecap="round" />
    <path d="M46 8 L50 4" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
    {/* Large spinning reel */}
    <ellipse cx="12" cy="52" rx="5" ry="6" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="1" />
    <ellipse cx="12" cy="52" rx="3" ry="4" fill="#0E7490" />
    <circle cx="12" cy="52" r="1.5" fill="#7DD3FC" />
    {/* Line guides (larger for surf casting) */}
    <circle cx="24" cy="38" r="1.5" fill="#7DD3FC" />
    <circle cx="32" cy="28" r="1.3" fill="#7DD3FC" />
    <circle cx="40" cy="18" r="1.2" fill="#7DD3FC" />
    {/* Sand & waves at bottom */}
    <path d="M0 62 Q8 58, 16 62 Q24 66, 32 62" stroke="#F59E0B" strokeWidth="1.5" fill="none" opacity="0.4" />
    <path d="M50 4 Q56 8, 58 16" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="2,2" fill="none" />
  </svg>
);

/** rod_pro_carbon — คันเบ็ดคาร์บอนโปร : hi-tech carbon with LED accents */
export const RodProCarbonIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="pc1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="40%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>
    <path d="M10 54 L48 8" stroke="url(#pc1)" strokeWidth="3" strokeLinecap="round" />
    {/* Neon accents */}
    <path d="M10 54 L48 8" stroke="#22D3EE" strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
    <path d="M16 48 L18 46" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <path d="M28 34 L30 32" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M40 20 L42 18" stroke="#22D3EE" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    {/* Pro reel */}
    <circle cx="12" cy="52" r="5" fill="#0F172A" stroke="#22D3EE" strokeWidth="1.5" />
    <circle cx="12" cy="52" r="3" fill="#1E293B" stroke="#06B6D4" strokeWidth="0.5" />
    <circle cx="12" cy="52" r="1" fill="#22D3EE" />
    {/* Carbon weave pattern hint */}
    <path d="M22 42 L24 40 L22 38" stroke="#334155" strokeWidth="0.5" fill="none" opacity="0.6" />
    <path d="M34 28 L36 26 L34 24" stroke="#334155" strokeWidth="0.5" fill="none" opacity="0.6" />
    <circle cx="48" cy="8" r="1.5" fill="#22D3EE" />
    <path d="M48 8 Q56 14, 56 24" stroke="#22D3EE" strokeWidth="0.6" strokeDasharray="2,2" fill="none" />
  </svg>
);

/** rod_titanium — คันเบ็ดไทเทเนียม : metallic silver-blue titanium */
export const RodTitaniumIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="ti1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="30%" stopColor="#CBD5E1" />
        <stop offset="50%" stopColor="#E2E8F0" />
        <stop offset="70%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
    </defs>
    <path d="M10 54 L48 8" stroke="url(#ti1)" strokeWidth="3.5" strokeLinecap="round" />
    {/* Metallic shine line */}
    <path d="M18 46 L42 14" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
    {/* Premium reel */}
    <circle cx="12" cy="52" r="5" fill="#64748B" stroke="#E2E8F0" strokeWidth="1.5" />
    <circle cx="12" cy="52" r="3" fill="#94A3B8" />
    <circle cx="12" cy="52" r="1.2" fill="#F1F5F9" />
    {/* Guide rings with blue gem */}
    <circle cx="26" cy="36" r="1.8" fill="none" stroke="#3B82F6" strokeWidth="1" />
    <circle cx="34" cy="26" r="1.5" fill="none" stroke="#3B82F6" strokeWidth="1" />
    <circle cx="42" cy="16" r="1.2" fill="none" stroke="#3B82F6" strokeWidth="1" />
    <circle cx="48" cy="8" r="2" fill="#3B82F6" />
    {/* Line */}
    <path d="M48 8 Q56 14, 56 26" stroke="#93C5FD" strokeWidth="0.8" strokeDasharray="2,2" fill="none" />
    <path d="M54 26 L56 28 L58 26" fill="#3B82F6" />
  </svg>
);

/** rod_deep_sea — คันเบ็ดท้องทะเลลึก : massive deep-sea rod, dark blue with neon */
export const RodDeepSeaIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="ds1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1E1B4B" />
        <stop offset="100%" stopColor="#312E81" />
      </linearGradient>
    </defs>
    {/* Thick heavy rod */}
    <path d="M8 56 L46 10" stroke="url(#ds1)" strokeWidth="5" strokeLinecap="round" />
    <path d="M8 56 L46 10" stroke="#818CF8" strokeWidth="0.8" opacity="0.5" />
    {/* Massive reel */}
    <ellipse cx="12" cy="54" rx="7" ry="6" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1.5" />
    <ellipse cx="12" cy="54" rx="4.5" ry="3.5" fill="#312E81" />
    <circle cx="12" cy="54" r="2" fill="#818CF8" />
    {/* Fighting butt */}
    <path d="M6 58 L4 62" stroke="#4C1D95" strokeWidth="4" strokeLinecap="round" />
    <circle cx="4" cy="62" r="2.5" fill="#6D28D9" />
    {/* Heavy guides */}
    <circle cx="28" cy="34" r="2" fill="none" stroke="#A5B4FC" strokeWidth="1.5" />
    <circle cx="38" cy="22" r="1.8" fill="none" stroke="#A5B4FC" strokeWidth="1.2" />
    <circle cx="46" cy="10" r="2" fill="#818CF8" />
    {/* Deep water hint */}
    <path d="M46 10 Q54 16, 56 28 Q57 36, 54 42" stroke="#6366F1" strokeWidth="1" strokeDasharray="3,2" fill="none" />
    <circle cx="54" cy="42" r="2" fill="#A78BFA" />
  </svg>
);

/** rod_master — คันเบ็ดนักตกปลาเซียน : legendary master rod with glowing aura */
export const RodMasterIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="ms1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7C2D12" />
        <stop offset="50%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#7C2D12" />
      </linearGradient>
      <filter id="ms_glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Glowing rod */}
    <path d="M10 54 L48 8" stroke="#FCA5A5" strokeWidth="6" strokeLinecap="round" opacity="0.3" filter="url(#ms_glow)" />
    <path d="M10 54 L48 8" stroke="url(#ms1)" strokeWidth="3" strokeLinecap="round" />
    <path d="M20 44 L44 12" stroke="#FBBF24" strokeWidth="0.5" opacity="0.8" />
    {/* Master reel with gem */}
    <circle cx="12" cy="52" r="6" fill="#7C2D12" stroke="#F59E0B" strokeWidth="1.5" />
    <circle cx="12" cy="52" r="3.5" fill="#991B1B" />
    <circle cx="12" cy="52" r="1.5" fill="#FBBF24" />
    {/* Ruby guide gems */}
    <circle cx="26" cy="36" r="1.5" fill="#EF4444" />
    <circle cx="34" cy="26" r="1.3" fill="#EF4444" />
    <circle cx="42" cy="16" r="1.2" fill="#EF4444" />
    {/* Crown ornament at tip */}
    <circle cx="48" cy="8" r="2.5" fill="#FBBF24" />
    <path d="M45 6 L48 3 L51 6" stroke="#FBBF24" strokeWidth="1" fill="none" />
    {/* Sparkles */}
    <circle cx="30" cy="20" r="1" fill="#FCD34D" opacity="0.8" />
    <circle cx="40" cy="30" r="0.8" fill="#FCD34D" opacity="0.6" />
  </svg>
);

/** rod_golden — คันเบ็ดมังกรทอง : golden dragon rod — ultimate legendary */
export const RodGoldenIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="gd1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#92400E" />
        <stop offset="25%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#FCD34D" />
        <stop offset="75%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <filter id="gd_glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Golden glow */}
    <path d="M10 54 L48 8" stroke="#FCD34D" strokeWidth="8" strokeLinecap="round" opacity="0.25" filter="url(#gd_glow)" />
    {/* Dragon-wrapped rod */}
    <path d="M10 54 L48 8" stroke="url(#gd1)" strokeWidth="4" strokeLinecap="round" />
    {/* Dragon body wrapping */}
    <path d="M18 46 Q22 42, 20 40 Q18 38, 22 34 Q26 30, 24 28 Q22 26, 26 22 Q30 18, 28 16 Q26 14, 30 10" stroke="#B45309" strokeWidth="1.5" fill="none" opacity="0.7" />
    {/* Dragon head at tip */}
    <circle cx="48" cy="8" r="4" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
    <circle cx="46" cy="6" r="1" fill="#EF4444" />
    <circle cx="50" cy="6" r="1" fill="#EF4444" />
    <path d="M44 8 L42 10" stroke="#B45309" strokeWidth="1" />
    <path d="M52 8 L54 10" stroke="#B45309" strokeWidth="1" />
    {/* Golden reel */}
    <circle cx="12" cy="52" r="6" fill="#92400E" stroke="#FCD34D" strokeWidth="2" />
    <circle cx="12" cy="52" r="3.5" fill="#B45309" />
    <circle cx="12" cy="52" r="1.5" fill="#FCD34D" />
    {/* Diamond guides */}
    <path d="M24 38 L26 36 L24 34 L22 36 Z" fill="#FCD34D" />
    <path d="M33 27 L35 25 L33 23 L31 25 Z" fill="#FCD34D" />
    {/* Sparkle particles */}
    <circle cx="36" cy="14" r="1" fill="white" opacity="0.9" />
    <circle cx="20" cy="34" r="0.8" fill="white" opacity="0.7" />
    <circle cx="42" cy="22" r="0.8" fill="white" opacity="0.8" />
    <circle cx="28" cy="44" r="0.6" fill="white" opacity="0.6" />
  </svg>
);

// ════════════════════════════════════════════════════════════════════════════
//  BAITS (14 unique designs — worm → mystical essence)
// ════════════════════════════════════════════════════════════════════════════

/** bait_worm — หนอนดิน : simple earthworm */
export const BaitWormIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <path d="M12 14 Q18 10, 24 16 Q30 22, 28 30 Q26 36, 20 38 Q14 40, 12 34" stroke="#C2410C" strokeWidth="4" strokeLinecap="round" fill="none" />
    <circle cx="12" cy="14" r="2.5" fill="#EA580C" />
    <circle cx="11" cy="13" r="0.8" fill="#1F2937" />
    {/* Segments */}
    <path d="M18 12 Q19 14, 18 16" stroke="#9A3412" strokeWidth="0.8" fill="none" opacity="0.5" />
    <path d="M24 18 Q25 20, 24 22" stroke="#9A3412" strokeWidth="0.8" fill="none" opacity="0.5" />
    <path d="M26 26 Q27 28, 26 30" stroke="#9A3412" strokeWidth="0.8" fill="none" opacity="0.5" />
    {/* Dirt specks */}
    <circle cx="32" cy="36" r="1" fill="#92400E" opacity="0.3" />
    <circle cx="8" cy="28" r="0.8" fill="#92400E" opacity="0.3" />
  </svg>
);

/** bait_bread — ขนมปัง : bread chunk on hook */
export const BaitBreadIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    {/* Hook */}
    <path d="M24 4 L24 18 Q24 28, 18 28 Q12 28, 12 22" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
    <circle cx="24" cy="4" r="2" fill="#94A3B8" />
    {/* Bread */}
    <rect x="16" y="26" width="18" height="14" rx="4" fill="#F59E0B" />
    <rect x="18" y="28" width="14" height="10" rx="3" fill="#FCD34D" />
    {/* Bread texture */}
    <circle cx="22" cy="32" r="1" fill="#FBBF24" opacity="0.6" />
    <circle cx="28" cy="34" r="0.8" fill="#FBBF24" opacity="0.6" />
    <circle cx="25" cy="36" r="0.6" fill="#FBBF24" opacity="0.6" />
  </svg>
);

/** bait_corn — ข้าวโพดหวาน : corn kernels */
export const BaitCornIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    {/* Hook */}
    <path d="M24 2 L24 14 Q24 22, 18 22 Q12 22, 12 16" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Corn kernels stack */}
    <ellipse cx="24" cy="24" rx="6" ry="4" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
    <ellipse cx="24" cy="30" rx="7" ry="4.5" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />
    <ellipse cx="24" cy="36" rx="6.5" ry="4" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
    {/* Kernel details */}
    <circle cx="21" cy="24" r="1" fill="#FCD34D" />
    <circle cx="27" cy="24" r="1" fill="#FCD34D" />
    <circle cx="22" cy="30" r="1" fill="#FCD34D" />
    <circle cx="26" cy="30" r="1" fill="#FCD34D" />
    <circle cx="24" cy="36" r="1" fill="#FCD34D" />
    {/* Green husk hint */}
    <path d="M18 22 Q16 18, 18 14" stroke="#22C55E" strokeWidth="1.5" fill="none" />
    <path d="M30 22 Q32 18, 30 14" stroke="#22C55E" strokeWidth="1.5" fill="none" />
  </svg>
);

/** bait_shrimp — กุ้งสด : fresh shrimp */
export const BaitShrimpIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    {/* Body curve */}
    <path d="M16 10 Q28 8, 34 16 Q38 22, 34 30 Q30 36, 24 38" stroke="#FB923C" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M16 10 Q28 8, 34 16 Q38 22, 34 30 Q30 36, 24 38" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
    {/* Head */}
    <ellipse cx="16" cy="10" rx="5" ry="4" fill="#EA580C" />
    <circle cx="14" cy="8" r="1" fill="#1F2937" />
    {/* Antennae */}
    <path d="M12 8 Q6 4, 4 6" stroke="#FB923C" strokeWidth="0.8" fill="none" />
    <path d="M14 6 Q10 2, 8 4" stroke="#FB923C" strokeWidth="0.8" fill="none" />
    {/* Tail fan */}
    <path d="M24 38 L20 42 L24 44 L28 42 L24 38" fill="#FDBA74" stroke="#EA580C" strokeWidth="0.5" />
    {/* Segments */}
    <path d="M26 14 Q28 16, 26 18" stroke="#C2410C" strokeWidth="0.5" opacity="0.5" />
    <path d="M32 20 Q34 22, 32 24" stroke="#C2410C" strokeWidth="0.5" opacity="0.5" />
    <path d="M32 28 Q34 30, 32 32" stroke="#C2410C" strokeWidth="0.5" opacity="0.5" />
    {/* Legs */}
    <path d="M24 14 L22 18" stroke="#FDBA74" strokeWidth="0.5" />
    <path d="M30 18 L28 22" stroke="#FDBA74" strokeWidth="0.5" />
    <path d="M34 24 L32 28" stroke="#FDBA74" strokeWidth="0.5" />
  </svg>
);

/** bait_minnow — ปลาเล็กสด : small live minnow */
export const BaitMinnowIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    {/* Body */}
    <ellipse cx="24" cy="24" rx="14" ry="6" fill="#93C5FD" />
    <ellipse cx="24" cy="24" rx="12" ry="5" fill="#BFDBFE" />
    {/* Head */}
    <ellipse cx="12" cy="24" rx="4" ry="5" fill="#60A5FA" />
    {/* Eye */}
    <circle cx="10" cy="22" r="2" fill="white" />
    <circle cx="10" cy="22" r="1" fill="#1F2937" />
    {/* Tail */}
    <path d="M38 24 L44 18 L44 30 Z" fill="#60A5FA" />
    {/* Fins */}
    <path d="M20 18 Q24 14, 28 18" fill="#93C5FD" stroke="#60A5FA" strokeWidth="0.5" />
    <path d="M18 30 Q20 34, 22 30" fill="#93C5FD" stroke="#60A5FA" strokeWidth="0.5" />
    {/* Lateral line */}
    <path d="M14 24 L36 24" stroke="#3B82F6" strokeWidth="0.5" opacity="0.4" />
    {/* Hook */}
    <path d="M24 18 L24 12 Q24 8, 20 8" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

/** bait_cricket — จิ้งหรีด : cricket bait */
export const BaitCricketIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    {/* Body */}
    <ellipse cx="24" cy="26" rx="10" ry="6" fill="#3F6212" />
    <ellipse cx="24" cy="26" rx="8" ry="4.5" fill="#4D7C0F" />
    {/* Head */}
    <circle cx="14" cy="24" r="5" fill="#3F6212" />
    <circle cx="12" cy="22" r="1.5" fill="#1F2937" />
    <circle cx="12" cy="22" r="0.5" fill="white" />
    {/* Antennae */}
    <path d="M10 20 Q6 12, 4 10" stroke="#4D7C0F" strokeWidth="0.8" fill="none" />
    <path d="M12 18 Q10 10, 8 8" stroke="#4D7C0F" strokeWidth="0.8" fill="none" />
    {/* Back legs (large) */}
    <path d="M28 30 L34 22 L40 32" stroke="#3F6212" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M26 30 L32 24 L38 34" stroke="#4D7C0F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Front legs */}
    <path d="M18 28 L16 34" stroke="#3F6212" strokeWidth="1" />
    <path d="M20 30 L18 36" stroke="#3F6212" strokeWidth="1" />
    {/* Wings hint */}
    <path d="M20 22 Q24 18, 30 22" stroke="#65A30D" strokeWidth="0.5" fill="none" opacity="0.6" />
  </svg>
);

/** bait_squid — ปลาหมึกสด : fresh squid */
export const BaitSquidIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    {/* Mantle */}
    <path d="M16 8 Q24 4, 32 8 L34 24 Q24 28, 14 24 Z" fill="#F472B6" />
    <path d="M18 10 Q24 6, 30 10 L32 22 Q24 26, 16 22 Z" fill="#FB7185" opacity="0.6" />
    {/* Eyes */}
    <circle cx="20" cy="16" r="2.5" fill="white" />
    <circle cx="20" cy="16" r="1.2" fill="#1F2937" />
    <circle cx="28" cy="16" r="2.5" fill="white" />
    <circle cx="28" cy="16" r="1.2" fill="#1F2937" />
    {/* Tentacles */}
    <path d="M16 24 Q14 32, 10 38" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M19 26 Q18 34, 16 40" stroke="#FB7185" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M22 27 Q22 36, 20 42" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M26 27 Q26 36, 28 42" stroke="#FB7185" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M29 26 Q30 34, 32 40" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M32 24 Q34 32, 38 38" stroke="#FB7185" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Suction cups */}
    <circle cx="14" cy="32" r="0.8" fill="#F9A8D4" />
    <circle cx="20" cy="36" r="0.8" fill="#F9A8D4" />
    <circle cx="28" cy="36" r="0.8" fill="#F9A8D4" />
  </svg>
);

/** bait_crab — ปูนิ่ม : soft shell crab */
export const BaitCrabIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    {/* Shell */}
    <ellipse cx="24" cy="24" rx="14" ry="10" fill="#DC2626" />
    <ellipse cx="24" cy="22" rx="12" ry="8" fill="#EF4444" />
    {/* Eyes on stalks */}
    <path d="M16 16 L12 10" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="10" r="2.5" fill="#FCA5A5" />
    <circle cx="12" cy="10" r="1" fill="#1F2937" />
    <path d="M32 16 L36 10" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <circle cx="36" cy="10" r="2.5" fill="#FCA5A5" />
    <circle cx="36" cy="10" r="1" fill="#1F2937" />
    {/* Claws */}
    <path d="M10 22 L4 18 Q2 16, 4 14 L8 16" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M38 22 L44 18 Q46 16, 44 14 L40 16" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Legs */}
    <path d="M12 28 L6 34" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14 30 L8 38" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 32 L12 40" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M36 28 L42 34" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M34 30 L40 38" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M32 32 L36 40" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
    {/* Shell texture */}
    <path d="M20 20 Q24 18, 28 20" stroke="#B91C1C" strokeWidth="0.5" fill="none" opacity="0.4" />
  </svg>
);

/** bait_frog — กบสด : frog bait */
export const BaitFrogIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    {/* Body */}
    <ellipse cx="24" cy="28" rx="12" ry="10" fill="#16A34A" />
    <ellipse cx="24" cy="26" rx="10" ry="8" fill="#22C55E" />
    {/* Belly */}
    <ellipse cx="24" cy="30" rx="7" ry="5" fill="#BBF7D0" opacity="0.6" />
    {/* Eyes (bulging) */}
    <circle cx="16" cy="16" r="5" fill="#16A34A" />
    <circle cx="16" cy="14" r="3.5" fill="white" />
    <circle cx="16" cy="14" r="1.5" fill="#1F2937" />
    <circle cx="32" cy="16" r="5" fill="#16A34A" />
    <circle cx="32" cy="14" r="3.5" fill="white" />
    <circle cx="32" cy="14" r="1.5" fill="#1F2937" />
    {/* Mouth */}
    <path d="M18 22 Q24 26, 30 22" stroke="#166534" strokeWidth="1" fill="none" />
    {/* Front legs */}
    <path d="M14 32 L6 36 L4 34 L6 32 L8 34" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M34 32 L42 36 L44 34 L42 32 L40 34" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Back legs */}
    <path d="M16 36 L10 44 L8 42 L12 40 L14 44" stroke="#15803D" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M32 36 L38 44 L40 42 L36 40 L34 44" stroke="#15803D" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Spots */}
    <circle cx="20" cy="24" r="1.5" fill="#166534" opacity="0.4" />
    <circle cx="28" cy="26" r="1.2" fill="#166534" opacity="0.4" />
  </svg>
);

/** bait_lure_legendary — เหยื่อเทียมตำนาน : legendary artificial lure — elaborate */
export const BaitLureLegendaryIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="lure1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="50%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    {/* Lure body */}
    <ellipse cx="24" cy="22" rx="12" ry="7" fill="url(#lure1)" />
    <ellipse cx="24" cy="20" rx="10" ry="5" fill="#C084FC" opacity="0.5" />
    {/* Eye */}
    <circle cx="14" cy="20" r="3" fill="white" stroke="#6D28D9" strokeWidth="0.5" />
    <circle cx="14" cy="20" r="1.5" fill="#EF4444" />
    {/* Treble hooks */}
    <path d="M20 28 L18 34 M20 28 L22 34 M20 28 L20 35" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
    <path d="M30 28 L28 34 M30 28 L32 34 M30 28 L30 35" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
    {/* Diving lip */}
    <path d="M10 22 L4 28" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
    {/* Stripe pattern */}
    <path d="M18 16 L18 28" stroke="#DDD6FE" strokeWidth="0.8" opacity="0.5" />
    <path d="M22 16 L22 28" stroke="#DDD6FE" strokeWidth="0.8" opacity="0.5" />
    <path d="M26 16 L26 28" stroke="#DDD6FE" strokeWidth="0.8" opacity="0.5" />
    <path d="M30 16 L30 28" stroke="#DDD6FE" strokeWidth="0.8" opacity="0.5" />
    {/* Line ring */}
    <circle cx="36" cy="22" r="2" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Sparkle */}
    <circle cx="20" cy="18" r="1" fill="white" opacity="0.8" />
  </svg>
);

/** bait_octopus — ปลาหมึกยักษ์สด : giant octopus bait */
export const BaitOctopusIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    {/* Head */}
    <ellipse cx="24" cy="14" rx="12" ry="10" fill="#9333EA" />
    <ellipse cx="24" cy="12" rx="10" ry="8" fill="#A855F7" opacity="0.6" />
    {/* Eyes */}
    <ellipse cx="18" cy="14" rx="3" ry="3.5" fill="white" />
    <circle cx="18" cy="14" r="1.5" fill="#1F2937" />
    <ellipse cx="30" cy="14" rx="3" ry="3.5" fill="white" />
    <circle cx="30" cy="14" r="1.5" fill="#1F2937" />
    {/* 8 tentacles */}
    <path d="M12 20 Q6 28, 4 36 Q3 40, 6 38" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M14 22 Q10 30, 10 40 Q10 44, 12 42" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M18 24 Q16 32, 16 42 Q16 46, 18 44" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M22 24 Q22 34, 22 44 Q22 46, 24 44" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M26 24 Q26 34, 26 44 Q26 46, 28 44" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M30 24 Q32 32, 32 42 Q32 46, 34 42" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M34 22 Q38 30, 38 40 Q38 44, 40 38" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M36 20 Q42 28, 44 36 Q45 40, 42 38" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Suction cups */}
    <circle cx="8" cy="32" r="0.8" fill="#C084FC" />
    <circle cx="12" cy="36" r="0.8" fill="#C084FC" />
    <circle cx="36" cy="36" r="0.8" fill="#C084FC" />
    <circle cx="40" cy="32" r="0.8" fill="#C084FC" />
  </svg>
);

/** bait_special_blend — เหยื่อผสมพิเศษ : glowing special mix jar */
export const BaitSpecialBlendIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="sb1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="50%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Jar */}
    <rect x="12" y="14" width="24" height="28" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
    {/* Jar lid */}
    <rect x="10" y="10" width="28" height="6" rx="2" fill="#475569" />
    <rect x="14" y="8" width="20" height="3" rx="1" fill="#64748B" />
    {/* Glowing content */}
    <rect x="14" y="20" width="20" height="20" rx="3" fill="url(#sb1)" opacity="0.8" />
    {/* Bubbles / particles inside */}
    <circle cx="20" cy="28" r="2" fill="#FCD34D" opacity="0.7" />
    <circle cx="28" cy="32" r="1.5" fill="#F59E0B" opacity="0.7" />
    <circle cx="24" cy="24" r="1" fill="white" opacity="0.6" />
    <circle cx="18" cy="34" r="1.2" fill="#FCA5A5" opacity="0.5" />
    <circle cx="30" cy="26" r="0.8" fill="white" opacity="0.5" />
    {/* Glow */}
    <rect x="14" y="20" width="20" height="20" rx="3" fill="#F59E0B" opacity="0.15" />
    {/* Label */}
    <rect x="16" y="16" width="16" height="3" rx="1" fill="#F59E0B" opacity="0.3" />
    {/* Star on label */}
    <path d="M24 16.5 L25 18 L26.5 17.5 L25.5 19 L26.5 20.5 L25 20 L24 21.5 L23 20 L21.5 20.5 L22.5 19 L21.5 17.5 L23 18 Z" fill="#FCD34D" />
  </svg>
);

/** bait_golden — เหยื่อทองคำ : golden bait with sparkle */
export const BaitGoldenIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="gb1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#92400E" />
        <stop offset="30%" stopColor="#FBBF24" />
        <stop offset="60%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <filter id="gb_glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Golden glow background */}
    <circle cx="24" cy="24" r="16" fill="#FCD34D" opacity="0.15" filter="url(#gb_glow)" />
    {/* Golden lure body */}
    <ellipse cx="24" cy="22" rx="12" ry="8" fill="url(#gb1)" />
    <ellipse cx="24" cy="20" rx="9" ry="5" fill="#FCD34D" opacity="0.4" />
    {/* Eye */}
    <circle cx="14" cy="20" r="3" fill="white" stroke="#B45309" strokeWidth="0.5" />
    <circle cx="14" cy="20" r="1.5" fill="#DC2626" />
    {/* Gold hooks */}
    <path d="M20 29 L18 36 M20 29 L22 36 M20 29 L20 37" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M30 29 L28 36 M30 29 L32 36 M30 29 L30 37" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
    {/* Ring */}
    <circle cx="36" cy="22" r="2.5" fill="none" stroke="#FBBF24" strokeWidth="2" />
    {/* Sparkles */}
    <circle cx="18" cy="16" r="1.2" fill="white" opacity="0.9" />
    <circle cx="28" cy="18" r="0.8" fill="white" opacity="0.8" />
    <circle cx="8" cy="12" r="1" fill="#FCD34D" opacity="0.7" />
    <circle cx="38" cy="10" r="0.8" fill="#FCD34D" opacity="0.6" />
    <circle cx="12" cy="34" r="0.6" fill="#FCD34D" opacity="0.5" />
    {/* Crown stamp */}
    <path d="M22 22 L23 20 L24 22 L25 20 L26 22" stroke="#B45309" strokeWidth="0.8" fill="none" />
  </svg>
);

/** bait_mystical — แก่นวิเศษ : mystical glowing essence orb */
export const BaitMysticalIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <defs>
      <radialGradient id="my1" cx="0.4" cy="0.4">
        <stop offset="0%" stopColor="#E9D5FF" />
        <stop offset="40%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#581C87" />
      </radialGradient>
      <filter id="my_glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Outer glow rings */}
    <circle cx="24" cy="24" r="20" fill="#A855F7" opacity="0.08" filter="url(#my_glow)" />
    <circle cx="24" cy="24" r="16" fill="#C084FC" opacity="0.1" />
    {/* Orb */}
    <circle cx="24" cy="24" r="12" fill="url(#my1)" />
    {/* Inner glow */}
    <circle cx="20" cy="20" r="5" fill="white" opacity="0.2" />
    {/* Mystical runes / energy swirl */}
    <path d="M16 24 Q20 16, 28 20 Q36 24, 28 30 Q20 36, 16 24" stroke="#E9D5FF" strokeWidth="0.8" fill="none" opacity="0.6" />
    <path d="M20 18 Q24 14, 30 18" stroke="#DDD6FE" strokeWidth="0.5" fill="none" opacity="0.5" />
    <path d="M18 30 Q24 34, 30 30" stroke="#DDD6FE" strokeWidth="0.5" fill="none" opacity="0.5" />
    {/* Floating particles */}
    <circle cx="14" cy="12" r="1.5" fill="#C084FC" opacity="0.7" />
    <circle cx="36" cy="14" r="1" fill="#A855F7" opacity="0.6" />
    <circle cx="10" cy="30" r="0.8" fill="#DDD6FE" opacity="0.5" />
    <circle cx="38" cy="32" r="1.2" fill="#C084FC" opacity="0.5" />
    <circle cx="24" cy="6" r="0.8" fill="white" opacity="0.6" />
    <circle cx="8" cy="22" r="0.6" fill="#E9D5FF" opacity="0.4" />
    <circle cx="40" cy="24" r="0.6" fill="#E9D5FF" opacity="0.4" />
    {/* Star sparkle */}
    <path d="M24 10 L25 12 L27 12 L25.5 13.5 L26 16 L24 14.5 L22 16 L22.5 13.5 L21 12 L23 12 Z" fill="white" opacity="0.8" />
  </svg>
);

// ════════════════════════════════════════════════════════════════════════════
//  BOATS (14 unique designs — raft → golden dragon ship)
// ════════════════════════════════════════════════════════════════════════════

/** boat_raft — แพไม้ : simple wooden raft */
export const BoatRaftIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    {/* Logs */}
    <rect x="8" y="20" width="48" height="6" rx="3" fill="#92400E" />
    <rect x="8" y="27" width="48" height="6" rx="3" fill="#A0522D" />
    <rect x="8" y="34" width="48" height="6" rx="3" fill="#8B4513" />
    {/* Cross planks */}
    <rect x="16" y="18" width="4" height="24" rx="1" fill="#B45309" opacity="0.6" />
    <rect x="36" y="18" width="4" height="24" rx="1" fill="#B45309" opacity="0.6" />
    {/* Pole */}
    <rect x="30" y="2" width="3" height="20" fill="#78350F" />
    {/* Flag */}
    <path d="M33 2 L48 8 L33 14" fill="#EF4444" opacity="0.8" />
    {/* Water */}
    <path d="M0 44 Q8 40, 16 44 Q24 48, 32 44 Q40 40, 48 44 Q56 48, 64 44" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_canoe — เรือเล็ก : small wooden canoe */
export const BoatCanoeIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    {/* Hull */}
    <path d="M4 28 Q8 36, 32 38 Q56 36, 60 28 L56 22 Q32 18, 8 22 Z" fill="#8B4513" />
    <path d="M8 26 Q32 20, 56 26 Q32 32, 8 26" fill="#A0522D" opacity="0.5" />
    {/* Seats */}
    <rect x="18" y="24" width="10" height="3" rx="1" fill="#6B3A1F" />
    <rect x="36" y="24" width="10" height="3" rx="1" fill="#6B3A1F" />
    {/* Paddle */}
    <path d="M48 12 L54 30" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="55" cy="32" rx="3" ry="6" fill="#A0522D" transform="rotate(15 55 32)" />
    {/* Water */}
    <path d="M0 42 Q10 38, 20 42 Q30 46, 40 42 Q50 38, 60 42" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_kayak — คายัค : sleek kayak */
export const BoatKayakIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="kk1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="50%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
    </defs>
    {/* Sleek hull */}
    <path d="M2 26 Q6 32, 32 34 Q58 32, 62 26 Q58 22, 32 20 Q6 22, 2 26 Z" fill="url(#kk1)" />
    <path d="M6 26 Q32 22, 58 26" stroke="#FCA5A5" strokeWidth="0.5" fill="none" opacity="0.5" />
    {/* Cockpit */}
    <ellipse cx="32" cy="26" rx="8" ry="4" fill="#991B1B" />
    <ellipse cx="32" cy="26" rx="6" ry="3" fill="#1F2937" stroke="#DC2626" strokeWidth="0.5" />
    {/* Paddle (double-bladed) */}
    <path d="M14 10 L50 18" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="12" cy="10" rx="2.5" ry="5" fill="#F59E0B" transform="rotate(-10 12 10)" />
    <ellipse cx="52" cy="18" rx="2.5" ry="5" fill="#F59E0B" transform="rotate(-10 52 18)" />
    {/* Water */}
    <path d="M0 40 Q12 36, 24 40 Q36 44, 48 40 Q56 36, 64 40" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_fishing_boat — เรือตกปลา : classic fishing boat */
export const BoatFishingBoatIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    {/* Hull */}
    <path d="M6 28 L14 40 L50 40 L58 28 Z" fill="#1E40AF" />
    <path d="M6 28 L14 40 L32 40 L24 28 Z" fill="#2563EB" opacity="0.6" />
    {/* Cabin */}
    <rect x="20" y="18" width="16" height="12" rx="2" fill="#1E3A5F" />
    <rect x="22" y="20" width="5" height="4" rx="1" fill="#93C5FD" opacity="0.6" />
    <rect x="29" y="20" width="5" height="4" rx="1" fill="#93C5FD" opacity="0.6" />
    {/* Roof */}
    <rect x="18" y="16" width="20" height="3" rx="1" fill="#0F172A" />
    {/* Fishing rod holders */}
    <path d="M42 18 L44 8" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M46 18 L48 8" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
    {/* Railing */}
    <path d="M10 28 L14 28 L18 28" stroke="#94A3B8" strokeWidth="1" />
    <path d="M46 28 L50 28 L54 28" stroke="#94A3B8" strokeWidth="1" />
    {/* Water */}
    <path d="M0 44 Q10 40, 20 44 Q30 48, 42 44 Q52 40, 64 44" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_speedboat — เรือเร็ว : fast speedboat */
export const BoatSpeedboatIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="sp1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
    </defs>
    {/* Sleek hull */}
    <path d="M4 30 Q8 38, 28 40 Q52 40, 62 30 L56 26 Q28 22, 8 26 Z" fill="url(#sp1)" />
    {/* Stripe */}
    <path d="M8 28 Q28 24, 56 28" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
    {/* Windshield */}
    <path d="M24 20 L32 18 L36 20 L36 26 L24 26 Z" fill="#0EA5E9" opacity="0.6" />
    <path d="M24 20 L32 18 L36 20" stroke="#94A3B8" strokeWidth="1" fill="none" />
    {/* Console */}
    <rect x="28" y="22" width="6" height="6" rx="1" fill="#1F2937" />
    {/* Speed lines */}
    <path d="M2 32 L-4 32" stroke="white" strokeWidth="1" opacity="0.4" />
    <path d="M4 36 L-2 36" stroke="white" strokeWidth="0.8" opacity="0.3" />
    {/* Wake spray */}
    <path d="M0 38 Q4 34, 8 38 Q12 42, 16 38" stroke="#93C5FD" strokeWidth="1.5" fill="none" opacity="0.5" />
    {/* Water */}
    <path d="M0 44 Q12 40, 24 44 Q36 48, 48 44 Q56 40, 64 44" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_sailboat — เรือใบ : classic sailboat */
export const BoatSailboatIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    {/* Hull */}
    <path d="M10 32 L16 42 L48 42 L54 32 Z" fill="#1E3A5F" />
    <path d="M10 32 L16 42 L32 42 L24 32 Z" fill="#2563EB" opacity="0.4" />
    {/* Mast */}
    <rect x="30" y="4" width="2" height="30" fill="#78350F" />
    {/* Main sail */}
    <path d="M32 4 L52 28 L32 32 Z" fill="white" />
    <path d="M32 4 L52 28 L32 32 Z" fill="#F1F5F9" opacity="0.5" />
    {/* Jib sail */}
    <path d="M30 6 L14 28 L30 30 Z" fill="#E2E8F0" />
    {/* Boom */}
    <path d="M32 30 L52 28" stroke="#92400E" strokeWidth="1.5" />
    {/* Flag */}
    <path d="M32 4 L38 2 L32 0" fill="#EF4444" />
    {/* Porthole */}
    <circle cx="32" cy="36" r="2" fill="#38BDF8" opacity="0.5" />
    {/* Water */}
    <path d="M0 46 Q10 42, 20 46 Q30 50, 42 46 Q52 42, 64 46" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_cabin_cruiser — เรือห้องนอน : cabin cruiser with sleeping quarters */
export const BoatCabinCruiserIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="cc1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1E3A5F" />
        <stop offset="100%" stopColor="#0C4A6E" />
      </linearGradient>
    </defs>
    {/* Hull */}
    <path d="M4 30 L12 42 L52 42 L60 30 Z" fill="url(#cc1)" />
    <path d="M4 30 L12 42 L32 42 L24 30 Z" fill="#2563EB" opacity="0.3" />
    {/* Cabin (large) */}
    <rect x="14" y="16" width="28" height="16" rx="3" fill="#0F172A" />
    <rect x="44" y="20" width="10" height="12" rx="2" fill="#1E293B" />
    {/* Windows */}
    <rect x="16" y="18" width="6" height="5" rx="1" fill="#FDE68A" opacity="0.6" />
    <rect x="24" y="18" width="6" height="5" rx="1" fill="#FDE68A" opacity="0.6" />
    <rect x="32" y="18" width="6" height="5" rx="1" fill="#FDE68A" opacity="0.6" />
    <rect x="46" y="22" width="6" height="4" rx="1" fill="#93C5FD" opacity="0.5" />
    {/* Roof */}
    <rect x="12" y="14" width="30" height="3" rx="1" fill="#1E293B" />
    {/* Railing */}
    <path d="M8 30 L12 30" stroke="#94A3B8" strokeWidth="1" />
    <path d="M52 30 L56 30" stroke="#94A3B8" strokeWidth="1" />
    {/* Antenna */}
    <path d="M28 14 L28 8" stroke="#94A3B8" strokeWidth="1" />
    <circle cx="28" cy="8" r="1" fill="#EF4444" />
    {/* Water */}
    <path d="M0 46 Q12 42, 24 46 Q36 50, 48 46 Q56 42, 64 46" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_trawler — เรืออวนลาก : trawler with fishing nets */
export const BoatTrawlerIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    {/* Hull (bulky) */}
    <path d="M4 28 L10 42 L54 42 L60 28 Z" fill="#0369A1" />
    <path d="M4 28 L10 42 L32 42 L20 28 Z" fill="#0284C7" opacity="0.4" />
    {/* Cabin */}
    <rect x="12" y="14" width="18" height="16" rx="2" fill="#0C4A6E" />
    <rect x="14" y="16" width="6" height="5" rx="1" fill="#FDE68A" opacity="0.5" />
    <rect x="22" y="16" width="6" height="5" rx="1" fill="#FDE68A" opacity="0.5" />
    {/* Crane/boom for nets */}
    <path d="M34 14 L34 4 L56 12" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    <path d="M34 4 L46 24" stroke="#64748B" strokeWidth="1.5" />
    {/* Net lines */}
    <path d="M56 12 L52 28" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="2,2" />
    <path d="M56 12 L48 28" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="2,2" />
    <path d="M56 12 L44 28" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="2,2" />
    {/* Smokestack */}
    <rect x="18" y="8" width="4" height="8" fill="#374151" />
    <ellipse cx="20" cy="6" rx="3" ry="2" fill="#6B7280" opacity="0.5" />
    {/* Water */}
    <path d="M0 46 Q12 42, 24 46 Q36 50, 48 46 Q56 42, 64 46" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_yacht_small — เรือยอทช์เล็ก : small luxury yacht */
export const BoatYachtSmallIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="ys1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
    </defs>
    {/* Sleek hull */}
    <path d="M2 30 Q8 38, 32 40 Q56 38, 62 30 L56 26 Q32 22, 8 26 Z" fill="url(#ys1)" />
    <path d="M2 30 Q8 38, 32 40 Q32 36, 8 30 Z" fill="#CBD5E1" opacity="0.4" />
    {/* Blue stripe */}
    <path d="M6 30 Q32 26, 58 30" stroke="#1D4ED8" strokeWidth="2" fill="none" />
    {/* Cabin */}
    <rect x="16" y="16" width="24" height="12" rx="3" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.5" />
    {/* Tinted windows */}
    <rect x="18" y="18" width="8" height="5" rx="1" fill="#0C4A6E" opacity="0.6" />
    <rect x="28" y="18" width="8" height="5" rx="1" fill="#0C4A6E" opacity="0.6" />
    {/* Upper deck */}
    <rect x="20" y="12" width="16" height="5" rx="2" fill="#E2E8F0" />
    {/* Antenna */}
    <path d="M32 12 L32 6" stroke="#94A3B8" strokeWidth="1" />
    <circle cx="32" cy="6" r="1" fill="#3B82F6" />
    {/* Railing */}
    <path d="M8 28 L16 28" stroke="#94A3B8" strokeWidth="0.8" />
    <path d="M40 28 L56 28" stroke="#94A3B8" strokeWidth="0.8" />
    {/* Water */}
    <path d="M0 44 Q12 40, 24 44 Q36 48, 48 44 Q56 40, 64 44" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_sport_fisher — เรือยอทช์ตกปลาสปอร์ต : sport fishing yacht */
export const BoatSportFisherIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="sf2" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>
    {/* Aggressive hull */}
    <path d="M2 28 Q6 38, 32 40 Q58 38, 62 28 L58 24 Q32 18, 6 24 Z" fill="url(#sf2)" />
    <path d="M4 30 Q32 24, 60 30" stroke="#3B82F6" strokeWidth="2" fill="none" />
    {/* Flybridge */}
    <rect x="14" y="8" width="22" height="8" rx="2" fill="#1E293B" stroke="#3B82F6" strokeWidth="0.5" />
    {/* Main cabin */}
    <rect x="12" y="16" width="26" height="10" rx="2" fill="#0F172A" />
    <rect x="14" y="18" width="6" height="4" rx="1" fill="#60A5FA" opacity="0.5" />
    <rect x="22" y="18" width="6" height="4" rx="1" fill="#60A5FA" opacity="0.5" />
    <rect x="30" y="18" width="6" height="4" rx="1" fill="#60A5FA" opacity="0.5" />
    {/* Tuna tower */}
    <path d="M40 16 L40 2 L44 2 L44 16" stroke="#64748B" strokeWidth="1" fill="none" />
    <path d="M38 2 L46 2" stroke="#64748B" strokeWidth="1.5" />
    {/* Outriggers */}
    <path d="M42 6 L56 14" stroke="#94A3B8" strokeWidth="0.8" />
    <path d="M42 6 L28 14" stroke="#94A3B8" strokeWidth="0.8" />
    {/* Rod holders on stern */}
    <path d="M48 22 L50 12" stroke="#FBBF24" strokeWidth="1" strokeLinecap="round" />
    <path d="M52 22 L54 12" stroke="#FBBF24" strokeWidth="1" strokeLinecap="round" />
    {/* Stern platform */}
    <rect x="42" y="26" width="14" height="4" rx="1" fill="#1E293B" />
    {/* Water */}
    <path d="M0 44 Q12 40, 24 44 Q36 48, 48 44 Q56 40, 64 44" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_catamaran — เรือแคทามารันหรู : luxury catamaran */
export const BoatCatamaranIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="ct1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
    </defs>
    {/* Twin hulls */}
    <path d="M4 30 Q8 38, 24 40 L24 34 Q8 32, 4 30 Z" fill="#0C4A6E" />
    <path d="M40 30 Q44 38, 60 40 L60 34 Q44 32, 40 30 Z" fill="#0C4A6E" />
    {/* Bridge deck */}
    <rect x="8" y="20" width="48" height="12" rx="3" fill="url(#ct1)" />
    {/* Cabin */}
    <rect x="14" y="12" width="28" height="10" rx="3" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.5" />
    {/* Panoramic windows */}
    <rect x="16" y="14" width="10" height="4" rx="1" fill="#0C4A6E" opacity="0.5" />
    <rect x="28" y="14" width="10" height="4" rx="1" fill="#0C4A6E" opacity="0.5" />
    {/* Upper deck */}
    <rect x="18" y="8" width="20" height="5" rx="2" fill="#E2E8F0" />
    {/* Solar panels hint */}
    <rect x="20" y="9" width="6" height="3" rx="0.5" fill="#1E40AF" opacity="0.3" />
    <rect x="28" y="9" width="6" height="3" rx="0.5" fill="#1E40AF" opacity="0.3" />
    {/* Trampoline nets between hulls */}
    <path d="M24 32 L40 32" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="2,1" />
    <path d="M24 35 L40 35" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="2,1" />
    <path d="M24 38 L40 38" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="2,1" />
    {/* Water */}
    <path d="M0 44 Q12 40, 24 44 Q36 48, 48 44 Q56 40, 64 44" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_mega_yacht — เมก้าเบอร์ยอทช์ : mega yacht */
export const BoatMegaYachtIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="my2" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="50%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>
    </defs>
    {/* Massive hull */}
    <path d="M0 30 Q6 40, 32 42 Q58 40, 64 30 L60 24 Q32 18, 4 24 Z" fill="url(#my2)" />
    {/* Gold accent stripe */}
    <path d="M4 30 Q32 24, 60 30" stroke="#FBBF24" strokeWidth="2" fill="none" />
    {/* Deck 1 */}
    <rect x="8" y="18" width="48" height="8" rx="2" fill="#0F172A" />
    {/* Deck 2 */}
    <rect x="12" y="12" width="36" height="7" rx="2" fill="#1E293B" />
    {/* Deck 3 (sundeck) */}
    <rect x="18" y="7" width="24" height="6" rx="2" fill="#334155" />
    {/* Windows rows */}
    {[0, 1, 2, 3, 4, 5].map(i => (
      <rect key={`w1${i}`} x={12 + i * 7} y="20" width="4" height="3" rx="0.5" fill="#FDE68A" opacity="0.5" />
    ))}
    {[0, 1, 2, 3].map(i => (
      <rect key={`w2${i}`} x={16 + i * 8} y="14" width="5" height="3" rx="0.5" fill="#93C5FD" opacity="0.4" />
    ))}
    {/* Radar dome */}
    <circle cx="32" cy="5" r="3" fill="#475569" />
    <path d="M32 5 L32 2" stroke="#94A3B8" strokeWidth="1" />
    {/* Helipad hint */}
    <circle cx="50" cy="10" r="4" fill="none" stroke="#64748B" strokeWidth="0.5" />
    <path d="M48 10 L52 10 M50 8 L50 12" stroke="#64748B" strokeWidth="0.5" />
    {/* Water */}
    <path d="M0 46 Q12 42, 24 46 Q36 50, 48 46 Q56 42, 64 46" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_super_yacht — ซูเปอร์ยอทช์ : futuristic super yacht */
export const BoatSuperYachtIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="sy1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="50%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      <linearGradient id="sy2" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1E3A5F" />
        <stop offset="100%" stopColor="#0C4A6E" />
      </linearGradient>
    </defs>
    {/* Futuristic hull */}
    <path d="M0 28 Q4 38, 32 42 Q60 38, 64 28 L60 22 Q32 16, 4 22 Z" fill="url(#sy2)" />
    {/* Superstructure — flowing curves */}
    <path d="M6 24 Q10 14, 24 12 L48 12 Q56 14, 58 24 Z" fill="url(#sy1)" />
    <path d="M12 20 Q16 10, 28 8 L44 8 Q52 10, 54 20 Z" fill="#F1F5F9" />
    {/* Tinted panoramic windows */}
    <path d="M16 18 Q24 12, 40 12 Q50 14, 52 20 L16 20 Z" fill="#0C4A6E" opacity="0.4" />
    {/* Gold accent */}
    <path d="M4 28 Q32 22, 60 28" stroke="#FBBF24" strokeWidth="1.5" fill="none" />
    {/* Upper observation deck */}
    <rect x="22" y="4" width="16" height="5" rx="2" fill="#E2E8F0" />
    <rect x="24" y="5" width="4" height="3" rx="0.5" fill="#0C4A6E" opacity="0.4" />
    <rect x="30" y="5" width="4" height="3" rx="0.5" fill="#0C4A6E" opacity="0.4" />
    {/* Mast */}
    <path d="M36 4 L36 0" stroke="#94A3B8" strokeWidth="1" />
    <circle cx="36" cy="0" r="1" fill="#3B82F6" />
    {/* Pool on back deck */}
    <ellipse cx="52" cy="22" rx="5" ry="2" fill="#38BDF8" opacity="0.4" />
    {/* Water */}
    <path d="M0 46 Q12 42, 24 46 Q36 50, 48 46 Q56 42, 64 46" stroke="#38BDF8" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

/** boat_golden_ship — เรือมังกรทอง : golden dragon ship — ultimate legendary */
export const BoatGoldenShipIcon = ({ className, style }: IconProps) => (
  <svg viewBox="0 0 64 48" fill="none" className={className} style={style}>
    <defs>
      <linearGradient id="gs1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#92400E" />
        <stop offset="25%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#FCD34D" />
        <stop offset="75%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <filter id="gs_glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Golden glow */}
    <path d="M0 28 Q8 40, 32 42 Q56 40, 64 28" stroke="#FCD34D" strokeWidth="6" opacity="0.2" filter="url(#gs_glow)" fill="none" />
    {/* Hull */}
    <path d="M4 28 L10 40 L54 40 L60 28 Z" fill="url(#gs1)" />
    <path d="M4 28 L10 40 L32 40 L22 28 Z" fill="#FBBF24" opacity="0.3" />
    {/* Dragon figurehead at bow */}
    <circle cx="6" cy="24" r="4" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
    <circle cx="4" cy="22" r="1" fill="#EF4444" />
    <circle cx="8" cy="22" r="1" fill="#EF4444" />
    <path d="M2 26 L0 28" stroke="#B45309" strokeWidth="1" />
    <path d="M10 26 L12 28" stroke="#B45309" strokeWidth="1" />
    {/* Pagoda-style cabin */}
    <rect x="18" y="14" width="24" height="16" rx="2" fill="#B45309" />
    <path d="M14 14 L30 6 L46 14 Z" fill="#DC2626" />
    <path d="M16 6 L30 0 L44 6 Z" fill="#EF4444" />
    {/* Cabin windows */}
    <rect x="22" y="18" width="6" height="5" rx="1" fill="#FDE68A" opacity="0.7" />
    <rect x="32" y="18" width="6" height="5" rx="1" fill="#FDE68A" opacity="0.7" />
    {/* Golden ornaments */}
    <circle cx="30" cy="3" r="2" fill="#FCD34D" />
    <path d="M28 3 L30 1 L32 3" stroke="#FBBF24" strokeWidth="0.8" fill="none" />
    {/* Dragon scales on hull */}
    <path d="M16 32 Q20 30, 24 32 Q28 34, 32 32 Q36 30, 40 32 Q44 34, 48 32" stroke="#B45309" strokeWidth="0.8" fill="none" opacity="0.5" />
    {/* Sparkles */}
    <circle cx="52" cy="20" r="1" fill="white" opacity="0.9" />
    <circle cx="14" cy="30" r="0.8" fill="white" opacity="0.7" />
    <circle cx="42" cy="12" r="0.8" fill="white" opacity="0.8" />
    <circle cx="8" cy="18" r="0.6" fill="#FCD34D" opacity="0.6" />
    {/* Water */}
    <path d="M0 44 Q12 40, 24 44 Q36 48, 48 44 Q56 40, 64 44" stroke="#FBBF24" strokeWidth="1.5" fill="none" opacity="0.4" />
  </svg>
);

// ════════════════════════════════════════════════════════════════════════════
//  ID → Component Lookup Maps
// ════════════════════════════════════════════════════════════════════════════

export const ROD_ICONS: Record<string, React.FC<IconProps>> = {
  rod_bamboo: RodBambooIcon,
  rod_wooden: RodWoodenIcon,
  rod_basic_fiberglass: RodFiberglassIcon,
  rod_carbon: RodCarbonIcon,
  rod_spinning: RodSpinningIcon,
  rod_baitcasting: RodBaitcastingIcon,
  rod_telescopic: RodTelescopicIcon,
  rod_fly: RodFlyIcon,
  rod_surf: RodSurfIcon,
  rod_pro_carbon: RodProCarbonIcon,
  rod_titanium: RodTitaniumIcon,
  rod_deep_sea: RodDeepSeaIcon,
  rod_master: RodMasterIcon,
  rod_golden: RodGoldenIcon,
};

export const BAIT_ICONS: Record<string, React.FC<IconProps>> = {
  bait_worm: BaitWormIcon,
  bait_bread: BaitBreadIcon,
  bait_corn: BaitCornIcon,
  bait_shrimp: BaitShrimpIcon,
  bait_minnow: BaitMinnowIcon,
  bait_cricket: BaitCricketIcon,
  bait_squid: BaitSquidIcon,
  bait_crab: BaitCrabIcon,
  bait_frog: BaitFrogIcon,
  bait_lure_legendary: BaitLureLegendaryIcon,
  bait_octopus: BaitOctopusIcon,
  bait_special_blend: BaitSpecialBlendIcon,
  bait_golden: BaitGoldenIcon,
  bait_mystical: BaitMysticalIcon,
};

export const BOAT_ICONS: Record<string, React.FC<IconProps>> = {
  boat_raft: BoatRaftIcon,
  boat_canoe: BoatCanoeIcon,
  boat_kayak: BoatKayakIcon,
  boat_fishing_boat: BoatFishingBoatIcon,
  boat_speedboat: BoatSpeedboatIcon,
  boat_sailboat: BoatSailboatIcon,
  boat_cabin_cruiser: BoatCabinCruiserIcon,
  boat_trawler: BoatTrawlerIcon,
  boat_yacht_small: BoatYachtSmallIcon,
  boat_sport_fisher: BoatSportFisherIcon,
  boat_catamaran: BoatCatamaranIcon,
  boat_mega_yacht: BoatMegaYachtIcon,
  boat_super_yacht: BoatSuperYachtIcon,
  boat_golden_ship: BoatGoldenShipIcon,
};

/** Render the correct unique icon for any shop item by type + id */
export const ShopItemIcon = ({
  type,
  itemId,
  className,
  style,
}: {
  type: 'rod' | 'bait' | 'boat';
  itemId: string;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const map = type === 'rod' ? ROD_ICONS : type === 'bait' ? BAIT_ICONS : BOAT_ICONS;
  const Icon = map[itemId];
  if (!Icon) return null;
  return <Icon className={className} style={style} />;
};
