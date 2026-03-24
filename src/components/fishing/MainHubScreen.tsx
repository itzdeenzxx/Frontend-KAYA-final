import { PlayerProgress } from '@/types/fishing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Coins, 
  ShoppingBag, 
  Trophy,
  Fish,
  ArrowLeft,
  Award,
  Anchor,
  Gauge,
  Weight,
  Zap,
} from 'lucide-react';
import { getRodById, getBaitById, getBoatById } from '@/lib/equipmentDatabase';
import { RARITY_COLORS, RARITY_NAMES_TH } from '@/types/fishing';
import {
  CloudIcon, RockIcon, CoralIcon, FishIcon as FishSvgIcon, TropicalFishIcon,
  PufferfishIcon, SharkIcon, BeachIcon, ShellIcon, StarFilledIcon,
  WoodLogIcon, PalmTreeIcon, TreeIcon, WaveIcon, ShipIcon,
  FishingRodIcon, SeagullIcon,
} from './FishingIcons';

// ============================================
// BOAT SVG COMPONENTS - Large detailed boats
// ============================================

interface BoatSvgProps {
  className?: string;
}

// Wooden Raft - simple flat raft
const RaftSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Raft logs */}
    <rect x="60" y="110" width="200" height="22" rx="8" fill="#92400E" />
    <rect x="60" y="90" width="200" height="22" rx="8" fill="#A0522D" />
    <rect x="60" y="130" width="200" height="22" rx="8" fill="#8B4513" />
    {/* Cross planks */}
    <rect x="90" y="82" width="16" height="78" rx="3" fill="#B8860B" opacity="0.6" />
    <rect x="210" y="82" width="16" height="78" rx="3" fill="#B8860B" opacity="0.6" />
    {/* Small pole */}
    <rect x="155" y="40" width="6" height="60" fill="#8B7355" />
    {/* Small flag */}
    <path d="M161 40 L190 52 L161 64 Z" fill="#D97706" opacity="0.9" />
  </svg>
);

// Canoe - sleek narrow boat
const CanoeSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Hull */}
    <path d="M30 120 Q40 145 160 150 Q280 145 290 120 Q280 135 160 140 Q40 135 30 120 Z" fill="#654321" />
    <path d="M30 120 Q40 100 160 95 Q280 100 290 120 Q280 115 160 110 Q40 115 30 120 Z" fill="#8B6914" />
    {/* Interior */}
    <ellipse cx="160" cy="118" rx="110" ry="15" fill="#A0522D" opacity="0.5" />
    {/* Seat */}
    <rect x="140" y="108" width="40" height="5" rx="2" fill="#654321" />
    {/* Paddle */}
    <line x1="190" y1="70" x2="240" y2="140" stroke="#8B7355" strokeWidth="4" strokeLinecap="round" />
    <ellipse cx="245" cy="145" rx="12" ry="18" fill="#A0522D" transform="rotate(20 245 145)" />
  </svg>
);

// Kayak - sport boat
const KayakSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Hull */}
    <path d="M15 115 Q30 140 160 145 Q290 140 305 115 Q290 130 160 135 Q30 130 15 115 Z" fill="#1D4ED8" />
    <path d="M15 115 Q30 95 160 90 Q290 95 305 115 Q290 108 160 103 Q30 108 15 115 Z" fill="#3B82F6" />
    {/* Stripe */}
    <path d="M40 115 Q50 105 160 100 Q270 105 280 115" stroke="#60A5FA" strokeWidth="3" fill="none" />
    {/* Cockpit */}
    <ellipse cx="160" cy="112" rx="35" ry="12" fill="#1E3A5F" />
    <ellipse cx="160" cy="112" rx="28" ry="8" fill="#0F172A" />
    {/* Paddle */}
    <line x1="120" y1="60" x2="200" y2="160" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="115" cy="55" rx="10" ry="16" fill="#CBD5E1" transform="rotate(-25 115 55)" />
    <ellipse cx="205" cy="164" rx="10" ry="16" fill="#CBD5E1" transform="rotate(-25 205 164)" />
  </svg>
);

// Fishing Boat - classic boat
const FishingBoatSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Hull */}
    <path d="M40 130 L60 165 L260 165 L280 130 Z" fill="#1E3A5F" />
    <path d="M40 130 L60 165 L160 165 L140 130 Z" fill="#2563EB" opacity="0.4" />
    {/* Deck */}
    <rect x="55" y="120" width="210" height="14" rx="3" fill="#334155" />
    {/* Cabin */}
    <rect x="80" y="80" width="80" height="42" rx="4" fill="#1E293B" />
    <rect x="88" y="88" width="18" height="14" rx="2" fill="#38BDF8" opacity="0.6" />
    <rect x="112" y="88" width="18" height="14" rx="2" fill="#38BDF8" opacity="0.6" />
    <rect x="136" y="88" width="18" height="14" rx="2" fill="#38BDF8" opacity="0.6" />
    {/* Mast */}
    <rect x="200" y="50" width="5" height="75" fill="#64748B" />
    {/* Antenna */}
    <line x1="202" y1="50" x2="215" y2="35" stroke="#94A3B8" strokeWidth="2" />
    <circle cx="215" cy="33" r="3" fill="#EF4444" />
    {/* Railing */}
    <line x1="60" y1="120" x2="60" y2="105" stroke="#94A3B8" strokeWidth="2" />
    <line x1="270" y1="120" x2="270" y2="105" stroke="#94A3B8" strokeWidth="2" />
    <line x1="60" y1="105" x2="270" y2="105" stroke="#94A3B8" strokeWidth="1.5" />
  </svg>
);

