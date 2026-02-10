// Coach Avatar SVG Components
// Unique avatars for each coach with different styles

import { cn } from '@/lib/utils';

interface AvatarProps {
  className?: string;
  size?: number;
}

// Female Coach Avatar - Nana (Cheerful)
export const NanaAvatar = ({ className, size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Background circle */}
    <circle cx="50" cy="50" r="48" fill="#FFE4EC"/>
    {/* Hair */}
    <ellipse cx="50" cy="35" rx="30" ry="25" fill="#4A3728"/>
    <ellipse cx="50" cy="55" rx="28" ry="20" fill="#4A3728"/>
    {/* Face */}
    <ellipse cx="50" cy="50" rx="22" ry="24" fill="#FFDBB4"/>
    {/* Bangs */}
    <path d="M28 35 Q35 20 50 25 Q65 20 72 35 Q65 32 50 35 Q35 32 28 35Z" fill="#4A3728"/>
    {/* Eyes */}
    <ellipse cx="40" cy="48" rx="4" ry="5" fill="#2D2D2D"/>
    <ellipse cx="60" cy="48" rx="4" ry="5" fill="#2D2D2D"/>
    <circle cx="41" cy="47" r="1.5" fill="white"/>
    <circle cx="61" cy="47" r="1.5" fill="white"/>
    {/* Eyebrows */}
    <path d="M35 42 Q40 40 45 42" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
    <path d="M55 42 Q60 40 65 42" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
    {/* Smile */}
    <path d="M40 58 Q50 66 60 58" stroke="#E88B8B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* Blush */}
    <ellipse cx="35" cy="55" rx="4" ry="2" fill="#FFB6C1" opacity="0.6"/>
    <ellipse cx="65" cy="55" rx="4" ry="2" fill="#FFB6C1" opacity="0.6"/>
    {/* Hair accessories - Ponytails */}
    <circle cx="22" cy="45" r="8" fill="#4A3728"/>
    <circle cx="78" cy="45" r="8" fill="#4A3728"/>
    {/* Pink ribbons */}
    <circle cx="22" cy="38" r="4" fill="#FF6B9D"/>
    <circle cx="78" cy="38" r="4" fill="#FF6B9D"/>
  </svg>
);

// Female Coach Avatar - Farsai (Gentle)
export const FarsaiAvatar = ({ className, size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="48" fill="#E8F4F8"/>
    {/* Long hair */}
    <ellipse cx="50" cy="50" rx="35" ry="35" fill="#2D1810"/>
    <ellipse cx="50" cy="65" rx="30" ry="25" fill="#2D1810"/>
    {/* Face */}
    <ellipse cx="50" cy="48" rx="20" ry="22" fill="#FFDBB4"/>
    {/* Gentle eyes */}
    <path d="M38 48 Q42 52 46 48" stroke="#2D2D2D" strokeWidth="2" fill="none"/>
    <path d="M54 48 Q58 52 62 48" stroke="#2D2D2D" strokeWidth="2" fill="none"/>
    {/* Soft eyebrows */}
    <path d="M36 43 Q42 41 47 43" stroke="#2D1810" strokeWidth="1" fill="none"/>
    <path d="M53 43 Q58 41 64 43" stroke="#2D1810" strokeWidth="1" fill="none"/>
    {/* Gentle smile */}
    <path d="M44 56 Q50 60 56 56" stroke="#D4A5A5" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Blush */}
    <ellipse cx="36" cy="52" rx="3" ry="2" fill="#FFD4D4" opacity="0.5"/>
    <ellipse cx="64" cy="52" rx="3" ry="2" fill="#FFD4D4" opacity="0.5"/>
    {/* Hair clip */}
    <circle cx="28" cy="40" r="4" fill="#87CEEB"/>
  </svg>
);

