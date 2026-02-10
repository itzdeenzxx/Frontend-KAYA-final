import { UserTier, TIER_CONFIG } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: UserTier;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function TierBadge({ tier, size = 'md', showName = true }: TierBadgeProps) {
  const { t } = useTranslation();
  const config = TIER_CONFIG[tier];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  const tierNames: Record<UserTier, string> = {
    bronze: t('tiers.bronze'),
    silver: t('tiers.silver'),
    gold: t('tiers.gold'),
    platinum: t('tiers.platinum'),
    diamond: t('tiers.diamond'),
  };

  const tierColors: Record<UserTier, string> = {
    bronze: 'bg-amber-100 text-amber-800 border-amber-400',
    silver: 'bg-slate-100 text-slate-600 border-slate-300',
    gold: 'bg-amber-50 text-amber-700 border-amber-300',
    platinum: 'bg-cyan-50 text-cyan-700 border-cyan-300',
    diamond: 'bg-sky-50 text-sky-700 border-sky-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        sizeClasses[size],
        tierColors[tier]
      )}
    >
      <span>{config.icon}</span>
      {showName && <span>{tierNames[tier]}</span>}
    </span>
  );
}
