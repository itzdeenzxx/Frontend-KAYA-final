import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, RotateCcw, Save, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseAdminIds } from '@/lib/adminAccess';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ensureBadgeCatalogSeeded,
  getBadgeCatalog,
  resetBadgeCatalogFromDefinitions,
  upsertBadgeCatalogItem,
  type FirestoreBadgeCatalogItem,
} from '@/lib/firestore';
import { toast } from '@/components/ui/sonner';

type EditableBadge = {
  badgeId: string;
  nameEn: string;
  nameTh: string;
  description: string;
  icon: string;
  requirement: string;
  category: 'workout' | 'game' | 'nutrition';
  target: number;
};

const categories: Array<EditableBadge['category']> = ['workout', 'game', 'nutrition'];

const toEditable = (badge: FirestoreBadgeCatalogItem): EditableBadge => ({
  badgeId: badge.badgeId,
  nameEn: badge.nameEn,
  nameTh: badge.nameTh,
  description: badge.description,
  icon: badge.icon,
  requirement: badge.requirement,
  category: badge.category,
  target: badge.target,
});

export default function AdminBadges() {
  const { lineProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const rawAdminIds = (import.meta.env.VITE_ADMIN_USER_IDS as string | undefined) ?? '';
  const adminIds = useMemo(() => parseAdminIds(rawAdminIds), [rawAdminIds]);
  const isAdmin = !!lineProfile?.userId && adminIds.has(lineProfile.userId);
  const hasConfiguredAdmins = adminIds.size > 0;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [badges, setBadges] = useState<EditableBadge[]>([]);

  const loadBadges = useCallback(async () => {
    setIsLoading(true);
    try {
      await ensureBadgeCatalogSeeded();
      const data = await getBadgeCatalog();
      setBadges(data.map(toEditable));
    } catch (error) {
      console.error('Failed to load badge catalog', error);
      toast.error('โหลดข้อมูล badge catalog ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadBadges();
  }, [isAdmin, loadBadges]);

  const updateField = <K extends keyof EditableBadge>(index: number, key: K, value: EditableBadge[K]) => {
    setBadges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const saveBadge = async (badge: EditableBadge) => {
    if (!badge.nameEn.trim() || !badge.nameTh.trim()) {
      toast.error('ชื่อ EN/TH ห้ามว่าง');
      return;
    }

    setIsSaving(badge.badgeId);
    try {
      await upsertBadgeCatalogItem(badge.badgeId, badge);
      toast.success(`บันทึก ${badge.badgeId} แล้ว`);
    } catch (error) {
      console.error('Failed to save badge', error);
      toast.error(`บันทึก ${badge.badgeId} ไม่สำเร็จ`);
    } finally {
      setIsSaving(null);
    }
  };

  const resetAll = async () => {
    setIsLoading(true);
    try {
      await resetBadgeCatalogFromDefinitions();
      await loadBadges();
      toast.success('รีเซ็ต badge catalog จากค่าเริ่มต้นแล้ว');
    } catch (error) {
      console.error('Failed to reset badge catalog', error);
      toast.error('รีเซ็ต badge catalog ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCurrentUserId = async () => {
    const userId = lineProfile?.userId;
    if (!userId) {
      toast.error('ไม่พบ LINE userId ปัจจุบัน');
      return;
    }

    try {
      await navigator.clipboard.writeText(userId);
      toast.success('คัดลอก LINE userId แล้ว');
    } catch {
      toast.error('คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง');
    }
  };

  if (!isAdmin) {
    return (
      <div className={cn('min-h-screen p-6', isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900')}>
        <div className="max-w-3xl mx-auto rounded-2xl border p-6 text-center space-y-3 bg-red-500/10 border-red-500/30">
          <ShieldAlert className="w-10 h-10 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className={cn(isDark ? 'text-gray-300' : 'text-gray-700')}>
            หน้านี้สำหรับแอดมินเท่านั้น กรุณาตั้งค่า VITE_ADMIN_USER_IDS ให้มี LINE userId ของคุณก่อนใช้งาน
          </p>
          <div className={cn('text-xs break-all rounded-xl p-3', isDark ? 'bg-white/5 text-gray-300' : 'bg-white text-gray-700')}>
            <p>LINE userId ปัจจุบัน: {lineProfile?.userId || '-'}</p>
            <p>VITE_ADMIN_USER_IDS: {hasConfiguredAdmins ? 'ตั้งค่าแล้ว' : 'ยังไม่ได้ตั้งค่า'}</p>
          </div>
          <div>
            <button
              type="button"
              onClick={copyCurrentUserId}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm',
                isDark ? 'bg-white/5 border-white/15 hover:bg-white/10' : 'bg-white border-gray-300 hover:bg-gray-100'
              )}
            >
              คัดลอก LINE userId
            </button>
          </div>
          <div>
            <Link
              to="/settings"
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl border',
                isDark ? 'bg-white/5 border-white/15 hover:bg-white/10' : 'bg-white border-gray-300 hover:bg-gray-100'
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              กลับไปหน้าตั้งค่า
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen pb-24', isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900')}>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/settings"
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm',
              isDark ? 'bg-white/5 border-white/15 hover:bg-white/10' : 'bg-white border-gray-300 hover:bg-gray-100'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ Settings
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadBadges}
              disabled={isLoading}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm',
                isDark ? 'bg-white/5 border-white/15 hover:bg-white/10' : 'bg-white border-gray-300 hover:bg-gray-100',
                isLoading && 'opacity-60 cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              รีเฟรช
            </button>
            <button
              type="button"
              onClick={resetAll}
              disabled={isLoading}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white',
                'bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90',
                isLoading && 'opacity-60 cursor-not-allowed'
              )}
            >
              <RotateCcw className="w-4 h-4" />
              รีเซ็ตจากค่าเริ่มต้น
            </button>
          </div>
        </div>

        <div className={cn('rounded-2xl border p-4', isDark ? 'bg-white/5 border-white/15' : 'bg-white border-gray-200')}>
          <h1 className="text-2xl font-bold">Badge Catalog Manager</h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-gray-300' : 'text-gray-600')}>
            แก้ไขข้อมูล badge ได้ทันทีจากหน้านี้ แล้วกดบันทึกราย badge
          </p>
        </div>

        <div className="space-y-3">
          {badges.map((badge, index) => (
            <div
              key={badge.badgeId}
              className={cn('rounded-2xl border p-4 space-y-3', isDark ? 'bg-[#11151e] border-white/15' : 'bg-white border-gray-200')}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">{badge.badgeId}</h2>
                <button
                  type="button"
                  onClick={() => saveBadge(badge)}
                  disabled={isSaving === badge.badgeId}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white',
                    'bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90',
                    isSaving === badge.badgeId && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <Save className="w-4 h-4" />
                  {isSaving === badge.badgeId ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  <span className={cn(isDark ? 'text-gray-300' : 'text-gray-600')}>ชื่อ EN</span>
                  <input
                    value={badge.nameEn}
                    onChange={(e) => updateField(index, 'nameEn', e.target.value)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 outline-none',
                      isDark ? 'bg-black/50 border-white/15' : 'bg-white border-gray-300'
                    )}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className={cn(isDark ? 'text-gray-300' : 'text-gray-600')}>ชื่อ TH</span>
                  <input
                    value={badge.nameTh}
                    onChange={(e) => updateField(index, 'nameTh', e.target.value)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 outline-none',
                      isDark ? 'bg-black/50 border-white/15' : 'bg-white border-gray-300'
                    )}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className={cn(isDark ? 'text-gray-300' : 'text-gray-600')}>Icon</span>
                  <input
                    value={badge.icon}
                    onChange={(e) => updateField(index, 'icon', e.target.value)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 outline-none',
                      isDark ? 'bg-black/50 border-white/15' : 'bg-white border-gray-300'
                    )}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className={cn(isDark ? 'text-gray-300' : 'text-gray-600')}>Category</span>
                  <select
                    value={badge.category}
                    onChange={(e) => updateField(index, 'category', e.target.value as EditableBadge['category'])}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 outline-none',
                      isDark ? 'bg-black/50 border-white/15' : 'bg-white border-gray-300'
                    )}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className={cn(isDark ? 'text-gray-300' : 'text-gray-600')}>Target</span>
                  <input
                    type="number"
                    min={1}
                    value={badge.target}
                    onChange={(e) => updateField(index, 'target', Number(e.target.value) || 1)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 outline-none',
                      isDark ? 'bg-black/50 border-white/15' : 'bg-white border-gray-300'
                    )}
                  />
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className={cn(isDark ? 'text-gray-300' : 'text-gray-600')}>Requirement</span>
                  <input
                    value={badge.requirement}
                    onChange={(e) => updateField(index, 'requirement', e.target.value)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 outline-none',
                      isDark ? 'bg-black/50 border-white/15' : 'bg-white border-gray-300'
                    )}
                  />
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className={cn(isDark ? 'text-gray-300' : 'text-gray-600')}>Description</span>
                  <textarea
                    value={badge.description}
                    onChange={(e) => updateField(index, 'description', e.target.value)}
                    rows={2}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 outline-none',
                      isDark ? 'bg-black/50 border-white/15' : 'bg-white border-gray-300'
                    )}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
