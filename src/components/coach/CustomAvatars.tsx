// Custom Coach Avatar SVGs - Selectable styles for user-created coaches
import { CustomAvatarId } from '@/lib/coachConfig';

interface AvatarProps {
  className?: string;
  size?: number;
}

// Female: Sporty Girl - ponytail, headband, athletic top
const SportyFemaleAvatar = ({ size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#FFE4EC"/>
    {/* Ponytail hair */}
    <ellipse cx="50" cy="34" rx="26" ry="20" fill="#8B4513"/>
    <ellipse cx="72" cy="28" rx="14" ry="10" fill="#8B4513"/>
    <ellipse cx="80" cy="35" rx="8" ry="6" fill="#8B4513"/>
    {/* Face */}
    <ellipse cx="50" cy="50" rx="22" ry="24" fill="#FFDBB4"/>
    {/* Headband */}
    <rect x="26" y="32" width="48" height="5" rx="2.5" fill="#FF6B9D"/>
    {/* Eyes - determined */}
    <ellipse cx="40" cy="48" rx="3.5" ry="4" fill="#2D2D2D"/>
    <ellipse cx="60" cy="48" rx="3.5" ry="4" fill="#2D2D2D"/>
    <circle cx="41" cy="47" r="1.2" fill="white"/>
    <circle cx="61" cy="47" r="1.2" fill="white"/>
    {/* Smile */}
    <path d="M42 58 Q50 65 58 58" stroke="#E88B8B" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Athletic top hint */}
    <path d="M32 74 Q50 78 68 74" stroke="#FF6B9D" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

// Female: Cute - round face, big eyes, bows
const CuteFemaleAvatar = ({ size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#FFF0F5"/>
    {/* Twin tails */}
    <ellipse cx="50" cy="36" rx="25" ry="18" fill="#5C3317"/>
    <ellipse cx="25" cy="50" rx="10" ry="14" fill="#5C3317"/>
    <ellipse cx="75" cy="50" rx="10" ry="14" fill="#5C3317"/>
    {/* Face */}
    <ellipse cx="50" cy="50" rx="21" ry="23" fill="#FFE4C4"/>
    {/* Big cute eyes */}
    <ellipse cx="40" cy="48" rx="5" ry="6" fill="#2D2D2D"/>
    <ellipse cx="60" cy="48" rx="5" ry="6" fill="#2D2D2D"/>
    <circle cx="42" cy="46" r="2" fill="white"/>
    <circle cx="62" cy="46" r="2" fill="white"/>
    {/* Star sparkles in eyes */}
    <circle cx="39" cy="50" r="1" fill="white"/>
    <circle cx="59" cy="50" r="1" fill="white"/>
    {/* Bows */}
    <path d="M20 38 L25 42 L30 38 L25 34Z" fill="#FF9CC2"/>
    <path d="M70 38 L75 42 L80 38 L75 34Z" fill="#FF9CC2"/>
    {/* Cute smile */}
    <path d="M44 57 Q50 63 56 57" stroke="#FF9CC2" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Blush */}
    <ellipse cx="34" cy="54" rx="4" ry="2.5" fill="#FFB6C1" opacity="0.5"/>
    <ellipse cx="66" cy="54" rx="4" ry="2.5" fill="#FFB6C1" opacity="0.5"/>
  </svg>
);

// Female: Cool Girl - short bob, sunglasses on head
const CoolFemaleAvatar = ({ size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#EDE7F6"/>
    {/* Short bob */}
    <path d="M22 42 Q22 22 50 20 Q78 22 78 42 L76 58 Q74 62 68 64 L32 64 Q26 62 24 58Z" fill="#1A1A2E"/>
    {/* Face */}
    <ellipse cx="50" cy="50" rx="22" ry="24" fill="#FFDBB4"/>
    {/* Cool eyes - half-lidded */}
    <path d="M36 48 Q40 46 44 48 Q40 50 36 48Z" fill="#2D2D2D"/>
    <path d="M56 48 Q60 46 64 48 Q60 50 56 48Z" fill="#2D2D2D"/>
    {/* Eyebrows - arched */}
    <path d="M35 43 L45 42" stroke="#1A1A2E" strokeWidth="2" fill="none"/>
    <path d="M55 42 L65 43" stroke="#1A1A2E" strokeWidth="2" fill="none"/>
    {/* Smirk */}
    <path d="M42 57 Q50 60 58 56" stroke="#C88B8B" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Sunglasses on head */}
    <path d="M28 32 Q50 28 72 32" stroke="#7C4DFF" strokeWidth="2.5" fill="none"/>
    <rect x="28" y="29" width="16" height="10" rx="5" stroke="#7C4DFF" strokeWidth="2" fill="#7C4DFF" opacity="0.3"/>
    <rect x="56" y="29" width="16" height="10" rx="5" stroke="#7C4DFF" strokeWidth="2" fill="#7C4DFF" opacity="0.3"/>
  </svg>
);

// Female: Elegant - long wavy hair, earrings
const ElegantFemaleAvatar = ({ size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#FCE4EC"/>
    {/* Long wavy hair */}
    <path d="M20 42 Q20 20 50 18 Q80 20 80 42 L82 70 Q78 80 50 82 Q22 80 18 70Z" fill="#4A2C2A"/>
    <path d="M22 55 Q18 65 22 75" stroke="#5C3D3D" strokeWidth="3" fill="none"/>
    <path d="M78 55 Q82 65 78 75" stroke="#5C3D3D" strokeWidth="3" fill="none"/>
    {/* Face */}
    <ellipse cx="50" cy="48" rx="21" ry="23" fill="#FFE4C4"/>
    {/* Elegant eyes */}
    <ellipse cx="40" cy="46" rx="4" ry="4" fill="#2D2D2D"/>
    <ellipse cx="60" cy="46" rx="4" ry="4" fill="#2D2D2D"/>
    <circle cx="41" cy="45" r="1.5" fill="white"/>
    <circle cx="61" cy="45" r="1.5" fill="white"/>
    {/* Long lashes */}
    <path d="M34 44 L36 42" stroke="#2D2D2D" strokeWidth="1"/>
    <path d="M64 42 L66 44" stroke="#2D2D2D" strokeWidth="1"/>
    {/* Lips */}
    <path d="M44 55 Q50 59 56 55" stroke="#E91E63" strokeWidth="2" fill="#E91E63" opacity="0.3" strokeLinecap="round"/>
    {/* Earrings */}
    <circle cx="26" cy="55" r="3" fill="#FFD700"/>
    <circle cx="74" cy="55" r="3" fill="#FFD700"/>
  </svg>
);

// Male: Sporty Boy - short hair, sweatband
const SportyMaleAvatar = ({ size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#E3F2FD"/>
    {/* Short sporty hair */}
    <ellipse cx="50" cy="34" rx="27" ry="20" fill="#3E2723"/>
    {/* Face */}
    <ellipse cx="50" cy="52" rx="24" ry="26" fill="#FFDBB4"/>
    {/* Sweatband */}
    <rect x="24" y="34" width="52" height="5" rx="2.5" fill="#2196F3"/>
    {/* Energetic eyes */}
    <ellipse cx="40" cy="50" rx="4" ry="4.5" fill="#2D2D2D"/>
    <ellipse cx="60" cy="50" rx="4" ry="4.5" fill="#2D2D2D"/>
    <circle cx="41" cy="49" r="1.5" fill="white"/>
    <circle cx="61" cy="49" r="1.5" fill="white"/>
    {/* Eyebrows */}
    <path d="M34 44 Q40 42 46 44" stroke="#3E2723" strokeWidth="2" fill="none"/>
    <path d="M54 44 Q60 42 66 44" stroke="#3E2723" strokeWidth="2" fill="none"/>
    {/* Big smile */}
    <path d="M40 60 Q50 68 60 60" stroke="#D4A5A5" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* Strong jaw */}
    <path d="M26 52 Q26 76 50 80 Q74 76 74 52" stroke="#E8C5A8" strokeWidth="2" fill="none"/>
  </svg>
);

// Male: Cool Boy - styled hair, piercing
const CoolMaleAvatar = ({ size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#ECEFF1"/>
    {/* Styled side-swept hair */}
    <ellipse cx="50" cy="34" rx="27" ry="20" fill="#212121"/>
    <path d="M25 34 Q30 20 50 22 Q60 18 55 32" fill="#212121"/>
    {/* Face */}
    <ellipse cx="50" cy="52" rx="23" ry="25" fill="#D7A574"/>
    {/* Half-lidded cool eyes */}
    <path d="M36 50 Q40 48 44 50 Q40 52 36 50Z" fill="#2D2D2D"/>
    <path d="M56 50 Q60 48 64 50 Q60 52 56 50Z" fill="#2D2D2D"/>
    {/* Sharp eyebrows */}
    <path d="M34 44 L46 43" stroke="#212121" strokeWidth="2.5" fill="none"/>
    <path d="M54 43 L66 44" stroke="#212121" strokeWidth="2.5" fill="none"/>
    {/* Slight smirk */}
    <path d="M42 60 Q50 63 58 59" stroke="#8B6F5C" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Earring */}
    <circle cx="24" cy="55" r="2.5" fill="#607D8B"/>
  </svg>
);

// Male: Strong - buzz cut, wide jaw, scar
const StrongMaleAvatar = ({ size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#FBE9E7"/>
    {/* Buzz cut */}
    <ellipse cx="50" cy="34" rx="28" ry="18" fill="#4E342E"/>
    {/* Face - wider, stronger */}
    <ellipse cx="50" cy="52" rx="26" ry="27" fill="#FFDBB4"/>
    {/* Intense eyes */}
    <ellipse cx="40" cy="48" rx="4" ry="3" fill="#2D2D2D"/>
    <ellipse cx="60" cy="48" rx="4" ry="3" fill="#2D2D2D"/>
    <circle cx="41" cy="47" r="1" fill="white"/>
    <circle cx="61" cy="47" r="1" fill="white"/>
    {/* Thick brows */}
    <path d="M32 42 L47 44" stroke="#4E342E" strokeWidth="3" fill="none"/>
    <path d="M53 44 L68 42" stroke="#4E342E" strokeWidth="3" fill="none"/>
    {/* Firm mouth */}
    <line x1="42" y1="60" x2="58" y2="60" stroke="#C49A6C" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Strong jaw */}
    <path d="M22 48 Q22 76 50 82 Q78 76 78 48" stroke="#E8C5A8" strokeWidth="3" fill="none"/>
    {/* Scar */}
    <line x1="66" y1="55" x2="73" y2="60" stroke="#C8B0A0" strokeWidth="1.5"/>
  </svg>
);

// Male: Chill - messy hair, headphones, relaxed eyes
const ChillMaleAvatar = ({ size = 80 }: AvatarProps) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#E8F5E9"/>
    {/* Messy hair */}
    <ellipse cx="50" cy="33" rx="27" ry="19" fill="#6D4C41"/>
    <path d="M30 28 Q36 18 46 26" stroke="#6D4C41" strokeWidth="7" fill="none"/>
    <path d="M54 26 Q64 18 70 28" stroke="#6D4C41" strokeWidth="7" fill="none"/>
    {/* Face */}
    <ellipse cx="50" cy="52" rx="23" ry="25" fill="#FFDBB4"/>
    {/* Relaxed eyes - closed/sleepy */}
    <path d="M36 50 Q40 53 44 50" stroke="#2D2D2D" strokeWidth="2" fill="none"/>
    <path d="M56 50 Q60 53 64 50" stroke="#2D2D2D" strokeWidth="2" fill="none"/>
    {/* Chill eyebrows */}
    <path d="M35 45 Q40 44 45 46" stroke="#6D4C41" strokeWidth="1.5" fill="none"/>
    <path d="M55 46 Q60 44 65 45" stroke="#6D4C41" strokeWidth="1.5" fill="none"/>
    {/* Relaxed smile */}
    <path d="M42 59 Q50 65 58 59" stroke="#D4A5A5" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Headphones */}
    <path d="M22 46 Q14 46 14 56 Q14 66 22 66" stroke="#4CAF50" strokeWidth="4" fill="none"/>
    <path d="M78 46 Q86 46 86 56 Q86 66 78 66" stroke="#4CAF50" strokeWidth="4" fill="none"/>
    <path d="M20 40 Q20 18 50 16 Q80 18 80 40" stroke="#4CAF50" strokeWidth="3" fill="none"/>
  </svg>
);

// Map avatar ID to component
const CUSTOM_AVATAR_MAP: Record<CustomAvatarId, React.FC<AvatarProps>> = {
  'avatar-sporty-f': SportyFemaleAvatar,
  'avatar-cute-f': CuteFemaleAvatar,
  'avatar-cool-f': CoolFemaleAvatar,
  'avatar-elegant-f': ElegantFemaleAvatar,
  'avatar-sporty-m': SportyMaleAvatar,
  'avatar-cool-m': CoolMaleAvatar,
  'avatar-strong-m': StrongMaleAvatar,
  'avatar-chill-m': ChillMaleAvatar,
};

export const getCustomAvatar = (avatarId: CustomAvatarId): React.FC<AvatarProps> => {
  return CUSTOM_AVATAR_MAP[avatarId] || SportyFemaleAvatar;
};

export default CUSTOM_AVATAR_MAP;
