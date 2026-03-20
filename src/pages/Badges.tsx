import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Share2, Star, Trophy, Gamepad2, Salad } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBadges } from '@/hooks/useFirestore';
import { BADGE_DEFINITIONS, type BadgeCategory } from '@/lib/badges';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { shareBadgeAchievement } from '@/lib/liff';
import { toast } from '@/components/ui/sonner';

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

  const normalizedBadges = useMemo(() => {
    const definitionMap = new Map(BADGE_DEFINITIONS.map((b) => [b.id, b]));

    return badges.map((badge) => {
      const definition = definitionMap.get(badge.id);

      return {
        ...badge,
        nameEn: badge.nameEn || definition?.nameEn || badge.id,
        nameTh: badge.nameTh || definition?.nameTh || badge.nameEn || badge.id,
        requirement: badge.requirement || definition?.requirement || '-',
        icon: badge.icon || definition?.icon || 'default',
      };
    });
  }, [badges]);

  const byCategory = useMemo(() => {
    const definitionMap = new Map(BADGE_DEFINITIONS.map((b) => [b.id, b]));

    return {
      workout: normalizedBadges.filter((badge) => definitionMap.get(badge.id)?.category === 'workout'),
      game: normalizedBadges.filter((badge) => definitionMap.get(badge.id)?.category === 'game'),
      nutrition: normalizedBadges.filter((badge) => definitionMap.get(badge.id)?.category === 'nutrition'),
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
      toast.error('ไม่สามารถแชร์ได้ในขณะนี้ (ลองเปิดใน LINE อีกครั้ง)');
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
    <div className={cn('min-h-screen pb-24', isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900')}>
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

        <div className={cn('rounded-2xl border p-5', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200')}>
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
            className={cn('rounded-2xl border p-5', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200')}
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
            ) : earnedByCategory[category].length === 0 ? (
              <div className="space-y-1">
                <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  ยังไม่มีเหรียญที่ปลดล็อกในหมวดนี้ (มีทั้งหมด {byCategory[category].length} เหรียญ)
                </p>
                {nextLockedByCategory[category] && (
                  <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                    ใกล้ปลดล็อกที่สุด: {nextLockedByCategory[category].nameTh} ({formatProgressText(nextLockedByCategory[category])})
                  </p>
                )}
              </div>
            ) : (
              <BadgeGrid badges={earnedByCategory[category]} variant="grid" isDark={isDark} />
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