// Speedboat - fast and sleek
const SpeedboatSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Hull */}
    <path d="M25 125 Q40 160 160 165 Q270 162 295 130 L280 125 Q260 150 160 153 Q60 150 40 125 Z" fill="#DC2626" />
    <path d="M25 125 Q40 105 160 100 Q270 105 295 125 Q270 115 160 112 Q50 115 25 125 Z" fill="#EF4444" />
    {/* Racing stripe */}
    <path d="M50 125 Q60 115 160 110 Q260 115 275 125" stroke="white" strokeWidth="3" opacity="0.4" />
    {/* Windshield */}
    <path d="M120 95 L145 80 L175 80 L185 95 Z" fill="#38BDF8" opacity="0.7" />
    <path d="M120 95 L145 80 L150 80 L130 95 Z" fill="white" opacity="0.3" />
    {/* Driver seat */}
    <rect x="138" y="95" width="30" height="18" rx="3" fill="#1E293B" />
    {/* Engine mount */}
    <rect x="240" y="115" width="30" height="20" rx="2" fill="#374151" />
    <rect x="260" y="135" width="12" height="18" rx="1" fill="#6B7280" />
  </svg>
);

// Sailboat - elegant with sails
const SailboatSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Hull */}
    <path d="M50 140 L70 170 L250 170 L270 140 Z" fill="#1E3A5F" />
    <path d="M50 140 L70 170 L160 170 L140 140 Z" fill="#2563EB" opacity="0.3" />
    {/* Deck */}
    <rect x="65" y="132" width="190" height="10" rx="3" fill="#334155" />
    {/* Mast */}
    <rect x="155" y="25" width="5" height="112" fill="#92400E" />
    {/* Main sail */}
    <path d="M160 30 Q220 60 160 132" fill="white" />
    <path d="M160 30 Q190 60 160 132" fill="#F8FAFC" opacity="0.5" />
    {/* Front sail */}
    <path d="M155 35 Q100 70 80 132" fill="#E5E7EB" />
    <path d="M155 35 Q115 70 80 132" fill="white" opacity="0.3" />
    {/* Boom */}
    <line x1="160" y1="130" x2="250" y2="110" stroke="#92400E" strokeWidth="3" />
    {/* Flag */}
    <path d="M157 25 L157 15 L175 20 L157 25 Z" fill="#EF4444" />
  </svg>
);

// Cabin Cruiser - luxury mid-size
const CabinCruiserSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Hull */}
    <path d="M30 135 L55 170 L265 170 L290 135 Z" fill="#1E3A5F" />
    <path d="M30 135 L55 170 L160 170 L130 135 Z" fill="#60A5FA" opacity="0.15" />
    {/* Waterline */}
    <path d="M40 152 Q160 160 280 152" stroke="#3B82F6" strokeWidth="2" fill="none" opacity="0.5" />
    {/* Deck */}
    <rect x="50" y="125" width="225" height="14" rx="4" fill="#F8FAFC" />
    {/* Main cabin */}
    <rect x="70" y="82" width="130" height="46" rx="6" fill="white" />
    <rect x="70" y="82" width="130" height="8" rx="6" fill="#E2E8F0" />
    {/* Windows */}
    <rect x="80" y="95" width="22" height="16" rx="3" fill="#38BDF8" opacity="0.7" />
    <rect x="108" y="95" width="22" height="16" rx="3" fill="#38BDF8" opacity="0.7" />
    <rect x="136" y="95" width="22" height="16" rx="3" fill="#38BDF8" opacity="0.7" />
    <rect x="164" y="95" width="22" height="16" rx="3" fill="#38BDF8" opacity="0.7" />
    {/* Upper deck */}
    <rect x="80" y="68" width="90" height="18" rx="4" fill="#F1F5F9" />
    <rect x="80" y="68" width="90" height="5" rx="4" fill="#CBD5E1" />
    {/* Antenna */}
    <rect x="120" y="50" width="3" height="20" fill="#94A3B8" />
    <circle cx="121" cy="48" r="3" fill="#10B981" />
    {/* Railing */}
    <line x1="55" y1="125" x2="55" y2="112" stroke="#94A3B8" strokeWidth="1.5" />
    <line x1="275" y1="125" x2="275" y2="112" stroke="#94A3B8" strokeWidth="1.5" />
    <line x1="55" y1="112" x2="275" y2="112" stroke="#94A3B8" strokeWidth="1" />
  </svg>
);

