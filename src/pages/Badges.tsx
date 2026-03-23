import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Share2, Star, Trophy, Gamepad2, Salad, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBadges } from '@/hooks/useFirestore';
import type { BadgeCategory } from '@/lib/badges';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { shareBadgeAchievement, shareSingleBadgeAchievement } from '@/lib/liff';
import { toast } from '@/components/ui/sonner';
import type { Badge } from '@/lib/types';

const categoryMeta: Record<BadgeCategory, { title: string; icon: React.ReactNode }> = {
  workout: { title: 'Workout Badges', icon: <Trophy className="w-4 h-4" /> },
  game: { title: 'Game Badges', icon: <Gamepad2 className="w-4 h-4" /> },
  nutrition: { title: 'Nutrition Badges', icon: <Salad className="w-4 h-4" /> },
};

export default function BadgesPage() {
  const { lineProfile } = useAuth();
  const { theme } = useTheme();
  const isDocumentDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const isDark = theme === 'dark' || isDocumentDark;
  const { badges, isLoading, error } = useBadges();
  const [isSharing, setIsSharing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const normalizedBadges = useMemo(() => {
    return badges.map((badge) => {
      return {
        ...badge,
        nameEn: badge.nameEn || badge.name || badge.id,
        nameTh: badge.nameTh || badge.nameEn || badge.name || badge.id,
        requirement: badge.requirement || '-',
        icon: badge.icon || 'default',
        category: badge.category || 'workout',
      };
    });
  }, [badges]);

  const byCategory = useMemo(() => {
    return {
      workout: normalizedBadges.filter((badge) => badge.category === 'workout'),
      game: normalizedBadges.filter((badge) => badge.category === 'game'),
      nutrition: normalizedBadges.filter((badge) => badge.category === 'nutrition'),
    };
  }, [normalizedBadges]);

  const earnedCount = normalizedBadges.filter((badge) => !!badge.earnedAt).length;
  const totalCount = normalizedBadges.length;
  const earnedBadges = normalizedBadges.filter((badge) => !!badge.earnedAt);

  const handleShareBadges = async () => {
    if (earnedBadges.length === 0) {
      toast.error('ยังไม่มีเหรียญที่ปลดล็อกให้แชร์');
      return;
    }

    setIsSharing(true);
    const names = Array.from(new Set(earnedBadges.map((badge) => badge.nameTh || badge.nameEn).filter(Boolean)));
    const shared = await shareBadgeAchievement(lineProfile?.displayName || 'ผู้ใช้ KAYA', names, names.length);
    setIsSharing(false);

    if (shared) {
      toast.success('แชร์ความสำเร็จไปที่ LINE แล้ว');
    } else {
      toast.error('ไม่สามารถเปิด Share Target Picker ได้ (กรุณาเปิดผ่าน LINE App)');
    }
  };

  const handleShareSingleBadge = async () => {
    if (!selectedBadge) return;
    if (!selectedBadge.earnedAt) {
      toast.error('ปลดล็อกเหรียญนี้ก่อนจึงจะแชร์ได้');
      return;
    }

    setIsSharing(true);
    const shared = await shareSingleBadgeAchievement(lineProfile?.displayName || 'ผู้ใช้ KAYA', {
      id: selectedBadge.id,
      nameEn: selectedBadge.nameEn,
      nameTh: selectedBadge.nameTh,
      icon: selectedBadge.icon,
      category: selectedBadge.category,
      description: selectedBadge.description,
      requirement: selectedBadge.requirement,
    });
    setIsSharing(false);

    if (shared) {
      toast.success('แชร์เหรียญนี้ไปที่ LINE แล้ว');
    } else {
      toast.error('ไม่สามารถเปิด Share Target Picker ได้ (กรุณาเปิดผ่าน LINE App)');
    }
  };

  const earnedByCategory = useMemo(
    () => ({
      workout: byCategory.workout.filter((badge) => !!badge.earnedAt),
      game: byCategory.game.filter((badge) => !!badge.earnedAt),
      nutrition: byCategory.nutrition.filter((badge) => !!badge.earnedAt),
    }),
    [byCategory]
  );

  const nextLockedByCategory = useMemo(
    () => ({
      workout: byCategory.workout
        .filter((badge) => !badge.earnedAt)
        .sort((a, b) => (b.progressCurrent || 0) / Math.max(b.progressTarget || 1, 1) - (a.progressCurrent || 0) / Math.max(a.progressTarget || 1, 1))[0],
      game: byCategory.game
        .filter((badge) => !badge.earnedAt)
        .sort((a, b) => (b.progressCurrent || 0) / Math.max(b.progressTarget || 1, 1) - (a.progressCurrent || 0) / Math.max(a.progressTarget || 1, 1))[0],
      nutrition: byCategory.nutrition
        .filter((badge) => !badge.earnedAt)
        .sort((a, b) => (b.progressCurrent || 0) / Math.max(b.progressTarget || 1, 1) - (a.progressCurrent || 0) / Math.max(a.progressTarget || 1, 1))[0],
    }),
    [byCategory]
  );

  const formatProgressText = (badge: { id: string; progressCurrent?: number; progressTarget?: number }) => {
    const current = badge.progressCurrent || 0;
    const target = badge.progressTarget || 0;

    if (badge.id === 'workout_50_minutes' || badge.id === 'workout_120_minutes' || badge.id === 'workout_300_minutes') {
      return `${Math.floor(current / 60)}/${Math.floor(target / 60)} นาที`;
    }

    return `${current}/${target}`;
  };

  return (
    <div className={cn('min-h-screen pb-24', isDark ? 'bg-[#090c12] text-white' : 'bg-gray-50 text-gray-900')}>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm',
              isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-100'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ Dashboard
          </Link>
        </div>

        <div className={cn('rounded-2xl border p-5', isDark ? 'bg-[#11151e] border-orange-500/20' : 'bg-white border-gray-200')}>
          <div className="flex items-center justify-between mb-2 gap-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h1 className="text-2xl font-bold">Badges Detail</h1>
            </div>
            <button
              type="button"
              onClick={handleShareBadges}
              disabled={isSharing || earnedBadges.length === 0}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors',
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-white border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Share2 className="w-4 h-4" />
              {isSharing ? 'กำลังแชร์...' : 'แชร์ใน LINE'}
            </button>
          </div>
          <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
            ปลดล็อกแล้ว {earnedCount} / {totalCount} เหรียญ
          </p>
          <div className={cn('mt-3 h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-200')}>
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
              style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          {error && (
            <p className={cn('mt-3 text-xs', isDark ? 'text-amber-300' : 'text-amber-700')}>
              โหลดข้อมูลความคืบหน้าบางส่วนไม่สำเร็จ แต่ยังแสดงเหรียญที่ปลดล็อกแล้วได้
            </p>
          )}
        </div>

        {(['workout', 'game', 'nutrition'] as const).map((category) => (
          <section
            key={category}
            className={cn('rounded-2xl border p-5', isDark ? 'bg-[#11151e] border-orange-500/20' : 'bg-white border-gray-200')}
          >
            <div className="flex items-center gap-2 mb-4">
              {categoryMeta[category].icon}
              <h2 className="text-lg font-semibold">{categoryMeta[category].title}</h2>
              <span className={cn('text-xs px-2 py-1 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')}>
                {earnedByCategory[category].length}/{byCategory[category].length}
              </span>
            </div>

            {isLoading ? (
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>กำลังโหลด badges...</p>
            ) : byCategory[category].length === 0 ? (
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>ยังไม่มี badge ในหมวดนี้</p>
            ) : (
              <div className="space-y-2">
                <BadgeGrid
                  badges={byCategory[category]}
                  variant="grid"
                  isDark={isDark}
                  onBadgeClick={setSelectedBadge}
                />
                {nextLockedByCategory[category] && (
                  <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                    ใกล้ปลดล็อกที่สุด: {nextLockedByCategory[category].nameTh} ({formatProgressText(nextLockedByCategory[category])})
                  </p>
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      {selectedBadge && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelectedBadge(null)}
            aria-label="Close badge details"
          />
          <div className={cn(
            'relative z-[111] w-full max-w-md rounded-2xl border p-5 shadow-2xl',
            isDark ? 'bg-[#11151e] border-orange-500/20 text-white' : 'bg-white border-gray-200 text-gray-900'
          )}>
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className={cn(
                'absolute right-3 top-3 rounded-full p-2 transition-colors',
                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              )}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pr-10">
              <p className={cn('text-xs uppercase tracking-wide', isDark ? 'text-orange-300' : 'text-orange-600')}>Badge Detail</p>
              <h3 className="mt-1 text-xl font-bold">{selectedBadge.nameTh || selectedBadge.nameEn || selectedBadge.id}</h3>
              <p className={cn('text-sm mt-1', isDark ? 'text-gray-300' : 'text-gray-600')}>{selectedBadge.nameEn}</p>
            </div>

            <div className={cn('mt-4 rounded-xl border p-3', isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50')}>
              <p className={cn('text-sm', isDark ? 'text-gray-200' : 'text-gray-700')}>{selectedBadge.description}</p>
              <p className={cn('mt-2 text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>เงื่อนไข: {selectedBadge.requirement}</p>
              <p className={cn('mt-1 text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                ความคืบหน้า: {formatProgressText(selectedBadge)}
              </p>
              <p className={cn('mt-1 text-xs font-medium', selectedBadge.earnedAt ? 'text-green-500' : (isDark ? 'text-amber-300' : 'text-amber-700'))}>
                {selectedBadge.earnedAt
                  ? `ปลดล็อกแล้ว: ${new Date(selectedBadge.earnedAt).toLocaleString()}`
                  : 'ยังไม่ปลดล็อก'}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className={cn(
                  'flex-1 rounded-xl px-3 py-2 text-sm border',
                  isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-100'
                )}
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={handleShareSingleBadge}
                disabled={isSharing || !selectedBadge.earnedAt}
                className={cn(
                  'flex-1 rounded-xl px-3 py-2 text-sm font-medium inline-flex items-center justify-center gap-2',
                  selectedBadge.earnedAt
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90'
                    : (isDark ? 'bg-white/10 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                )}
              >
                <Share2 className="w-4 h-4" />
                {isSharing ? 'กำลังแชร์...' : 'แชร์เหรียญนี้'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
