import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
  'default': <Award className="w-6 h-6" />,
};

interface BadgeGridProps {
  badges: Badge[];
  variant?: 'grid' | 'horizontal';
  isDark?: boolean;
}

export function BadgeGrid({ badges, variant = 'grid', isDark = false }: BadgeGridProps) {
  const { i18n } = useTranslation();

  const getIcon = (iconKey: string) => {
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
              'w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-2',
              badge.earnedAt
                ? (isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-600')
                : (isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-600')
            )}>
              {getIcon(badge.icon)}
            </div>
            <p className={cn('text-xs font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
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
            'rounded-2xl border p-4 text-center shadow-sm',
            isDark ? 'bg-[#13151b] border-white/15 text-white' : 'bg-white border-gray-200 text-gray-900',
            !badge.earnedAt && 'opacity-50 grayscale'
          )}
        >
          <div className={cn(
            'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3',
            badge.earnedAt
              ? (isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-600')
              : (isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-600')
          )}>
            {getIcon(badge.icon)}
          </div>
          <p className={cn('text-sm font-semibold mb-1', isDark ? 'text-gray-100' : 'text-gray-900')}>
            {i18n.language === 'th' ? badge.nameTh : badge.nameEn}
          </p>
          <p className={cn('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>
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