// Trawler - heavy duty
const TrawlerSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Hull */}
    <path d="M25 140 L50 175 L270 175 L295 140 Z" fill="#374151" />
    <path d="M25 140 L50 175 L160 175 L130 140 Z" fill="#4B5563" opacity="0.3" />
    {/* Deck */}
    <rect x="45" y="128" width="230" height="16" rx="3" fill="#64748B" />
    {/* Main structure */}
    <rect x="60" y="80" width="110" height="50" rx="4" fill="#475569" />
    <rect x="60" y="80" width="110" height="10" rx="4" fill="#334155" />
    {/* Windows */}
    <rect x="70" y="95" width="16" height="12" rx="2" fill="#FBBF24" opacity="0.7" />
    <rect x="92" y="95" width="16" height="12" rx="2" fill="#FBBF24" opacity="0.7" />
    <rect x="114" y="95" width="16" height="12" rx="2" fill="#FBBF24" opacity="0.7" />
    <rect x="136" y="95" width="16" height="12" rx="2" fill="#FBBF24" opacity="0.7" />
    {/* Crane */}
    <rect x="210" y="60" width="8" height="72" fill="#6B7280" />
    <line x1="214" y1="62" x2="260" y2="90" stroke="#6B7280" strokeWidth="4" />
    <line x1="260" y1="90" x2="260" y2="125" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
    {/* Smokestack */}
    <rect x="140" y="60" width="14" height="25" rx="2" fill="#1F2937" />
    <ellipse cx="147" cy="55" rx="8" ry="4" fill="#9CA3AF" opacity="0.4" />
  </svg>
);

// Yacht - luxury
const YachtSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Hull */}
    <path d="M20 140 L50 175 L270 175 L300 140 Z" fill="#1E3A5F" />
    <path d="M35 155 Q160 165 285 155" stroke="#2563EB" strokeWidth="2" fill="none" opacity="0.4" />
    {/* Deck */}
    <rect x="45" y="128" width="235" height="16" rx="4" fill="#F8FAFC" />
    {/* Lower cabin */}
    <rect x="55" y="90" width="180" height="40" rx="6" fill="white" />
    {/* Lower windows */}
    {[0,1,2,3,4,5].map(i => (
      <rect key={i} x={65 + i * 28} y="100" width="18" height="14" rx="3" fill="#38BDF8" opacity="0.6" />
    ))}
    {/* Upper deck */}
    <rect x="65" y="62" width="140" height="32" rx="5" fill="#F1F5F9" />
    <rect x="65" y="62" width="140" height="6" rx="5" fill="#E2E8F0" />
    {/* Upper windows */}
    {[0,1,2,3].map(i => (
      <rect key={i} x={75 + i * 30} y="72" width="20" height="12" rx="2" fill="#38BDF8" opacity="0.5" />
    ))}
    {/* Radar dome */}
    <rect x="125" y="42" width="4" height="22" fill="#94A3B8" />
    <circle cx="127" cy="40" r="8" fill="#CBD5E1" />
    <circle cx="127" cy="40" r="5" fill="#94A3B8" />
    {/* Flag */}
    <path d="M252 90 L252 70 L270 78 L252 86 Z" fill="#3B82F6" />
    <rect x="250" y="70" width="4" height="58" fill="#94A3B8" />
  </svg>
);

// Sport Fisher Yacht
const SportFisherSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Hull - sleek */}
    <path d="M15 138 L45 172 L275 172 L305 138 Z" fill="#1E293B" />
    <path d="M25 155 Q160 168 295 155" stroke="#6366F1" strokeWidth="2" fill="none" opacity="0.5" />
    {/* Deck */}
    <rect x="40" y="125" width="245" height="16" rx="4" fill="#F1F5F9" />
    {/* Cabin */}
    <rect x="55" y="82" width="150" height="46" rx="6" fill="white" />
    {/* Tinted windows */}
    {[0,1,2,3,4].map(i => (
      <rect key={i} x={65 + i * 28} y="92" width="18" height="18" rx="3" fill="#1E293B" opacity="0.7" />
    ))}
    {/* Flying bridge */}
    <rect x="70" y="58" width="100" height="28" rx="5" fill="#E2E8F0" />
    <rect x="78" y="64" width="20" height="14" rx="2" fill="#38BDF8" opacity="0.5" />
    <rect x="104" y="64" width="20" height="14" rx="2" fill="#38BDF8" opacity="0.5" />
    {/* Tower */}
    <rect x="115" y="30" width="4" height="30" fill="#94A3B8" />
    <line x1="117" y1="32" x2="140" y2="50" stroke="#94A3B8" strokeWidth="1.5" />
    <line x1="117" y1="32" x2="95" y2="50" stroke="#94A3B8" strokeWidth="1.5" />
    {/* Fishing rod holders */}
    <line x1="230" y1="85" x2="250" y2="50" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
    <line x1="245" y1="85" x2="265" y2="50" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
    <line x1="260" y1="85" x2="280" y2="50" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
    {/* Trim */}
    <path d="M55 128 L55 118 Q160 112 260 118 L260 128" stroke="#6366F1" strokeWidth="2" fill="none" opacity="0.3" />
  </svg>
);

