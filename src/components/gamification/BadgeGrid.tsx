import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Badge } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  Flame, 
  Trophy, 
  Zap, 
  Target, 
  Star, 
  Award,
  Medal,
  Crown,
  Sparkles,
  Heart,
  Dumbbell,
  Timer,
  TrendingUp,
  Sun
} from 'lucide-react';

// Map icon names to Lucide components
const iconMap: Record<string, React.ReactNode> = {
  '🏃': <Dumbbell className="w-6 h-6" />,
  '🔥': <Flame className="w-6 h-6" />,
  '💪': <Trophy className="w-6 h-6" />,
  '⏱️': <Timer className="w-6 h-6" />,
  '🌅': <Sun className="w-6 h-6" />,
  '⚡': <Zap className="w-6 h-6" />,
  '🎮': <Target className="w-6 h-6" />,
  '🥗': <Sparkles className="w-6 h-6" />,
  '📘': <Medal className="w-6 h-6" />,
  '💧': <Heart className="w-6 h-6" />,
  '🏆': <Trophy className="w-6 h-6" />,
  '⭐': <Star className="w-6 h-6" />,
  '🎯': <Target className="w-6 h-6" />,
  '❤️': <Heart className="w-6 h-6" />,
  '🌟': <Sparkles className="w-6 h-6" />,
  'default': <Award className="w-6 h-6" />,
};

interface BadgeGridProps {
  badges: Badge[];
  variant?: 'grid' | 'horizontal';
  isDark?: boolean;
  onBadgeClick?: (badge: Badge) => void;
}

export function BadgeGrid({ badges, variant = 'grid', isDark = false, onBadgeClick }: BadgeGridProps) {
  const { i18n } = useTranslation();
  const [iconFallbackMap, setIconFallbackMap] = useState<Record<string, boolean>>({});

  const getIconAssetUrl = (badgeId: string) => `/assets/badges/icons/${badgeId}.svg`;

  const isEmojiIcon = (value: string): boolean => {
    if (!value) return false;
    return /\p{Extended_Pictographic}/u.test(value);
  };

  const getIcon = (iconKey: string) => {
    if (isEmojiIcon(iconKey)) {
      return <span className="text-3xl leading-none">{iconKey}</span>;
    }
    return iconMap[iconKey] || iconMap['default'];
  };

  if (variant === 'horizontal') {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'flex-shrink-0 w-20 text-center',
              !badge.earnedAt && 'opacity-40 grayscale'
            )}
          >
            <div className={cn(
              'w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-2 border',
              badge.earnedAt
                ? (isDark ? 'bg-orange-500/18 border-orange-400/50 text-orange-300' : 'bg-orange-100 border-orange-300 text-orange-600')
                : (isDark ? 'bg-zinc-800 border-white/15 text-orange-200' : 'bg-gray-200 border-gray-300 text-gray-700')
            )}>
              {iconFallbackMap[badge.id] ? (
                getIcon(badge.icon)
              ) : (
                <img
                  src={getIconAssetUrl(badge.id)}
                  alt={badge.nameEn || badge.id}
                  className="w-10 h-10 object-contain"
                  loading="lazy"
                  onError={() => setIconFallbackMap((prev) => ({ ...prev, [badge.id]: true }))}
                />
              )}
            </div>
            <p className={cn('text-xs font-semibold truncate', isDark ? 'text-orange-100' : 'text-black')}>
              {i18n.language === 'th' ? badge.nameTh : badge.nameEn}
            </p>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {badges.map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            'rounded-2xl border p-4 text-center shadow-sm min-h-[132px] flex flex-col items-center justify-center',
            isDark ? 'bg-zinc-950 border-orange-500/40 text-orange-100' : 'bg-white border-gray-200 text-black',
            onBadgeClick && 'cursor-pointer hover:scale-[1.01] transition-transform',
            !badge.earnedAt && 'opacity-50 grayscale'
          )}
          onClick={() => onBadgeClick?.(badge)}
        >
          <div className={cn(
            'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 border',
            badge.earnedAt
              ? (isDark ? 'bg-orange-500/18 border-orange-400/50 text-orange-300' : 'bg-orange-100 border-orange-300 text-orange-600')
              : (isDark ? 'bg-zinc-800 border-white/15 text-orange-200' : 'bg-gray-200 border-gray-300 text-gray-700')
          )}>
            {iconFallbackMap[badge.id] ? (
              getIcon(badge.icon)
            ) : (
              <img
                src={getIconAssetUrl(badge.id)}
                alt={(i18n.language === 'th' ? badge.nameTh : badge.nameEn) || badge.id}
                className="w-11 h-11 object-contain"
                loading="lazy"
                onError={() => setIconFallbackMap((prev) => ({ ...prev, [badge.id]: true }))}
              />
            )}
          </div>
          <p className={cn('text-sm font-semibold mb-1 leading-tight', isDark ? 'text-orange-100' : 'text-black')}>
            {(i18n.language === 'th' ? badge.nameTh : badge.nameEn) || badge.id}
          </p>
          <p className={cn('text-xs font-medium', isDark ? 'text-orange-200' : 'text-gray-900')}>
            {badge.earnedAt 
              ? new Date(badge.earnedAt).toLocaleDateString() 
              : badge.requirement
            }
          </p>
        </motion.div>
      ))}
    </div>
  );
}