// Female Coach Avatar - Prim (Professional)
export const PrimAvatar = ({ className, size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="48" fill="#F5E6F0"/>
    {/* Professional bob haircut */}
    <path d="M20 45 Q20 25 50 22 Q80 25 80 45 L78 65 Q75 70 50 72 Q25 70 22 65 Z" fill="#1A1A1A"/>
    {/* Face */}
    <ellipse cx="50" cy="48" rx="21" ry="23" fill="#FFE0BD"/>
    {/* Confident eyes */}
    <ellipse cx="40" cy="46" rx="4" ry="4" fill="#2D2D2D"/>
    <ellipse cx="60" cy="46" rx="4" ry="4" fill="#2D2D2D"/>
    <circle cx="41" cy="45" r="1.2" fill="white"/>
    <circle cx="61" cy="45" r="1.2" fill="white"/>
    {/* Sharp eyebrows */}
    <path d="M34 40 L45 39" stroke="#1A1A1A" strokeWidth="2" fill="none"/>
    <path d="M55 39 L66 40" stroke="#1A1A1A" strokeWidth="2" fill="none"/>
    {/* Professional smile */}
    <path d="M42 56 Q50 60 58 56" stroke="#C88B8B" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Glasses */}
    <circle cx="40" cy="46" r="8" stroke="#9B59B6" strokeWidth="2" fill="none"/>
    <circle cx="60" cy="46" r="8" stroke="#9B59B6" strokeWidth="2" fill="none"/>
    <line x1="48" y1="46" x2="52" y2="46" stroke="#9B59B6" strokeWidth="2"/>
  </svg>
);