// Catamaran
const CatamaranSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Left hull */}
    <path d="M30 135 L45 170 L120 170 L130 135 Z" fill="#1E3A5F" />
    {/* Right hull */}
    <path d="M190 135 L200 170 L275 170 L290 135 Z" fill="#1E3A5F" />
    {/* Connecting deck */}
    <rect x="60" y="120" width="200" height="18" rx="4" fill="#F8FAFC" />
    {/* Cabin */}
    <rect x="90" y="78" width="140" height="44" rx="6" fill="white" />
    {/* Windows */}
    {[0,1,2,3,4].map(i => (
      <rect key={i} x={100 + i * 25} y="88" width="16" height="18" rx="3" fill="#38BDF8" opacity="0.6" />
    ))}
    {/* Upper deck */}
    <rect x="110" y="55" width="100" height="26" rx="5" fill="#F1F5F9" />
    {/* Mast */}
    <rect x="158" y="25" width="4" height="35" fill="#94A3B8" />
    <circle cx="160" cy="23" r="4" fill="#10B981" />
    {/* Nets/trampolines between hulls */}
    <rect x="70" y="138" width="50" height="6" rx="2" fill="#38BDF8" opacity="0.15" />
    <rect x="200" y="138" width="50" height="6" rx="2" fill="#38BDF8" opacity="0.15" />
  </svg>
);

// Mega Yacht
const MegaYachtSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Hull */}
    <path d="M10 140 L40 178 L280 178 L310 140 Z" fill="#0F172A" />
    <path d="M20 158 Q160 172 300 158" stroke="#3B82F6" strokeWidth="2" fill="none" opacity="0.3" />
    {/* Deck 1 */}
    <rect x="35" y="126" width="255" height="18" rx="4" fill="#F8FAFC" />
    {/* Deck 1 cabin */}
    <rect x="45" y="88" width="210" height="40" rx="6" fill="white" />
    {[0,1,2,3,4,5,6].map(i => (
      <rect key={i} x={55 + i * 28} y="98" width="18" height="16" rx="3" fill="#38BDF8" opacity="0.5" />
    ))}
    {/* Deck 2 */}
    <rect x="55" y="60" width="170" height="30" rx="5" fill="#F1F5F9" />
    {[0,1,2,3,4].map(i => (
      <rect key={i} x={65 + i * 32} y="67" width="20" height="14" rx="2" fill="#38BDF8" opacity="0.4" />
    ))}
    {/* Deck 3 - bridge */}
    <rect x="75" y="38" width="100" height="25" rx="4" fill="#E2E8F0" />
    <rect x="82" y="43" width="30" height="12" rx="2" fill="#0F172A" opacity="0.6" />
    {/* Radar */}
    <rect x="120" y="20" width="4" height="20" fill="#94A3B8" />
    <ellipse cx="122" cy="18" rx="12" ry="4" fill="#CBD5E1" />
    {/* Helipad marking */}
    <circle cx="260" cy="100" r="15" stroke="#94A3B8" strokeWidth="1.5" fill="none" opacity="0.4" />
    <text x="260" y="105" textAnchor="middle" fill="#94A3B8" fontSize="12" fontWeight="bold" opacity="0.4">H</text>
  </svg>
);

// Super Yacht - legendary
const SuperYachtSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    {/* Glow effect */}
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Hull */}
    <path d="M5 138 L35 180 L285 180 L315 138 Z" fill="#0F172A" />
    <path d="M15 158 Q160 175 305 158" stroke="#F59E0B" strokeWidth="2" fill="none" opacity="0.5" />
    {/* Deck 1 */}
    <rect x="30" y="122" width="265" height="20" rx="5" fill="#FFFBEB" />
    {/* Deck 1 cabin */}
    <rect x="40" y="82" width="220" height="42" rx="6" fill="white" />
    {[0,1,2,3,4,5,6,7].map(i => (
      <rect key={i} x={50 + i * 26} y="92" width="16" height="16" rx="3" fill="#F59E0B" opacity="0.3" />
    ))}
    {/* Deck 2 */}
    <rect x="50" y="54" width="180" height="30" rx="5" fill="#FFFBEB" />
    {[0,1,2,3,4].map(i => (
      <rect key={i} x={60 + i * 34} y="61" width="22" height="14" rx="2" fill="#38BDF8" opacity="0.5" />
    ))}
    {/* Deck 3 */}
    <rect x="70" y="32" width="110" height="25" rx="4" fill="#FEF3C7" />
    <rect x="78" y="37" width="30" height="12" rx="2" fill="#0F172A" opacity="0.5" />
    {/* Gold trim */}
    <line x1="40" y1="124" x2="260" y2="124" stroke="#F59E0B" strokeWidth="2" filter="url(#glow)" />
    {/* Radar */}
    <rect x="120" y="14" width="4" height="20" fill="#D4AF37" />
    <ellipse cx="122" cy="12" rx="14" ry="5" fill="#F59E0B" opacity="0.6" />
    {/* Helipad */}
    <circle cx="268" cy="96" r="16" stroke="#F59E0B" strokeWidth="1.5" fill="none" opacity="0.4" />
    <text x="268" y="101" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="bold" opacity="0.5">H</text>
  </svg>
);

