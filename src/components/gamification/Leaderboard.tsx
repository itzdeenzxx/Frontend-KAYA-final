import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Crown, Medal } from 'lucide-react';
import { LeaderboardEntry } from '@/lib/types';
import { TierBadge } from '@/components/shared/TierBadge';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

const rankColors = {
  1: 'bg-gradient-to-r from-amber-400 to-amber-500 text-white',
  2: 'bg-gradient-to-r from-slate-300 to-slate-400 text-white',
  3: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white',
};

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.userId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            'card-elevated p-4 flex items-center gap-4',
            entry.userId === currentUserId && 'ring-2 ring-primary bg-primary/5'
          )}
        >
          {/* Rank */}
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg',
            entry.rank <= 3 
              ? rankColors[entry.rank as 1 | 2 | 3]
              : 'bg-muted text-muted-foreground'
          )}>
            {entry.rank <= 3 ? (
              entry.rank === 1 ? <Crown className="w-5 h-5" /> : <Medal className="w-5 h-5" />
            ) : (
              entry.rank
            )}
          </div>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
            {entry.nickname[0].toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn(
                'font-medium truncate',
                entry.userId === currentUserId && 'text-primary'
              )}>
                {entry.nickname}
              </p>
              <TierBadge tier={entry.tier} size="sm" showName={false} />
            </div>
            <p className="text-sm text-muted-foreground">
              {entry.points.toLocaleString()} {t('gamification.points')}
            </p>
          </div>

          {/* Position Change */}
          {entry.rank <= 3 && (
            <div className="text-2xl">
              {entry.rank === 1 && '🥇'}
              {entry.rank === 2 && '🥈'}
              {entry.rank === 3 && '🥉'}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
