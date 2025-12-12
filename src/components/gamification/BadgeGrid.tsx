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
  '🌅': <Sun className="w-6 h-6" />,
  '⚡': <Zap className="w-6 h-6" />,
  '🏆': <Trophy className="w-6 h-6" />,
  '⭐': <Star className="w-6 h-6" />,
  '🎯': <Target className="w-6 h-6" />,
  '❤️': <Heart className="w-6 h-6" />,
  'default': <Award className="w-6 h-6" />,
};

interface BadgeGridProps {
  badges: Badge[];
  variant?: 'grid' | 'horizontal';
}

export function BadgeGrid({ badges, variant = 'grid' }: BadgeGridProps) {
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
              badge.earnedAt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {getIcon(badge.icon)}
            </div>
            <p className="text-xs font-medium truncate">
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
            'card-elevated p-4 text-center',
            !badge.earnedAt && 'opacity-50 grayscale'
          )}
        >
          <div className={cn(
            'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3',
            badge.earnedAt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            {getIcon(badge.icon)}
          </div>
          <p className="text-sm font-medium mb-1">
            {i18n.language === 'th' ? badge.nameTh : badge.nameEn}
          </p>
          <p className="text-xs text-muted-foreground">
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