// Golden Dragon Ship - legendary supreme
const GoldenDragonShipSvg = ({ className }: BoatSvgProps) => (
  <svg viewBox="0 0 320 200" fill="none" className={className}>
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <filter id="dragonGlow">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Hull */}
    <path d="M15 135 L45 175 L275 175 L305 135 Z" fill="#7C2D12" />
    <path d="M15 135 L45 175 L160 175 L130 135 Z" fill="#92400E" opacity="0.4" />
    {/* Gold trim */}
    <path d="M20 140 Q160 155 300 140" stroke="url(#goldGrad)" strokeWidth="3" fill="none" filter="url(#dragonGlow)" />
    {/* Deck */}
    <rect x="40" y="122" width="240" height="16" rx="4" fill="#B45309" />
    {/* Dragon head bow */}
    <path d="M30 130 Q15 115 20 95 Q25 80 40 75 Q35 90 40 100 Q45 110 50 120" fill="#D97706" />
    <circle cx="32" cy="88" r="3" fill="#EF4444" />
    <path d="M20 95 L10 90 L25 88" fill="#FBBF24" />
    {/* Cabin structure */}
    <rect x="70" y="85" width="140" height="40" rx="5" fill="#92400E" />
    {/* Gold windows */}
    {[0,1,2,3,4].map(i => (
      <rect key={i} x={80 + i * 26} y="95" width="16" height="14" rx="2" fill="#FBBF24" opacity="0.7" />
    ))}
    {/* Pagoda roof */}
    <path d="M60 85 L140 55 L220 85" fill="#DC2626" />
    <path d="M75 70 L140 48 L205 70" fill="#B91C1C" />
    {/* Dragon tail */}
    <path d="M280 130 Q290 110 285 90 Q280 75 270 70 Q275 85 273 100 Q270 115 268 125" fill="#D97706" />
    {/* Mast */}
    <rect x="138" y="25" width="5" height="30" fill="#92400E" />
    {/* Dragon banner */}
    <path d="M143 25 L175 32 L143 40 Z" fill="#DC2626" />
    <text x="156" y="36" textAnchor="middle" fill="#FBBF24" fontSize="8" fontWeight="bold">龍</text>
  </svg>
);

// Map boat ID to SVG component
function getBoatSvg(boatId: string): React.FC<BoatSvgProps> {
  const boatSvgMap: Record<string, React.FC<BoatSvgProps>> = {
    'boat_raft': RaftSvg,
    'boat_canoe': CanoeSvg,
    'boat_kayak': KayakSvg,
    'boat_fishing_boat': FishingBoatSvg,
    'boat_speedboat': SpeedboatSvg,
    'boat_sailboat': SailboatSvg,
    'boat_cabin_cruiser': CabinCruiserSvg,
    'boat_trawler': TrawlerSvg,
    'boat_yacht_small': YachtSvg,
    'boat_sport_fisher': SportFisherSvg,
    'boat_catamaran': CatamaranSvg,
    'boat_mega_yacht': MegaYachtSvg,
    'boat_super_yacht': SuperYachtSvg,
    'boat_golden_ship': GoldenDragonShipSvg,
  };
  return boatSvgMap[boatId] || ShipIcon as unknown as React.FC<BoatSvgProps>;
}