// Female Coach Avatar - Mint (Strict)
export const MintAvatar = ({ className, size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="48" fill="#FFE8E8"/>
    {/* Tight ponytail hair */}
    <ellipse cx="50" cy="32" rx="25" ry="18" fill="#8B4513"/>
    <ellipse cx="75" cy="25" rx="12" ry="8" fill="#8B4513"/>
    {/* Face */}
    <ellipse cx="50" cy="50" rx="22" ry="24" fill="#FFE0BD"/>
    {/* Serious eyes */}
    <ellipse cx="40" cy="48" rx="4" ry="3" fill="#2D2D2D"/>
    <ellipse cx="60" cy="48" rx="4" ry="3" fill="#2D2D2D"/>
    <circle cx="41" cy="47" r="1" fill="white"/>
    <circle cx="61" cy="47" r="1" fill="white"/>
    {/* Determined eyebrows */}
    <path d="M34 42 L46 44" stroke="#8B4513" strokeWidth="2" fill="none"/>
    <path d="M54 44 L66 42" stroke="#8B4513" strokeWidth="2" fill="none"/>
    {/* Firm mouth */}
    <line x1="42" y1="58" x2="58" y2="58" stroke="#C88B8B" strokeWidth="2" strokeLinecap="round"/>
    {/* Headband */}
    <rect x="25" y="30" width="50" height="6" rx="3" fill="#E74C3C"/>
  </svg>
);

// Male Coach Avatar - Poom (Friendly)
export const PoomAvatar = ({ className, size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="48" fill="#E3F2FD"/>
    {/* Short hair */}
    <ellipse cx="50" cy="35" rx="28" ry="22" fill="#3E2723"/>
    {/* Face */}
    <ellipse cx="50" cy="52" rx="24" ry="26" fill="#FFDBB4"/>
    {/* Friendly eyes */}
    <ellipse cx="40" cy="50" rx="4" ry="4" fill="#2D2D2D"/>
    <ellipse cx="60" cy="50" rx="4" ry="4" fill="#2D2D2D"/>
    <circle cx="41" cy="49" r="1.5" fill="white"/>
    <circle cx="61" cy="49" r="1.5" fill="white"/>
    {/* Casual eyebrows */}
    <path d="M34 44 Q40 42 46 44" stroke="#3E2723" strokeWidth="1.5" fill="none"/>
    <path d="M54 44 Q60 42 66 44" stroke="#3E2723" strokeWidth="1.5" fill="none"/>
    {/* Friendly smile */}
    <path d="M40 60 Q50 68 60 60" stroke="#D4A5A5" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* Jawline */}
    <path d="M26 50 Q26 75 50 78 Q74 75 74 50" stroke="#E8C5A8" strokeWidth="2" fill="none"/>
  </svg>
);

// Male Coach Avatar - Ton (Intense)
export const TonAvatar = ({ className, size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="48" fill="#ECEFF1"/>
    {/* Military short hair */}
    <ellipse cx="50" cy="35" rx="26" ry="18" fill="#1A1A1A"/>
    {/* Face */}
    <ellipse cx="50" cy="52" rx="24" ry="26" fill="#D7A574"/>
    {/* Intense eyes */}
    <ellipse cx="40" cy="48" rx="4" ry="3" fill="#2D2D2D"/>
    <ellipse cx="60" cy="48" rx="4" ry="3" fill="#2D2D2D"/>
    <circle cx="41" cy="47" r="1" fill="white"/>
    <circle cx="61" cy="47" r="1" fill="white"/>
    {/* Strong eyebrows */}
    <path d="M32 42 L47 44" stroke="#1A1A1A" strokeWidth="3" fill="none"/>
    <path d="M53 44 L68 42" stroke="#1A1A1A" strokeWidth="3" fill="none"/>
    {/* Stern expression */}
    <line x1="42" y1="60" x2="58" y2="60" stroke="#8B6F5C" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Strong jaw */}
    <path d="M24 48 Q24 75 50 80 Q76 75 76 48" stroke="#C49A6C" strokeWidth="3" fill="none"/>
    {/* Scar */}
    <line x1="65" y1="55" x2="72" y2="60" stroke="#B8A090" strokeWidth="1.5"/>
  </svg>
);

// Male Coach Avatar - Bank (Chill)
export const BankAvatar = ({ className, size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="48" fill="#E0F2F1"/>
    {/* Messy hair */}
    <ellipse cx="50" cy="33" rx="28" ry="20" fill="#5D4037"/>
    <path d="M30 28 Q35 20 45 25" stroke="#5D4037" strokeWidth="8" fill="none"/>
    <path d="M55 25 Q65 20 70 28" stroke="#5D4037" strokeWidth="8" fill="none"/>
    {/* Face */}
    <ellipse cx="50" cy="52" rx="23" ry="25" fill="#FFDBB4"/>
    {/* Relaxed eyes */}
    <path d="M36 50 Q40 52 44 50" stroke="#2D2D2D" strokeWidth="2" fill="none"/>
    <path d="M56 50 Q60 52 64 50" stroke="#2D2D2D" strokeWidth="2" fill="none"/>
    {/* Chill eyebrows */}
    <path d="M35 45 Q40 44 45 45" stroke="#5D4037" strokeWidth="1.5" fill="none"/>
    <path d="M55 45 Q60 44 65 45" stroke="#5D4037" strokeWidth="1.5" fill="none"/>
    {/* Relaxed smile */}
    <path d="M42 58 Q50 64 58 58" stroke="#D4A5A5" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Headphones */}
    <path d="M22 45 Q15 45 15 55 Q15 65 22 65" stroke="#1ABC9C" strokeWidth="4" fill="none"/>
    <path d="M78 45 Q85 45 85 55 Q85 65 78 65" stroke="#1ABC9C" strokeWidth="4" fill="none"/>
    <path d="M20 40 Q20 20 50 18 Q80 20 80 40" stroke="#1ABC9C" strokeWidth="3" fill="none"/>
  </svg>
);

// Male Coach Avatar - Kai (Humorous)
export const KaiAvatar = ({ className, size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="48" fill="#FFF8E1"/>
    {/* Spiky hair */}
    <path d="M25 40 L35 20 L45 35 L50 15 L55 35 L65 20 L75 40" fill="#4A3728"/>
    <ellipse cx="50" cy="42" rx="27" ry="18" fill="#4A3728"/>
    {/* Face */}
    <ellipse cx="50" cy="52" rx="23" ry="25" fill="#FFDBB4"/>
    {/* Playful winking eye */}
    <ellipse cx="40" cy="50" rx="4" ry="4" fill="#2D2D2D"/>
    <circle cx="41" cy="49" r="1.5" fill="white"/>
    <path d="M56 48 L64 52" stroke="#2D2D2D" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Fun eyebrows */}
    <path d="M35 44 Q40 41 46 44" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
    <path d="M54 44 Q60 41 66 44" stroke="#4A3728" strokeWidth="1.5" fill="none"/>
    {/* Big grin */}
    <path d="M38 58 Q50 70 62 58" stroke="#D4A5A5" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M40 60 Q50 66 60 60" fill="white"/>
    {/* Tongue */}
    <ellipse cx="50" cy="63" rx="4" ry="3" fill="#FF9999"/>
  </svg>
);

// Map coach ID to avatar component
export const CoachAvatarMap: Record<string, React.FC<AvatarProps>> = {
  'coach-nana': NanaAvatar,
  'coach-farsai': FarsaiAvatar,
  'coach-prim': PrimAvatar,
  'coach-mint': MintAvatar,
  'coach-poom': PoomAvatar,
  'coach-ton': TonAvatar,
  'coach-bank': BankAvatar,
  'coach-kai': KaiAvatar,
};

// Get avatar component by coach ID
export const getCoachAvatar = (coachId: string): React.FC<AvatarProps> => {
  return CoachAvatarMap[coachId] || NanaAvatar;
};