export function MainHubScreen({
  player,
  onStartFishing,
  onOpenShop,
  onBack,
}: {
  player: PlayerProgress;
  onStartFishing: () => void;
  onOpenShop: () => void;
  onOpenInventory?: () => void;
  onBack?: () => void;
}) {
  const equippedRod = player.equippedRod ? getRodById(player.equippedRod) : null;
  const equippedBait = player.equippedBait ? getBaitById(player.equippedBait) : null;
  const equippedBoat = player.equippedBoat ? getBoatById(player.equippedBoat) : null;

  const expProgress = (player.exp / player.expToNextLevel) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-sky-300 via-cyan-400 to-blue-500">
      {/* Ocean Background */}
      <div className="absolute inset-0">
        {/* Sky with clouds */}
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-sky-200 via-sky-300 to-transparent">
          <div className="absolute top-8 left-20 opacity-50 animate-float"><CloudIcon className="w-20 h-12" /></div>
          <div className="absolute top-12 right-32 opacity-40 animate-float-slow"><CloudIcon className="w-16 h-10" /></div>
          <div className="absolute top-20 left-1/3 opacity-30 animate-float"><CloudIcon className="w-24 h-14" /></div>
        </div>

        {/* Ocean gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-600 opacity-80" />
        
        {/* Underwater rocks and coral */}
        <div className="absolute bottom-32 left-1/4 opacity-30 animate-float-slow"><RockIcon className="w-20 h-16" /></div>
        <div className="absolute bottom-40 right-1/3 opacity-25 animate-float"><CoralIcon className="w-16 h-16" /></div>
        <div className="absolute bottom-48 left-1/3 opacity-20"><RockIcon className="w-14 h-12" /></div>
        
        {/* Swimming fish */}
        <div className="absolute top-1/3 left-1/4 opacity-40 animate-swim"><FishSvgIcon className="w-14 h-10" /></div>
        <div className="absolute top-1/2 right-1/4 opacity-35 animate-swim-reverse"><TropicalFishIcon className="w-12 h-8" /></div>
        <div className="absolute bottom-1/2 left-1/3 opacity-30 animate-swim-slow"><PufferfishIcon className="w-16 h-16" /></div>
        <div className="absolute top-2/3 right-1/3 opacity-40 animate-swim"><SharkIcon className="w-14 h-8" /></div>
        <div className="absolute bottom-2/3 left-2/3 opacity-35 -scale-x-100 animate-swim-reverse"><FishSvgIcon className="w-12 h-8" /></div>
        <div className="absolute top-1/2 left-1/2 opacity-25 animate-swim-slow"><TropicalFishIcon className="w-10 h-7" /></div>
        
        {/* Rocks on sides */}
        <div className="absolute bottom-0 left-0 opacity-60"><RockIcon className="w-28 h-24" /></div>
        <div className="absolute bottom-16 left-16 opacity-50"><RockIcon className="w-24 h-20" /></div>
        <div className="absolute bottom-8 left-8 opacity-40"><RockIcon className="w-16 h-14" /></div>
        <div className="absolute bottom-0 right-0 opacity-60"><RockIcon className="w-28 h-24" /></div>
        <div className="absolute bottom-12 right-20 opacity-50"><RockIcon className="w-24 h-20" /></div>
        <div className="absolute bottom-6 right-12 opacity-45"><RockIcon className="w-20 h-16" /></div>
        
        {/* Beach/Sand elements */}
        <div className="absolute bottom-0 left-1/4 opacity-40"><BeachIcon className="w-16 h-12" /></div>
        <div className="absolute bottom-4 right-1/3 opacity-35"><ShellIcon className="w-10 h-10" /></div>
        <div className="absolute bottom-8 left-1/3 opacity-30"><StarFilledIcon className="w-10 h-10" /></div>
        
        {/* Wooden pier/dock on left */}
        <div className="absolute bottom-0 left-0 ml-32 mb-20 flex flex-col items-center space-y-1">
          <div className="opacity-50"><WoodLogIcon className="w-16 h-8" /></div>
          <div className="opacity-50"><WoodLogIcon className="w-16 h-8" /></div>
          <div className="opacity-50"><WoodLogIcon className="w-16 h-8" /></div>
          <div className="opacity-50"><WoodLogIcon className="w-16 h-8" /></div>
        </div>
        
        {/* Palm trees on sides */}
        <div className="absolute bottom-32 left-4 opacity-50"><PalmTreeIcon className="w-20 h-24" /></div>
        <div className="absolute bottom-28 right-4 opacity-55"><PalmTreeIcon className="w-24 h-28" /></div>
        <div className="absolute bottom-36 left-24 opacity-40"><TreeIcon className="w-16 h-22" /></div>
        
        {/* Water waves */}
        <div className="absolute bottom-1/4 left-1/4 opacity-20 animate-wave"><WaveIcon className="w-12 h-6" /></div>
        <div className="absolute bottom-1/3 right-1/4 opacity-25 animate-wave"><WaveIcon className="w-12 h-6" /></div>
        <div className="absolute bottom-1/2 left-1/2 opacity-15 animate-wave"><WaveIcon className="w-10 h-5" /></div>
        
        {/* Fishing boat */}
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 animate-bob"><ShipIcon className="w-28 h-20" /></div>
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 translate-y-8 rotate-45 animate-fishing"><FishingRodIcon className="w-16 h-16" /></div>
        
        {/* Seagulls */}
        <div className="absolute top-1/4 left-1/4 opacity-50 animate-float"><SeagullIcon className="w-12 h-8" /></div>
        <div className="absolute top-1/3 right-1/3 opacity-40 animate-float-slow"><SeagullIcon className="w-10 h-6" /></div>
      </div>

      {/* Top Stats Bar */}
      <div className="relative z-30 px-4 py-3 bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-md border-b-2 border-yellow-500/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          {/* Player Info */}
          <div className="flex items-center space-x-3">
            {player.photoURL && (
              <img
                src={player.photoURL}
                alt={player.displayName}
                className="w-12 h-12 rounded-full border-2 border-yellow-500"
              />
            )}
            <div>
              <p className="text-white font-bold text-base sm:text-lg">{player.displayName}</p>
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm">Level {player.level}</span>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="flex items-center gap-3">
            {/* Coins */}
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-3 sm:px-4 py-2 rounded-lg border-2 border-yellow-400 shadow-lg flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-900" />
              <span className="text-white font-bold text-sm sm:text-lg">{player.coins.toLocaleString()}</span>
            </div>

            {/* Fish Caught */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-3 sm:px-4 py-2 rounded-lg border-2 border-cyan-400 shadow-lg flex items-center space-x-2">
              <Fish className="h-5 w-5 text-white" />
              <span className="text-white font-bold text-sm sm:text-lg">{player.totalFishCaught}</span>
            </div>

            {/* EXP */}
            <div className="bg-gradient-to-r from-green-600 to-lime-500 px-3 sm:px-4 py-2 rounded-lg border-2 border-green-400 shadow-lg flex items-center space-x-2">
              <Award className="h-5 w-5 text-white" />
              <span className="text-white font-bold text-sm sm:text-lg">{player.exp.toLocaleString()} EXP</span>
            </div>
          </div>
        </div>

        {/* EXP Bar */}
        <div className="max-w-7xl mx-auto mt-2">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-lime-400 to-yellow-500 transition-all duration-500"
              style={{ width: `${expProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-[calc(100vh-100px)] flex">
        {/* Left Sidebar */}
        <div className="w-24 sm:w-32 bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-sm border-r-2 border-gray-700 flex flex-col items-center py-6 space-y-4">
          {/* Shop */}
          <button 
            onClick={onOpenShop}
            className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-xl border-2 sm:border-3 border-green-400 shadow-xl flex flex-col items-center justify-center transition-all hover:scale-110"
          >
            <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-white mb-1" />
            <span className="text-white text-xs font-bold">SHOP</span>
          </button>

          {/* Back */}
          {onBack && (
            <button 
              onClick={onBack}
              className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded-xl border-2 sm:border-3 border-gray-500 shadow-xl flex flex-col items-center justify-center transition-all hover:scale-110 mt-auto"
            >
              <ArrowLeft className="h-6 w-6 sm:h-8 sm:w-8 text-white mb-1" />
              <span className="text-white text-xs font-bold">Menu</span>
            </button>
          )}
        </div>

        {/* Center Content - BOAT SHOWCASE */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
          {/* Boat Name & Rarity */}
          {equippedBoat && (
            <div className="text-center mb-4 z-10">
              <span
                className="inline-block text-xs px-4 py-1.5 rounded-full font-black tracking-widest uppercase border-2 mb-2"
                style={{
                  backgroundColor: RARITY_COLORS[equippedBoat.rarity] + '25',
                  color: RARITY_COLORS[equippedBoat.rarity],
                  borderColor: RARITY_COLORS[equippedBoat.rarity] + '60',
                }}
              >
                {RARITY_NAMES_TH[equippedBoat.rarity]}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                {equippedBoat.nameTh}
              </h2>
              <p className="text-sm text-white/50 mt-1">{equippedBoat.name}</p>
            </div>
          )}

          {/* Large Boat Display - like racing game car showcase */}
          <div className="relative w-full max-w-lg lg:max-w-2xl aspect-[16/9] flex items-center justify-center">
            {/* Circular glow platform */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-[30%]">
              <div
                className="w-full h-full rounded-[50%] blur-2xl opacity-30"
                style={{
                  background: equippedBoat
                    ? `radial-gradient(ellipse, ${RARITY_COLORS[equippedBoat.rarity]}, transparent 70%)`
                    : 'radial-gradient(ellipse, #3B82F6, transparent 70%)'
                }}
              />
            </div>
            {/* Water reflection line */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* The Boat SVG - Large and prominent */}
            {equippedBoat && (() => {
              const BoatComponent = getBoatSvg(equippedBoat.id);
              return (
                <div className="w-full h-full flex items-center justify-center animate-boat-float">
                  <BoatComponent className="w-[85%] h-[85%] drop-shadow-2xl" />
                </div>
              );
            })()}

            {/* Sparkle effects for rare+ boats */}
            {equippedBoat && ['rare', 'epic', 'legendary'].includes(equippedBoat.rarity) && (
              <>
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-sparkle opacity-60" />
                <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full animate-sparkle-delayed opacity-40" />
                <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-white rounded-full animate-sparkle opacity-30" />
              </>
            )}
          </div>

          {/* Boat Stats Bar - like racing game stats */}
          {equippedBoat && (
            <div className="w-full max-w-lg lg:max-w-xl mt-2 z-10">
              <div className="grid grid-cols-3 gap-3">
                {/* Capacity */}
                <div className="bg-gradient-to-br from-blue-900/60 to-blue-800/40 backdrop-blur-sm rounded-xl p-3 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Weight className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">ความจุ</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-2xl font-black">{equippedBoat.capacity}</span>
                    <span className="text-white/50 text-xs">kg</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-blue-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all" style={{ width: `${Math.min(100, (equippedBoat.capacity / 2000) * 100)}%` }} />
                  </div>
                </div>
                {/* Speed */}
                <div className="bg-gradient-to-br from-green-900/60 to-green-800/40 backdrop-blur-sm rounded-xl p-3 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Gauge className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-xs font-bold uppercase tracking-wider">ความเร็ว</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-2xl font-black">{equippedBoat.speed.toFixed(1)}</span>
                    <span className="text-white/50 text-xs">x</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-green-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-lime-400 rounded-full transition-all" style={{ width: `${Math.min(100, (equippedBoat.speed / 5.0) * 100)}%` }} />
                  </div>
                </div>
                {/* Rod Bonus */}
                <div className="bg-gradient-to-br from-purple-900/60 to-purple-800/40 backdrop-blur-sm rounded-xl p-3 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 text-xs font-bold uppercase tracking-wider">คันเบ็ด</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-2xl font-black">+{equippedRod?.catchBonus || 0}</span>
                    <span className="text-white/50 text-xs">%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-purple-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all" style={{ width: `${Math.min(100, (equippedRod?.catchBonus || 0))}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom CAST Button */}
          <Button
            onClick={onStartFishing}
            className="mt-6 h-16 sm:h-20 px-12 sm:px-16 text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-600 via-lime-500 to-green-600 hover:from-green-500 hover:via-lime-400 hover:to-green-500 shadow-2xl shadow-green-500/30 border-4 border-green-400 rounded-2xl transform hover:scale-110 transition-all duration-300"
          >
            CAST
          </Button>
        </div>

        {/* Right Side - Equipped Items Card */}
        <div className="absolute bottom-6 right-6 w-72 sm:w-80 z-30 hidden md:block">
          <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg border-4 border-yellow-500 shadow-2xl">
            <CardContent className="p-4 sm:p-6">
              {/* Equipped Rod */}
              {equippedRod && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-yellow-400 font-bold text-xs sm:text-sm">EQUIPPED</span>
                    <span
                      className="text-xs px-2 sm:px-3 py-1 rounded-full font-bold border-2"
                      style={{
                        backgroundColor: RARITY_COLORS[equippedRod.rarity] + '40',
                        color: RARITY_COLORS[equippedRod.rarity],
                        borderColor: RARITY_COLORS[equippedRod.rarity],
                      }}
                    >
                      {RARITY_NAMES_TH[equippedRod.rarity].toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-3 sm:p-4 border-2 border-blue-500/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-14 h-14 sm:w-16 sm:h-16"><FishingRodIcon className="w-full h-full" /></div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-base sm:text-lg">{equippedRod.nameTh}</p>
                        <p className="text-cyan-300 text-xs sm:text-sm">คันเบ็ด</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-xs sm:text-sm">โอกาสจับได้</span>
                        <span className="text-green-400 font-bold text-sm">+{equippedRod.catchBonus}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-blue-900/50 rounded-lg p-2 sm:p-3 border border-blue-500/30">
                  <p className="text-gray-400 text-xs">เหยื่อ</p>
                  <p className="text-white font-bold text-sm sm:text-lg">
                    {equippedBait ? `x${player.ownedBaits[equippedBait.id] || 0}` : '-'}
                  </p>
                </div>
                <div className="bg-purple-900/50 rounded-lg p-2 sm:p-3 border border-purple-500/30">
                  <p className="text-gray-400 text-xs">เรือ</p>
                  <p className="text-white font-bold text-sm sm:text-lg">
                    {equippedBoat ? `${equippedBoat.capacity}kg` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -10px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, -8px); }
        }
        @keyframes bob {
          0%, 100% { transform: translate(-50%, 0) rotate(-2deg); }
          50% { transform: translate(-50%, -15px) rotate(2deg); }
        }
        @keyframes boat-float {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          25% { transform: translateY(-8px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1deg); }
          75% { transform: translateY(-12px) rotate(0deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
        @keyframes sparkle-delayed {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes fishing {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(50deg) translateY(-8px); }
        }
        @keyframes swim {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(30px) translateY(-15px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes swim-reverse {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-30px) translateY(15px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes swim-slow {
          0% { transform: translateX(0) translateY(0) rotate(0deg); }
          25% { transform: translateX(20px) translateY(-10px) rotate(5deg); }
          50% { transform: translateX(40px) translateY(0) rotate(0deg); }
          75% { transform: translateX(20px) translateY(10px) rotate(-5deg); }
          100% { transform: translateX(0) translateY(0) rotate(0deg); }
        }
        @keyframes wave {
          0%, 100% { transform: translateX(0) scale(1); opacity: 0.15; }
          50% { transform: translateX(-20px) scale(1.2); opacity: 0.25; }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-bob {
          animation: bob 4s ease-in-out infinite;
        }
        .animate-fishing {
          animation: fishing 2s ease-in-out infinite;
        }
        .animate-swim {
          animation: swim 6s ease-in-out infinite;
        }
        .animate-swim-reverse {
          animation: swim-reverse 7s ease-in-out infinite;
        }
        .animate-swim-slow {
          animation: swim-slow 10s ease-in-out infinite;
        }
        .animate-wave {
          animation: wave 4s ease-in-out infinite;
        }
        .animate-boat-float {
          animation: boat-float 5s ease-in-out infinite;
        }
        .animate-sparkle {
          animation: sparkle 3s ease-in-out infinite;
        }
        .animate-sparkle-delayed {
          animation: sparkle-delayed 3s ease-in-out infinite 1.5s;
        }
      `}</style>
    </div>
  );
}
