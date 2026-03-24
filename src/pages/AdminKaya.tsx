// Admin Dashboard - KAYA Fitness App
// Access: URL-only (/admin-kaya), no buttons/links in app
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  isAdmin,
  initializeAdminConfig,
  logAdminAction,
  listAdminAuditLogs,
  getAdminDashboardStats,
  getAllUsers,
  searchUsers,
  banUser,
  unbanUser,
  getUserFullData,
  listCollectionDocs,
  getDocument,
  updateDocument,
  deleteDocument,
  createDocument,
  listSubcollection,
  listStorageFiles,
  deleteStorageFile,
  getStorageFileDetails,
  getAdminIds,
  addAdminId,
  removeAdminId,
  setAdminActorContext,
  ALL_COLLECTIONS,
  type AdminAuditLogEntry,
  type StorageItem,
} from '@/lib/adminFirestore';
import {
  ensureBadgeCatalogSeeded,
  getBadgeProgressSnapshot,
  getBadgeCatalog,
  getUserBadges,
  upsertBadgeCatalogItem,
  type BadgeProgressSnapshot,
  type FirestoreBadgeCatalogItem,
} from '@/lib/firestore';
import { toast } from 'sonner';

// shadcn/ui
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Icons
import {
  Shield, Users, Trophy, Utensils, Gamepad2, FolderOpen, Database,
  Settings, RefreshCw, Search, Ban, Eye, Trash2, Plus, Home,
  Loader2, ChevronRight, ArrowLeft, Download, Image,
  UserX, UserCheck, Edit3, Save, X, AlertTriangle, FileText, Folder,
  Activity, TrendingUp, Fish, MousePointer, Hammer,
  LayoutDashboard, Crown, Zap, Award, CalendarDays, History,
} from 'lucide-react';

// ==================== HELPERS ====================
const formatTimestamp = (ts: unknown): string => {
  if (!ts) return '-';
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate().toLocaleString('th-TH');
  }
  if (typeof ts === 'string') return ts;
  return String(ts);
};

const truncate = (s: unknown, len = 40): string => {
  if (!s) return '-';
  const str = String(s);
  return str.length > len ? str.slice(0, len) + '...' : str;
};

const toDateFromUnknown = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const formatReadableValue = (value: unknown): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString() : String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') return `Object(${Object.keys(value as Record<string, unknown>).length})`;
  return String(value);
};

const prettyFieldLabel = (key: string): string =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
};

const exportRowsToCsv = (filename: string, rows: Array<Record<string, unknown>>): void => {
  if (rows.length === 0) {
    toast.error('ไม่มีข้อมูลสำหรับ export');
    return;
  }

  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));

  const csv = [
    headers.map((header) => escapeCsvCell(header)).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const getBadgeProgressValue = (badgeId: string, snapshot: BadgeProgressSnapshot): number => {
  if (badgeId === 'workout_first' || /^workout_\d+_sessions$/.test(badgeId)) {
    return snapshot.totalWorkouts;
  }
  if (/^workout_\d+_minutes$/.test(badgeId)) {
    return snapshot.totalWorkoutTime;
  }
  if (/^workout_\d+_calories$/.test(badgeId)) {
    return snapshot.totalCaloriesBurned;
  }
  if (/^workout_streak_current_\d+$/.test(badgeId)) {
    return snapshot.currentWorkoutStreak24h;
  }
  if (/^workout_streak_record_\d+$/.test(badgeId)) {
    return snapshot.bestWorkoutStreak24h;
  }
  if (badgeId === 'game_first' || /^game_\d+_sessions$/.test(badgeId)) {
    return snapshot.totalGamesPlayed;
  }
  if (badgeId === 'nutrition_first_log' || /^nutrition_\d+_logs$/.test(badgeId)) {
    return snapshot.totalNutritionLogs;
  }
  if (badgeId === 'nutrition_hydration_goal') {
    return snapshot.hydrationGoalDays > 0 ? 1 : 0;
  }
  if (/^nutrition_hydration_\d+_days$/.test(badgeId)) {
    return snapshot.hydrationGoalDays;
  }
  return 0;
};

// ==================== MAIN COMPONENT ====================
export default function AdminKaya() {
  const { lineProfile, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (lineProfile?.userId) {
      setAdminActorContext({
        userId: lineProfile.userId,
        displayName: lineProfile.displayName || 'Admin',
      });
    }

    const checkAccess = async () => {
      if (!lineProfile?.userId) {
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const result = await isAdmin(lineProfile.userId);
        setIsAdminUser(result);

        if (result) {
          await initializeAdminConfig();
        }
      } catch (error) {
        console.warn('Admin access check failed:', error);
        setIsAdminUser(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };
    if (isAuthenticated && lineProfile) checkAccess();
    else if (!authLoading) setIsCheckingAdmin(false);
  }, [lineProfile, isAuthenticated, authLoading]);

  if (isCheckingAdmin || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="text-gray-400 text-sm">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0f1117]">
        <h1 className="text-4xl font-bold text-white">404</h1>
        <p className="text-gray-400 text-lg">ไม่พบหน้านี้</p>
        <a href="/dashboard" className="text-orange-400 hover:text-orange-300 text-sm hover:underline">กลับสู่หน้าหลัก</a>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'users', label: 'ผู้ใช้', icon: Users },
    { id: 'badges', label: 'แบดจ์', icon: Award },
    { id: 'challenges', label: 'ชาเลนจ์', icon: Trophy },
    { id: 'content', label: 'เนื้อหา', icon: Utensils },
    { id: 'games', label: 'เกม', icon: Gamepad2 },
    { id: 'storage', label: 'ไฟล์', icon: FolderOpen },
    { id: 'firestore', label: 'ฐานข้อมูล', icon: Database },
    { id: 'audit', label: 'audit', icon: History },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#161822]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">KAYA Admin</h1>
              <p className="text-[10px] text-gray-500">ระบบจัดการแอพ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-400">{lineProfile?.displayName || 'Admin'}</span>
            </div>
            <a href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/[0.06] h-8 px-3 text-xs">
                <Home className="w-3.5 h-3.5 mr-1.5" />กลับแอพ
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 py-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab Navigation */}
          <ScrollArea className="w-full pb-1">
            <TabsList className="inline-flex h-auto gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-5">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-300 data-[state=inactive]:hover:bg-white/[0.04]',
                    'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/10',
                    'data-[state=active]:text-orange-400 data-[state=active]:shadow-[0_0_12px_rgba(249,115,22,0.15)]',
                    'data-[state=active]:border data-[state=active]:border-orange-500/20',
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="users"><UserManagementTab /></TabsContent>
          <TabsContent value="badges"><BadgeManagementTab /></TabsContent>
          <TabsContent value="challenges"><ChallengeManagementTab /></TabsContent>
          <TabsContent value="content"><ContentManagementTab /></TabsContent>
          <TabsContent value="games"><GameManagementTab /></TabsContent>
          <TabsContent value="storage"><StorageBrowserTab /></TabsContent>
          <TabsContent value="firestore"><FirestoreExplorerTab /></TabsContent>
          <TabsContent value="audit"><AuditLogsTab /></TabsContent>
          <TabsContent value="settings"><AdminSettingsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ==================== Shared Card Wrapper ====================
function GlassCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ==================== Shared DynamicViewer ====================
const DynamicViewer = ({ data }: { data: unknown }) => {
  if (data === null || data === undefined) return <span className="text-gray-500 italic">null</span>;
  if (typeof data !== 'object') return <span>{String(data)}</span>;
  return (
    <pre className="text-[11px] font-mono bg-black/30 p-3 rounded-lg text-gray-300 overflow-x-auto whitespace-pre-wrap word-break">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

// ==================== Shared RecursiveEditor ====================
const RecursiveEditor = ({ data, onChange }: { data: Record<string, unknown>; onChange: (newData: Record<string, unknown>) => void }) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(data, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(data, null, 2));
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setError(null);
      onChange(parsed);
    } catch (err) {
      setError("Invalid JSON format");
    }
  };

  return (
    <div className="w-full">
      <textarea 
        className={cn("w-full h-64 font-mono text-sm leading-6 p-4 bg-black/40 border rounded-xl text-gray-200 outline-none transition-colors", error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-white/20")}
        value={jsonText}
        onChange={handleChange}
        spellCheck={false}
      />
      {error && <p className="text-red-400 text-xs mt-2 ml-1">{error}</p>}
    </div>
  );
};

// ==================== TAB 1: DASHBOARD ====================
function DashboardTab() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);
  const [growthMode, setGrowthMode] = useState<'cumulative' | 'daily'>('cumulative');
  const [growthDays, setGrowthDays] = useState<7 | 30 | 90>(30);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [s, users] = await Promise.all([
        getAdminDashboardStats(),
        getAllUsers(2000),
      ]);
      setStats(s);
      setAllUsers(users);
    } catch (e: unknown) {
      toast.error('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const statCards = [
    { label: 'ผู้ใช้ทั้งหมด', key: 'totalUsers', icon: Users, gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-500/10' },
    { label: 'ใช้งานวันนี้', key: 'activeToday', icon: Activity, gradient: 'from-emerald-500 to-green-400', bg: 'bg-emerald-500/10' },
    { label: 'ออกกำลังกาย', key: 'totalWorkouts', icon: Zap, gradient: 'from-orange-500 to-amber-400', bg: 'bg-orange-500/10' },
    { label: 'ชาเลนจ์', key: 'totalChallengeTemplates', icon: Trophy, gradient: 'from-purple-500 to-pink-400', bg: 'bg-purple-500/10' },
    { label: 'คะแนนเกม', key: 'totalGameScores', icon: Gamepad2, gradient: 'from-pink-500 to-rose-400', bg: 'bg-pink-500/10' },
    { label: 'สแกนอาหาร', key: 'totalNutritionScans', icon: Image, gradient: 'from-cyan-500 to-blue-400', bg: 'bg-cyan-500/10' },
    { label: 'อาหารในระบบ', key: 'totalFoodItems', icon: Utensils, gradient: 'from-yellow-500 to-orange-400', bg: 'bg-yellow-500/10' },
    { label: 'ผู้เล่นตกปลา', key: 'totalFishingPlayers', icon: Fish, gradient: 'from-teal-500 to-cyan-400', bg: 'bg-teal-500/10' },
  ];

  const growthRange = useMemo(() => {
    if (!useCustomRange) {
      const end = new Date();
      end.setHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(end.getDate() - (growthDays - 1));
      return {
        start,
        end,
        valid: true,
        error: null as string | null,
      };
    }

    const start = new Date(customStart);
    const end = new Date(customEnd);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { start, end, valid: false, error: 'วันที่ไม่ถูกต้อง' };
    }
    if (end < start) {
      return { start, end, valid: false, error: 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม' };
    }

    const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    if (diffDays > 90) {
      return { start, end, valid: false, error: 'เลือกช่วงเวลาได้ไม่เกิน 90 วัน' };
    }

    return {
      start,
      end,
      valid: true,
      error: null as string | null,
    };
  }, [useCustomRange, growthDays, customStart, customEnd]);

  const userGrowth = useMemo(() => {
    if (!growthRange.valid) return [] as Array<{ label: string; count: number; showTick: boolean; added: number }>;

    const totalDays = Math.floor((growthRange.end.getTime() - growthRange.start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const dayBuckets = Array.from({ length: totalDays }, (_, index) => {
      const d = new Date(growthRange.start);
      d.setDate(growthRange.start.getDate() + index);
      const key = d.toISOString().slice(0, 10);
      return {
        key,
        date: d,
        count: 0,
      };
    });

    const bucketMap = new Map(dayBuckets.map((bucket) => [bucket.key, bucket]));
    let baselineUsers = 0;

    allUsers.forEach((user) => {
      const sourceDate = toDateFromUnknown(user.data.createdAt)
        || toDateFromUnknown(user.data.firstLoginAt)
        || toDateFromUnknown(user.data.lastLoginAt);
      if (!sourceDate) return;

      const normalized = new Date(sourceDate);
      normalized.setHours(0, 0, 0, 0);

      if (normalized < growthRange.start) {
        baselineUsers += 1;
        return;
      }

      const key = normalized.toISOString().slice(0, 10);
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.count += 1;
      }
    });

    let runningTotal = baselineUsers;
    return dayBuckets.map((bucket, index) => {
      const label = totalDays <= 14
        ? bucket.date.toLocaleDateString('th-TH', { weekday: 'short' })
        : `${String(bucket.date.getDate()).padStart(2, '0')}/${String(bucket.date.getMonth() + 1).padStart(2, '0')}`;
      const showTick = totalDays <= 10 || index === 0 || index === dayBuckets.length - 1 || index % Math.ceil(totalDays / 6) === 0;
      runningTotal += bucket.count;
      return {
        label,
        count: runningTotal,
        showTick,
        added: bucket.count,
      };
    });
  }, [allUsers, growthRange]);

  const latestTotalUsers = useMemo(() => {
    if (!userGrowth.length) return 0;
    return userGrowth[userGrowth.length - 1].count;
  }, [userGrowth]);

  const periodAddedUsers = useMemo(() => {
    return userGrowth.reduce((sum, point) => sum + point.added, 0);
  }, [userGrowth]);

  const getGrowthValue = useCallback((point: { count: number; added: number }) => {
    return growthMode === 'cumulative' ? point.count : point.added;
  }, [growthMode]);

  const maxGrowth = useMemo(() => {
    if (!userGrowth.length) return 1;
    return Math.max(...userGrowth.map((point) => getGrowthValue(point)), 1);
  }, [userGrowth, getGrowthValue]);

  const linePoints = useMemo(() => {
    if (userGrowth.length === 0) return '';
    if (userGrowth.length === 1) {
      const y = 44 - (getGrowthValue(userGrowth[0]) / maxGrowth) * 40;
      return `0,${Math.max(2, y)}`;
    }

    return userGrowth.map((point, index) => {
      const x = (index / (userGrowth.length - 1)) * 100;
      const y = 44 - (getGrowthValue(point) / maxGrowth) * 40;
      return `${x},${Math.max(2, y)}`;
    }).join(' ');
  }, [userGrowth, maxGrowth, getGrowthValue]);

  return (
    <div>
      <SectionHeader
        title="ภาพรวมระบบ"
        subtitle="สถิติการใช้งานทั้งหมดของ KAYA"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="text-gray-400 hover:text-white hover:bg-white/[0.06] h-8 gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span className="text-xs">รีเฟรช</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, key, icon: Icon, gradient, bg }) => (
          <GlassCard key={key} className="p-4 group hover:border-white/[0.12] transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={cn('w-4.5 h-4.5 bg-gradient-to-r bg-clip-text', gradient)} style={{ color: 'transparent', backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                <Icon className={cn('w-4 h-4 absolute opacity-100')} style={{ color: `hsl(var(--tw-gradient-from))` }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">
              {loading ? (
                <span className="inline-block w-12 h-7 rounded-md bg-white/[0.06] animate-pulse" />
              ) : (
                stats?.[key]?.toLocaleString() ?? '0'
              )}
            </p>
            <p className="text-[11px] text-gray-500">{label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-5 p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-white">
              {growthMode === 'cumulative' ? 'แนวโน้มผู้ใช้สะสมทั้งหมด (กราฟเส้น)' : 'แนวโน้มผู้ใช้ใหม่รายวัน (กราฟเส้น)'}
            </h3>
            <p className="text-sm md:text-base text-gray-400">
              {growthMode === 'cumulative'
                ? 'แสดงยอดผู้ใช้สะสมทั้งหมดจาก createdAt / firstLoginAt / lastLoginAt'
                : 'แสดงจำนวนผู้ใช้ใหม่รายวันจาก createdAt / firstLoginAt / lastLoginAt'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
              <button
                onClick={() => setGrowthMode('cumulative')}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-xs transition-colors',
                  growthMode === 'cumulative'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                )}
              >
                ยอดสะสมทั้งหมด
              </button>
              <button
                onClick={() => setGrowthMode('daily')}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-xs transition-colors',
                  growthMode === 'daily'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                )}
              >
                ผู้ใช้ใหม่รายวัน
              </button>
            </div>
            <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    setUseCustomRange(false);
                    setGrowthDays(days as 7 | 30 | 90);
                  }}
                  className={cn(
                    'px-2.5 py-1.5 rounded-md text-xs transition-colors',
                    !useCustomRange && growthDays === days
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                  )}
                >
                  {days} วัน
                </button>
              ))}
              <button
                onClick={() => setUseCustomRange(true)}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1',
                  useCustomRange
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
                )}
              >
                <CalendarDays className="w-3 h-3" />กำหนดเอง
              </button>
            </div>
            <div className="text-base text-gray-300">
              {growthMode === 'cumulative'
                ? `รวมทั้งหมด ${latestTotalUsers.toLocaleString()} คน (+${periodAddedUsers.toLocaleString()} ในช่วงที่เลือก)`
                : `ผู้ใช้ใหม่รวม ${periodAddedUsers.toLocaleString()} คนในช่วงที่เลือก`}
            </div>
          </div>
        </div>

        {useCustomRange && (
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">เริ่ม</p>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-9 text-sm bg-white/[0.03] border-white/[0.08] text-gray-200"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">สิ้นสุด</p>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-9 text-sm bg-white/[0.03] border-white/[0.08] text-gray-200"
              />
            </div>
            {growthRange.error && <p className="text-xs text-red-400 pb-2">{growthRange.error}</p>}
          </div>
        )}

        {loading ? (
          <div className="h-36 rounded-xl bg-white/[0.03] animate-pulse" />
        ) : (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 md:p-4">
            <svg viewBox="0 0 100 48" className="w-full h-48 md:h-56">
              <defs>
                <linearGradient id="growthLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <line x1="0" y1="44" x2="100" y2="44" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
              <polyline
                points={linePoints}
                fill="none"
                stroke="url(#growthLine)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {userGrowth.map((point, index) => {
                const x = userGrowth.length <= 1 ? 0 : (index / (userGrowth.length - 1)) * 100;
                const pointValue = getGrowthValue(point);
                const y = Math.max(2, 44 - (pointValue / maxGrowth) * 40);
                const isEdge = index === 0 || index === userGrowth.length - 1;
                const prevValue = index > 0 ? getGrowthValue(userGrowth[index - 1]) : pointValue;
                const changedFromPrevious = index > 0 && pointValue !== prevValue;
                const shouldShowValue = pointValue > 0 && (isEdge || (point.showTick && changedFromPrevious));
                return (
                  <g key={`${point.label}-${index}`}>
                    <circle cx={x} cy={y} r="1.1" fill="#fb923c" />
                    {shouldShowValue && (
                      <text x={x} y={Math.max(3, y - 2)} fill="#fdba74" fontSize="3.8" textAnchor="middle">
                        {pointValue}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${userGrowth.length}, minmax(0, 1fr))` }}>
              {userGrowth.map((point, index) => (
                <span
                  key={`tick-${point.label}-${index}`}
                  className={cn('text-center text-xs md:text-sm text-gray-400 whitespace-nowrap', !point.showTick && 'opacity-0')}
                >
                  {point.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Quick Actions */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">เข้าถึงด่วน</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'จัดการผู้ใช้', icon: Users, tab: 'users' },
            { label: 'จัดการแบดจ์', icon: Award, tab: 'badges' },
            { label: 'ดูเกม & คะแนน', icon: Gamepad2, tab: 'games' },
            { label: 'แก้ไขชาเลนจ์', icon: Trophy, tab: 'challenges' },
            { label: 'ตั้งค่าแอดมิน', icon: Shield, tab: 'settings' },
          ].map(item => (
            <button
              key={item.tab}
              onClick={() => {
                const tabList = document.querySelector('[role="tablist"]');
                const trigger = tabList?.querySelector(`[data-value="${item.tab}"]`) as HTMLElement | null;
                trigger?.click();
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <item.icon className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-xs text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== TAB 2: USER MANAGEMENT ====================
function UserManagementTab() {
  const [users, setUsers] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; data: Record<string, unknown> } | null>(null);
  const [userFullData, setUserFullData] = useState<Record<string, unknown> | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banTarget, setBanTarget] = useState<string>('');
  const [banReason, setBanReason] = useState('');
  const [editingUser, setEditingUser] = useState<{ id: string; field: string; value: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const u = searchTerm ? await searchUsers(searchTerm) : await getAllUsers();
      setUsers(u);
    } catch (e: unknown) {
      toast.error('โหลดผู้ใช้ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(), searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadUsers, searchTerm]);

  const handleViewUser = async (userId: string) => {
    try {
      const full = await getUserFullData(userId);
      setUserFullData(full);
      setSelectedUser(users.find(u => u.id === userId) || null);
      setShowUserDialog(true);
    } catch (e: unknown) {
      toast.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ');
    }
  };

  const handleBan = async () => {
    if (!banTarget) return;
    try {
      await banUser(banTarget, banReason);
      toast.success('แบนผู้ใช้สำเร็จ');
      setShowBanDialog(false);
      setBanReason('');
      loadUsers();
    } catch (e: unknown) {
      toast.error('แบนไม่สำเร็จ');
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await unbanUser(userId);
      toast.success('ปลดแบนสำเร็จ');
      loadUsers();
    } catch (e: unknown) {
      toast.error('ปลดแบนไม่สำเร็จ');
    }
  };

  const handleQuickEdit = async (userId: string, field: string, value: string) => {
    try {
      let parsedValue: unknown = value;
      if (['points', 'streakDays'].includes(field)) parsedValue = Number(value);
      await updateDocument('users', userId, { [field]: parsedValue });
      toast.success(`อัพเดต ${field} สำเร็จ`);
      setEditingUser(null);
      loadUsers();
    } catch (e: unknown) {
      toast.error('อัพเดตไม่สำเร็จ');
    }
  };

  const handleExportUsersCsv = () => {
    const rows = users.map((user) => ({
      userId: user.id,
      displayName: String(user.data.displayName || ''),
      nickname: String(user.data.nickname || ''),
      tier: String(user.data.tier || ''),
      points: Number(user.data.points || 0),
      streakDays: Number(user.data.streakDays || 0),
      banned: user.data.banned === true ? 'true' : 'false',
      lastLoginAt: formatTimestamp(user.data.lastLoginAt),
      createdAt: formatTimestamp(user.data.createdAt),
    }));
    exportRowsToCsv(`kaya-users-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const tierColors: Record<string, string> = {
    bronze: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    silver: 'bg-gray-400/10 text-gray-300 border-gray-400/20',
    gold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    platinum: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    diamond: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    master: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
  };

  return (
    <div>
      <SectionHeader
        title="จัดการผู้ใช้"
        subtitle={`ทั้งหมด ${users.length} คน`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportUsersCsv} className="h-8 text-xs border-white/[0.1] text-gray-300 hover:text-white hover:bg-white/[0.06]">
              <Download className="w-3.5 h-3.5 mr-1" />CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={loadUsers} disabled={loading} className="text-gray-400 hover:text-white hover:bg-white/[0.06] h-8">
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="ค้นหาชื่อ, ชื่อเล่น, หรือ ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/[0.03] border-white/[0.08] text-gray-200 placeholder:text-gray-600 focus:border-orange-500/40 h-10 rounded-xl"
        />
      </div>

      {/* User Cards (mobile-friendly) */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">ไม่พบผู้ใช้</p>
          </div>
        ) : users.map(u => {
          const tier = String(u.data.tier || 'bronze');
          return (
            <GlassCard key={u.id} className="p-3 hover:border-white/[0.12] transition-all">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {u.data.pictureUrl ? (
                  <img src={String(u.data.pictureUrl)} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/[0.06]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/20 flex items-center justify-center text-sm font-bold text-orange-300">
                    {String(u.data.displayName || '?').charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-white truncate">{String(u.data.displayName || '-')}</p>
                    {u.data.banned && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">แบนแล้ว</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', tierColors[tier] || tierColors.bronze)}>
                      {tier.toUpperCase()}
                    </span>
                    {editingUser?.id === u.id && editingUser?.field === 'points' ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={editingUser.value}
                          onChange={e => setEditingUser({ ...editingUser, value: e.target.value })}
                          className="h-6 w-16 text-[10px] bg-white/[0.05] border-white/[0.1] text-white rounded-md"
                        />
                        <button onClick={() => handleQuickEdit(u.id, 'points', editingUser.value)} className="text-emerald-400 hover:text-emerald-300"><Save className="w-3 h-3" /></button>
                        <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-gray-300"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingUser({ id: u.id, field: 'points', value: String(u.data.points || 0) })}
                        className="text-[10px] text-gray-500 hover:text-orange-400 transition-colors"
                      >
                        {Number(u.data.points || 0).toLocaleString()} pts
                      </button>
                    )}
                    <span className="text-[10px] text-gray-600">{formatTimestamp(u.data.lastLoginAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg" onClick={() => handleViewUser(u.id)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  {u.data.banned ? (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg" onClick={() => handleUnban(u.id)}>
                      <UserCheck className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg" onClick={() => { setBanTarget(u.id); setShowBanDialog(true); }}>
                      <UserX className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              {selectedUser?.data.pictureUrl && <img src={String(selectedUser.data.pictureUrl)} alt="" className="w-10 h-10 rounded-full" />}
              {String(selectedUser?.data.displayName || 'ผู้ใช้')}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-gray-500">{selectedUser?.id}</DialogDescription>
          </DialogHeader>
          {userFullData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-gray-500">Tier</p>
                  <p className="text-sm font-semibold text-white uppercase">{String((userFullData.profile as Record<string, unknown> | null)?.tier || '-') }</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-gray-500">Points</p>
                  <p className="text-sm font-semibold text-white">{Number((userFullData.profile as Record<string, unknown> | null)?.points || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-gray-500">Streak</p>
                  <p className="text-sm font-semibold text-white">{Number((userFullData.profile as Record<string, unknown> | null)?.streakDays || 0)} วัน</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-gray-500">Workouts</p>
                  <p className="text-sm font-semibold text-white">{Array.isArray(userFullData.workouts) ? userFullData.workouts.length : 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-gray-500">Badges</p>
                  <p className="text-sm font-semibold text-white">{Array.isArray(userFullData.badges) ? userFullData.badges.length : 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-gray-500">Last Login</p>
                  <p className="text-xs font-semibold text-white">{formatTimestamp((userFullData.profile as Record<string, unknown> | null)?.lastLoginAt)}</p>
                </div>
              </div>

              {Object.entries(userFullData).map(([section, data]) => {
                if (!data || (Array.isArray(data) && data.length === 0)) return null;
                const sectionLabels: Record<string, string> = {
                  profile: 'โปรไฟล์', health: 'สุขภาพ', settings: 'การตั้งค่า',
                  workouts: 'ออกกำลังกาย', nutrition: 'โภชนาการ', scans: 'สแกน',
                  badges: 'เหรียญตรา', challengeProgress: 'ความก้าวหน้าชาเลนจ์',
                  gameStats: 'สถิติเกม', fishingPlayer: 'การตกปลา',
                };
                return (
                  <div key={section} className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-xs text-gray-300">{sectionLabels[section] || section}</h4>
                        <span className="text-[10px] text-gray-500">
                          {Array.isArray(data) ? `${data.length} รายการ` : 'เอกสารเดี่ยว'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <DynamicViewer data={data} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent className="bg-[#1a1d2e] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white"><Ban className="w-5 h-5 text-red-400" />แบนผู้ใช้</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              คุณต้องการแบนผู้ใช้ <code className="text-xs text-orange-400">{banTarget.slice(0, 16)}...</code> หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input placeholder="เหตุผลในการแบน (ไม่จำเป็น)" value={banReason} onChange={e => setBanReason(e.target.value)}
            className="bg-white/[0.03] border-white/[0.08] text-gray-200 placeholder:text-gray-600" />
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-gray-300 hover:bg-white/[0.1] hover:text-white">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleBan} className="bg-red-600 hover:bg-red-700 text-white">แบนผู้ใช้</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BadgeManagementTab() {
  const [badges, setBadges] = useState<FirestoreBadgeCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FirestoreBadgeCatalogItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [disableTarget, setDisableTarget] = useState<FirestoreBadgeCatalogItem | null>(null);
  const [disableImpact, setDisableImpact] = useState<{ sampleSize: number; eligibleNow: number; alreadyEarned: number; wouldBeBlocked: number } | null>(null);
  const [loadingDisableImpact, setLoadingDisableImpact] = useState(false);
  const [newBadge, setNewBadge] = useState({
    badgeId: '',
    nameTh: '',
    nameEn: '',
    icon: '🏅',
    category: 'workout' as 'workout' | 'game' | 'nutrition',
    target: 1,
    description: '',
    requirement: '',
    active: true,
  });

  const loadBadges = useCallback(async () => {
    setLoading(true);
    try {
      await ensureBadgeCatalogSeeded();
      const catalog = await getBadgeCatalog();
      setBadges(catalog);
    } catch (error) {
      toast.error('โหลด badge catalog ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const filtered = badges.filter((badge) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      badge.badgeId.toLowerCase().includes(q)
      || badge.nameTh.toLowerCase().includes(q)
      || badge.nameEn.toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await upsertBadgeCatalogItem(selected.badgeId, {
        badgeId: selected.badgeId,
        nameEn: selected.nameEn,
        nameTh: selected.nameTh,
        description: selected.description,
        icon: selected.icon,
        requirement: selected.requirement,
        category: selected.category,
        target: selected.target,
        active: selected.active !== false,
      });
      await logAdminAction('badge.update', 'แก้ไขแบดจ์', {
        targetCollection: 'badgeCatalog',
        targetId: selected.badgeId,
        details: {
          active: selected.active !== false,
          category: selected.category,
          target: selected.target,
        },
      });
      toast.success('บันทึก badge สำเร็จ');
      setSelected(null);
      await loadBadges();
    } catch (error) {
      toast.error('บันทึก badge ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const badgeId = newBadge.badgeId.trim();
    if (!badgeId) {
      toast.error('กรุณาใส่ badgeId');
      return;
    }
    if (!newBadge.nameTh.trim() || !newBadge.nameEn.trim()) {
      toast.error('กรุณาใส่ชื่อแบดจ์ TH/EN');
      return;
    }

    const duplicated = badges.some((badge) => badge.badgeId.toLowerCase() === badgeId.toLowerCase());
    if (duplicated) {
      toast.error('badgeId นี้มีอยู่แล้ว');
      return;
    }

    try {
      setSaving(true);
      await upsertBadgeCatalogItem(badgeId, {
        badgeId,
        nameEn: newBadge.nameEn,
        nameTh: newBadge.nameTh,
        description: newBadge.description,
        icon: newBadge.icon,
        requirement: newBadge.requirement,
        category: newBadge.category,
        target: Number(newBadge.target) || 1,
        active: newBadge.active,
      });
      await logAdminAction('badge.create', 'สร้างแบดจ์ใหม่', {
        targetCollection: 'badgeCatalog',
        targetId: badgeId,
        details: {
          active: newBadge.active,
          category: newBadge.category,
          target: Number(newBadge.target) || 1,
        },
      });
      toast.success('สร้างแบดจ์ใหม่สำเร็จ');
      setShowCreateDialog(false);
      setNewBadge({
        badgeId: '',
        nameTh: '',
        nameEn: '',
        icon: '🏅',
        category: 'workout',
        target: 1,
        description: '',
        requirement: '',
        active: true,
      });
      await loadBadges();
    } catch (error) {
      toast.error('สร้างแบดจ์ใหม่ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleExportBadgesCsv = () => {
    const rows = badges.map((badge) => ({
      badgeId: badge.badgeId,
      nameTh: badge.nameTh,
      nameEn: badge.nameEn,
      category: badge.category,
      target: badge.target,
      active: badge.active === false ? 'false' : 'true',
      requirement: badge.requirement,
      description: badge.description,
    }));
    exportRowsToCsv(`kaya-badges-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const estimateDisableImpact = async (badge: FirestoreBadgeCatalogItem) => {
    setLoadingDisableImpact(true);
    setDisableImpact(null);
    try {
      const sampleUsers = await getAllUsers(300);
      const batchSize = 12;
      let eligibleNow = 0;
      let alreadyEarned = 0;
      let wouldBeBlocked = 0;

      for (let i = 0; i < sampleUsers.length; i += batchSize) {
        const batch = sampleUsers.slice(i, i + batchSize);
        const batchResult = await Promise.all(batch.map(async (user) => {
          const [snapshot, earned] = await Promise.all([
            getBadgeProgressSnapshot(user.id),
            getUserBadges(user.id),
          ]);
          const target = Number(badge.target) || 1;
          const progress = getBadgeProgressValue(badge.badgeId, snapshot);
          const meetsTarget = progress >= target;
          const hasEarned = earned.some((item) => item.badgeId === badge.badgeId);
          return { meetsTarget, hasEarned };
        }));

        batchResult.forEach((item) => {
          if (!item.meetsTarget) return;
          eligibleNow += 1;
          if (item.hasEarned) {
            alreadyEarned += 1;
          } else {
            wouldBeBlocked += 1;
          }
        });
      }

      setDisableImpact({
        sampleSize: sampleUsers.length,
        eligibleNow,
        alreadyEarned,
        wouldBeBlocked,
      });
    } catch {
      toast.error('คำนวณผลกระทบไม่สำเร็จ');
    } finally {
      setLoadingDisableImpact(false);
    }
  };

  const confirmDisableBadge = async () => {
    if (!disableTarget) return;
    try {
      setSaving(true);
      await upsertBadgeCatalogItem(disableTarget.badgeId, {
        badgeId: disableTarget.badgeId,
        nameEn: disableTarget.nameEn,
        nameTh: disableTarget.nameTh,
        description: disableTarget.description,
        icon: disableTarget.icon,
        requirement: disableTarget.requirement,
        category: disableTarget.category,
        target: Number(disableTarget.target) || 1,
        active: false,
      });
      await logAdminAction('badge.disable', 'ปิดใช้งานแบดจ์', {
        targetCollection: 'badgeCatalog',
        targetId: disableTarget.badgeId,
        details: disableImpact || undefined,
      });
      toast.success('ปิดใช้งานแบดจ์แล้ว');
      setDisableTarget(null);
      setDisableImpact(null);
      await loadBadges();
    } catch {
      toast.error('ปิดใช้งานแบดจ์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (badge: FirestoreBadgeCatalogItem) => {
    if (badge.active !== false) {
      setDisableTarget(badge);
      estimateDisableImpact(badge);
      return;
    }

    try {
      setSaving(true);
      await upsertBadgeCatalogItem(badge.badgeId, {
        badgeId: badge.badgeId,
        nameEn: badge.nameEn,
        nameTh: badge.nameTh,
        description: badge.description,
        icon: badge.icon,
        requirement: badge.requirement,
        category: badge.category,
        target: Number(badge.target) || 1,
        active: true,
      });
      await logAdminAction('badge.enable', 'เปิดใช้งานแบดจ์', {
        targetCollection: 'badgeCatalog',
        targetId: badge.badgeId,
      });
      toast.success('เปิดใช้งานแบดจ์แล้ว');
      await loadBadges();
    } catch {
      toast.error('เปลี่ยนสถานะแบดจ์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="จัดการแบดจ์"
        subtitle={`ทั้งหมด ${badges.length} รายการ`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportBadgesCsv} className="h-9 px-3 text-xs border-white/[0.1] text-gray-300 hover:text-white hover:bg-white/[0.06]">
              <Download className="w-3.5 h-3.5 mr-1" />CSV
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white h-9 px-4 text-sm rounded-lg">
              <Plus className="w-4 h-4 mr-1" />สร้างใหม่
            </Button>
            <Button variant="ghost" size="sm" onClick={loadBadges} disabled={loading} className="text-gray-300 hover:text-white hover:bg-white/[0.06] h-9">
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
          </div>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="ค้นหา badgeId / ชื่อไทย / ชื่ออังกฤษ"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/[0.03] border-white/[0.08] text-gray-200 placeholder:text-gray-600 focus:border-orange-500/40 h-10 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">ไม่พบแบดจ์</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((badge) => (
            <GlassCard key={badge.badgeId} className="p-4 hover:border-white/[0.12] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-lg">
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-base text-white truncate">{badge.nameTh}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-white/[0.03] border-white/[0.08] text-gray-300">{badge.category}</span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full border',
                        badge.active === false
                          ? 'bg-red-500/10 border-red-500/20 text-red-300'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      )}
                    >
                      {badge.active === false ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{badge.badgeId} • target {badge.target}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={badge.active !== false}
                    disabled={saving}
                    onCheckedChange={() => handleToggleActive(badge)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg" onClick={() => setSelected(badge)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-xl bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-white">สร้างแบดจ์ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Badge ID</label>
              <Input value={newBadge.badgeId} onChange={(e) => setNewBadge({ ...newBadge, badgeId: e.target.value })} placeholder="เช่น monthly_master" className="bg-white/[0.03] border-white/[0.08] text-gray-200 font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">ชื่อ (TH)</label>
                <Input value={newBadge.nameTh} onChange={(e) => setNewBadge({ ...newBadge, nameTh: e.target.value })} className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">ชื่อ (EN)</label>
                <Input value={newBadge.nameEn} onChange={(e) => setNewBadge({ ...newBadge, nameEn: e.target.value })} className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Icon</label>
                <Input value={newBadge.icon} onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })} className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Category</label>
                <Select value={newBadge.category} onValueChange={(value: 'workout' | 'game' | 'nutrition') => setNewBadge({ ...newBadge, category: value })}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1d2e] border-white/[0.08]">
                    <SelectItem value="workout" className="text-gray-200">workout</SelectItem>
                    <SelectItem value="game" className="text-gray-200">game</SelectItem>
                    <SelectItem value="nutrition" className="text-gray-200">nutrition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Target</label>
                <Input type="number" value={newBadge.target} onChange={(e) => setNewBadge({ ...newBadge, target: Number(e.target.value) || 1 })} className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Description</label>
              <Textarea value={newBadge.description} onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })} className="bg-white/[0.03] border-white/[0.08] text-gray-200 min-h-[72px]" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Requirement</label>
              <Textarea value={newBadge.requirement} onChange={(e) => setNewBadge({ ...newBadge, requirement: e.target.value })} className="bg-white/[0.03] border-white/[0.08] text-gray-200 min-h-[72px]" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newBadge.active} onCheckedChange={(value) => setNewBadge({ ...newBadge, active: value })} className="data-[state=checked]:bg-emerald-500" />
              <span className="text-sm text-gray-300">เปิดใช้งานทันที</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-gray-300 hover:text-white">ยกเลิก</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}สร้าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-xl bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-white">แก้ไขแบดจ์</DialogTitle>
            <DialogDescription className="font-mono text-xs text-gray-500">{selected?.badgeId}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">ชื่อ (TH)</label>
                  <Input value={selected.nameTh} onChange={(e) => setSelected({ ...selected, nameTh: e.target.value })} className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">ชื่อ (EN)</label>
                  <Input value={selected.nameEn} onChange={(e) => setSelected({ ...selected, nameEn: e.target.value })} className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Icon</label>
                  <Input value={selected.icon} onChange={(e) => setSelected({ ...selected, icon: e.target.value })} className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Category</label>
                  <Select value={selected.category} onValueChange={(value: 'workout' | 'game' | 'nutrition') => setSelected({ ...selected, category: value })}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1d2e] border-white/[0.08]">
                      <SelectItem value="workout" className="text-gray-200">workout</SelectItem>
                      <SelectItem value="game" className="text-gray-200">game</SelectItem>
                      <SelectItem value="nutrition" className="text-gray-200">nutrition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Target</label>
                  <Input type="number" value={selected.target} onChange={(e) => setSelected({ ...selected, target: Number(e.target.value) || 1 })} className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Description</label>
                <Textarea value={selected.description} onChange={(e) => setSelected({ ...selected, description: e.target.value })} className="bg-white/[0.03] border-white/[0.08] text-gray-200 min-h-[72px]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Requirement</label>
                <Textarea value={selected.requirement} onChange={(e) => setSelected({ ...selected, requirement: e.target.value })} className="bg-white/[0.03] border-white/[0.08] text-gray-200 min-h-[72px]" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={selected.active !== false} onCheckedChange={(value) => setSelected({ ...selected, active: value })} className="data-[state=checked]:bg-emerald-500" />
                <span className="text-sm text-gray-300">เปิดใช้งานแบดจ์</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!disableTarget} onOpenChange={(open) => { if (!open) { setDisableTarget(null); setDisableImpact(null); } }}>
        <AlertDialogContent className="bg-[#1a1d2e] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">ยืนยันปิดใช้งานแบดจ์</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              แบดจ์ {disableTarget?.nameTh || disableTarget?.badgeId} จะไม่ถูกแจกให้ผู้ใช้ใหม่หลังจากนี้
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            {loadingDisableImpact ? (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />กำลังประเมินผลกระทบ...
              </div>
            ) : disableImpact ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
                  <p className="text-gray-500">จำนวนตัวอย่าง</p>
                  <p className="text-white font-semibold">{disableImpact.sampleSize.toLocaleString()} คน</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
                  <p className="text-gray-500">เข้าเงื่อนไขตอนนี้</p>
                  <p className="text-orange-300 font-semibold">{disableImpact.eligibleNow.toLocaleString()} คน</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
                  <p className="text-gray-500">ได้แบดจ์แล้ว</p>
                  <p className="text-emerald-300 font-semibold">{disableImpact.alreadyEarned.toLocaleString()} คน</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
                  <p className="text-gray-500">อาจถูกบล็อกหลังปิด</p>
                  <p className="text-red-300 font-semibold">{disableImpact.wouldBeBlocked.toLocaleString()} คน</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">ไม่สามารถประเมินผลกระทบได้</p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-gray-300 hover:bg-white/[0.1] hover:text-white">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableBadge} className="bg-red-600 hover:bg-red-700 text-white" disabled={saving || loadingDisableImpact}>
              ปิดใช้งานแบดจ์
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== TAB 3: CHALLENGE MANAGEMENT ====================
function ChallengeManagementTab() {
  const [templates, setTemplates] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', nameEn: '', nameTh: '', description: '', descriptionTh: '',
    type: 'daily', category: 'workout', target: 0, reward: 0, icon: '🏆', active: true,
  });

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const t = await listCollectionDocs('challengeTemplates', 100);
      setTemplates(t);
    } catch (e: unknown) {
      toast.error('โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const resetForm = () => {
    setForm({ name: '', nameEn: '', nameTh: '', description: '', descriptionTh: '', type: 'daily', category: 'workout', target: 0, reward: 0, icon: '🏆', active: true });
    setEditingId(null);
  };

  const handleEdit = (t: { id: string; data: Record<string, unknown> }) => {
    setForm({
      name: String(t.data.name || ''),
      nameEn: String(t.data.nameEn || ''),
      nameTh: String(t.data.nameTh || ''),
      description: String(t.data.description || ''),
      descriptionTh: String(t.data.descriptionTh || ''),
      type: String(t.data.type || 'daily'),
      category: String(t.data.category || 'workout'),
      target: Number(t.data.target || 0),
      reward: Number(t.data.reward || 0),
      icon: String(t.data.icon || '🏆'),
      active: t.data.active !== false,
    });
    setEditingId(t.id);
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateDocument('challengeTemplates', editingId, form);
        toast.success('อัพเดตชาเลนจ์สำเร็จ');
      } else {
        await createDocument('challengeTemplates', form);
        toast.success('สร้างชาเลนจ์สำเร็จ');
      }
      setShowDialog(false);
      resetForm();
      loadTemplates();
    } catch (e: unknown) {
      toast.error('บันทึกไม่สำเร็จ');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('challengeTemplates', deleteTarget);
      toast.success('ลบสำเร็จ');
      setDeleteTarget(null);
      loadTemplates();
    } catch (e: unknown) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateDocument('challengeTemplates', id, { active: !currentActive });
      toast.success(currentActive ? 'ปิดชาเลนจ์แล้ว' : 'เปิดชาเลนจ์แล้ว');
      loadTemplates();
    } catch (e: unknown) {
      toast.error('เปลี่ยนสถานะไม่สำเร็จ');
    }
  };

  const typeLabels: Record<string, string> = { daily: 'รายวัน', weekly: 'รายสัปดาห์', monthly: 'รายเดือน' };
  const categoryLabels: Record<string, string> = { workout: 'ออกกำลังกาย', calories: 'แคลอรี่', water: 'น้ำ' };

  return (
    <div>
      <SectionHeader
        title="จัดการชาเลนจ์"
        subtitle={`${templates.length} ชาเลนจ์`}
        action={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { resetForm(); setShowDialog(true); }} className="bg-orange-500 hover:bg-orange-600 text-white h-8 px-3 text-xs rounded-lg">
              <Plus className="w-3.5 h-3.5 mr-1" />สร้างใหม่
            </Button>
            <Button variant="ghost" size="sm" onClick={loadTemplates} disabled={loading} className="text-gray-400 hover:text-white hover:bg-white/[0.06] h-8">
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : (
        <div className="space-y-2">
          {templates.map(t => {
            const isActive = t.data.active !== false;
            return (
              <GlassCard key={t.id} className={cn('p-3 group hover:border-white/[0.12] transition-all', !isActive && 'opacity-50')}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{String(t.data.icon || '🏆')}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{String(t.data.nameTh || t.data.name || '-')}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {typeLabels[String(t.data.type)] || String(t.data.type)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {categoryLabels[String(t.data.category)] || String(t.data.category)}
                      </span>
                      <span className="text-[10px] text-gray-500">เป้าหมาย: {String(t.data.target || 0)}</span>
                      <span className="text-[10px] text-yellow-500">{String(t.data.reward || 0)} pts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleToggleActive(t.id, isActive)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg" onClick={() => handleEdit(t)}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg" onClick={() => setDeleteTarget(t.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={v => { if (!v) resetForm(); setShowDialog(v); }}>
        <DialogContent className="max-w-lg bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-white">{editingId ? 'แก้ไขชาเลนจ์' : 'สร้างชาเลนจ์ใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">ชื่อ (EN)</label>
                <Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value, name: e.target.value }))}
                  className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">ชื่อ (TH)</label>
                <Input value={form.nameTh} onChange={e => setForm(f => ({ ...f, nameTh: e.target.value }))}
                  className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">รายละเอียด</label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">รายละเอียด (TH)</label>
                <Input value={form.descriptionTh} onChange={e => setForm(f => ({ ...f, descriptionTh: e.target.value }))}
                  className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">ประเภท</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1d2e] border-white/[0.08]">
                    <SelectItem value="daily" className="text-gray-200">รายวัน</SelectItem>
                    <SelectItem value="weekly" className="text-gray-200">รายสัปดาห์</SelectItem>
                    <SelectItem value="monthly" className="text-gray-200">รายเดือน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">หมวดหมู่</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1a1d2e] border-white/[0.08]">
                    <SelectItem value="workout" className="text-gray-200">ออกกำลังกาย</SelectItem>
                    <SelectItem value="calories" className="text-gray-200">แคลอรี่</SelectItem>
                    <SelectItem value="water" className="text-gray-200">น้ำ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">ไอคอน</label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">เป้าหมาย</label>
                <Input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: Number(e.target.value) }))}
                  className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">รางวัล (pts)</label>
                <Input type="number" value={form.reward} onChange={e => setForm(f => ({ ...f, reward: Number(e.target.value) }))}
                  className="bg-white/[0.03] border-white/[0.08] text-gray-200" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} className="data-[state=checked]:bg-emerald-500" />
              <span className="text-sm text-gray-300">เปิดใช้งาน</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { resetForm(); setShowDialog(false); }} className="text-gray-400 hover:text-white hover:bg-white/[0.06]">ยกเลิก</Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white">{editingId ? 'บันทึก' : 'สร้าง'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#1a1d2e] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">ลบชาเลนจ์?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">การดำเนินการนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-gray-300 hover:bg-white/[0.1] hover:text-white">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== TAB 4: CONTENT MANAGEMENT ====================
function ContentManagementTab() {
  const [activeSection, setActiveSection] = useState<'foodDatabase' | 'healthyFoods' | 'savedRecipes'>('foodDatabase');
  const [items, setItems] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; data: Record<string, unknown> } | null>(null);
  const [newItem, setNewItem] = useState<Record<string, unknown>>({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await listCollectionDocs(activeSection, 100);
      setItems(docs);
    } catch (e: unknown) {
      toast.error('โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [activeSection]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await updateDocument(activeSection, editingItem.id, editingItem.data);
      toast.success('บันทึกสำเร็จ');
      setEditingItem(null);
      loadItems();
    } catch (e: unknown) {
      toast.error('บันทึกไม่สำเร็จ');
    }
  };

  const handleCreate = async () => {
    try {
      await createDocument(activeSection, newItem);
      toast.success('สร้างสำเร็จ');
      setShowDialog(false);
      setNewItem({});
      loadItems();
    } catch (e: unknown) {
      toast.error('สร้างไม่สำเร็จ');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(activeSection, deleteTarget);
      toast.success('ลบสำเร็จ');
      setDeleteTarget(null);
      loadItems();
    } catch (e: unknown) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const sectionLabels = {
    foodDatabase: 'ฐานข้อมูลอาหาร',
    healthyFoods: 'อาหารสุขภาพ',
    savedRecipes: 'สูตรอาหาร',
  };

  return (
    <div>
      <SectionHeader
        title="จัดการเนื้อหา"
        subtitle={`${sectionLabels[activeSection]} - ${items.length} รายการ`}
        action={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white h-8 px-3 text-xs rounded-lg">
              <Plus className="w-3.5 h-3.5 mr-1" />เพิ่ม
            </Button>
            <Button variant="ghost" size="sm" onClick={loadItems} disabled={loading} className="text-gray-400 hover:text-white hover:bg-white/[0.06] h-8">
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        }
      />

      {/* Section Tabs */}
      <div className="flex gap-1.5 mb-4 p-1 bg-white/[0.02] rounded-xl border border-white/[0.06] inline-flex">
        {(['foodDatabase', 'healthyFoods', 'savedRecipes'] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              activeSection === s
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
            )}
          >
            {sectionLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const name = String(item.data.name || item.data.nameTh || item.data.title || item.id);
            return (
              <GlassCard key={item.id} className="p-3 hover:border-white/[0.12] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <Utensils className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{truncate(name, 40)}</p>
                    <p className="text-[10px] text-gray-600 font-mono">{truncate(item.id, 24)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                      onClick={() => setEditingItem({ id: item.id, data: item.data })}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      onClick={() => setDeleteTarget(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={v => { if (!v) setEditingItem(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-white">แก้ไข: {editingItem?.id}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
             {editingItem && (
               <RecursiveEditor 
                 data={editingItem.data} 
                 onChange={(newData) => setEditingItem({ ...editingItem, data: newData })} 
               />
             )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-white">ยกเลิก</Button>
            <Button onClick={handleSaveEdit} className="bg-orange-500 hover:bg-orange-600 text-white">บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader><DialogTitle className="text-white">สร้างรายการใหม่</DialogTitle></DialogHeader>
          <div className="py-2">
             <RecursiveEditor 
               data={newItem} 
               onChange={(newData) => setNewItem(newData)} 
             />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)} className="text-gray-400 hover:text-white">ยกเลิก</Button>
            <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white">สร้าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#1a1d2e] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">ลบรายการนี้?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">การลบจะไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-gray-300 hover:bg-white/[0.1] hover:text-white">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== TAB 5: GAME MANAGEMENT ====================
function GameManagementTab() {
  const [gameType, setGameType] = useState<string>('fishing');
  const [leaderboards, setLeaderboards] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);
  const [recentScores, setRecentScores] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ collection: string; id: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lb, scores] = await Promise.all([
        listCollectionDocs('leaderboards', 50),
        listCollectionDocs('gameScores', 100),
      ]);
      setLeaderboards(lb);
      setRecentScores(scores);
    } catch (e: unknown) {
      toast.error('โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget.collection, deleteTarget.id);
      toast.success('ลบสำเร็จ');
      setDeleteTarget(null);
      loadData();
    } catch (e: unknown) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const filteredScores = recentScores.filter(s => !gameType || String(s.data.gameType) === gameType);
  const filteredLeaderboards = leaderboards.filter(lb => lb.id.startsWith(gameType));

  const gameLabels: Record<string, { label: string; icon: typeof Fish }> = {
    fishing: { label: 'ตกปลา', icon: Fish },
    mouseRunning: { label: 'วิ่งหนู', icon: MousePointer },
    whackAMole: { label: 'ทุบตัวตุ่น', icon: Hammer },
  };

  return (
    <div>
      <SectionHeader
        title="จัดการเกม"
        subtitle="Leaderboard และคะแนนล่าสุด"
        action={
          <Button variant="ghost" size="sm" onClick={loadData} disabled={loading} className="text-gray-400 hover:text-white hover:bg-white/[0.06] h-8">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
        }
      />

      {/* Game Type Selector */}
      <div className="flex gap-1.5 mb-5 p-1 bg-white/[0.02] rounded-xl border border-white/[0.06] inline-flex">
        {Object.entries(gameLabels).map(([key, { label, icon: Icon }]) => (
          <button
            key={key}
            onClick={() => setGameType(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              gameType === key
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : (
        <div className="space-y-5">
          {/* Leaderboards */}
          <GlassCard className="overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <h3 className="font-semibold text-sm text-white">Leaderboard</h3>
                <span className="text-[10px] text-gray-500">{filteredLeaderboards.length} รายการ</span>
              </div>
            </div>
            <div className="p-3">
              {filteredLeaderboards.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">ไม่พบ Leaderboard</p>
              ) : (
                <div className="space-y-2">
                  {filteredLeaderboards.map(lb => (
                    <div key={lb.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div>
                        <p className="text-sm text-white font-medium">{lb.id}</p>
                        <p className="text-[10px] text-gray-500">
                          {Array.isArray(lb.data.topScores) ? `${(lb.data.topScores as unknown[]).length} อันดับ` : 'ไม่มีข้อมูล'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-8 px-3 text-xs rounded-lg"
                        onClick={() => setDeleteTarget({ collection: 'leaderboards', id: lb.id })}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" />รีเซ็ต
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Recent Scores */}
          <GlassCard className="overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">คะแนนล่าสุด</h3>
                <span className="text-[10px] text-gray-500">{filteredScores.length} รายการ</span>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {filteredScores.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">ไม่พบคะแนน</p>
              ) : filteredScores.slice(0, 20).map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                      <Gamepad2 className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white">{truncate(String(s.data.userName || s.data.userId || '-'), 20)}</p>
                      <p className="text-[10px] text-gray-600">{formatTimestamp(s.data.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{String(s.data.score || 0)}</p>
                      <p className="text-[10px] text-gray-500">Lv.{String(s.data.level || '-')}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      onClick={() => setDeleteTarget({ collection: 'gameScores', id: s.id })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#1a1d2e] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">ลบข้อมูลนี้?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">ลบ {deleteTarget?.id} จาก {deleteTarget?.collection}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-gray-300 hover:bg-white/[0.1] hover:text-white">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== TAB 6: STORAGE BROWSER ====================
function StorageBrowserTab() {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<{ url: string; metadata: Record<string, unknown>; path: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loadPath = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listStorageFiles(path);
      setItems(result);
      setCurrentPath(path);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // Handle 403 / permission errors gracefully
      if (msg.includes('403') || msg.includes('storage/unauthorized') || msg.includes('permission') || msg.includes('does not have permission')) {
        setError('ไม่มีสิทธิ์เข้าถึงโฟลเดอร์นี้ กรุณาตรวจสอบ Firebase Storage Rules');
      } else {
        setError('โหลดไม่สำเร็จ: ' + msg);
      }
      setItems([]);
      setCurrentPath(path);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePreview = async (fullPath: string) => {
    try {
      const details = await getStorageFileDetails(fullPath);
      setFilePreview({ url: details.url, metadata: details.metadata as unknown as Record<string, unknown>, path: fullPath });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('403') || msg.includes('unauthorized') || msg.includes('permission')) {
        toast.error('ไม่มีสิทธิ์เข้าถึงไฟล์นี้');
      } else {
        toast.error('ดูตัวอย่างไม่สำเร็จ');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStorageFile(deleteTarget);
      toast.success('ลบไฟล์สำเร็จ');
      setDeleteTarget(null);
      setFilePreview(null);
      loadPath(currentPath);
    } catch (e: unknown) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  const quickPaths = [
    { label: 'หน้าหลัก', path: '', icon: Home },
    { label: 'แชร์ออกกำลังกาย', path: 'workout-shares', icon: Zap },
    { label: 'สแกนอาหาร', path: 'nutrition-scans', icon: Image },
  ];

  const handleExportStorageCsv = () => {
    const rows = items.map((item) => ({
      currentPath,
      name: item.name,
      fullPath: item.fullPath,
      type: item.isFolder ? 'folder' : 'file',
    }));
    exportRowsToCsv(`kaya-storage-${(currentPath || 'root').replace(/[\\/]/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div>
      <SectionHeader
        title="จัดการไฟล์"
        subtitle="Firebase Cloud Storage"
        action={
          <Button variant="outline" size="sm" onClick={handleExportStorageCsv} className="h-8 text-xs border-white/[0.1] text-gray-300 hover:text-white hover:bg-white/[0.06]">
            <Download className="w-3.5 h-3.5 mr-1" />CSV
          </Button>
        }
      />

      {/* Quick Nav */}
      <div className="flex gap-2 flex-wrap mb-4">
        {quickPaths.map(qp => (
          <button
            key={qp.path}
            onClick={() => loadPath(qp.path)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              currentPath === qp.path
                ? 'bg-orange-500/15 text-orange-400 border-orange-500/20'
                : 'text-gray-500 border-white/[0.06] hover:text-gray-300 hover:bg-white/[0.04]'
            )}
          >
            <qp.icon className="w-3.5 h-3.5" />
            {qp.label}
          </button>
        ))}
      </div>

      {/* Breadcrumb */}
      {currentPath && (
        <div className="flex items-center gap-1 text-sm flex-wrap mb-3">
          <button onClick={() => loadPath('')} className="text-xs text-gray-500 hover:text-orange-400 transition-colors">/</button>
          {pathParts.map((part, i) => (
            <div key={i} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-gray-600" />
              <button
                className="text-xs text-gray-400 hover:text-orange-400 transition-colors"
                onClick={() => loadPath(pathParts.slice(0, i + 1).join('/'))}
              >
                {part}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <GlassCard className="p-4 mb-4 border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-300 font-medium">ข้อผิดพลาด</p>
              <p className="text-xs text-yellow-400/70 mt-0.5">{error}</p>
              <p className="text-[10px] text-gray-500 mt-2">
                ถ้าเจอ error 403 ต้องตั้งค่า Firebase Storage Rules ให้อนุญาตการ list ไฟล์
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* File List */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-orange-400 mx-auto" /></div>
        ) : !currentPath && items.length === 0 && !error ? (
          <div className="p-8 text-center">
            <FolderOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">เลือกโฟลเดอร์ด้านบนเพื่อเริ่มเรียกดูไฟล์</p>
          </div>
        ) : items.length === 0 && !error ? (
          <div className="p-8 text-center">
            <Folder className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">โฟลเดอร์ว่าง</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {items.map(item => (
              <div
                key={item.fullPath}
                className={cn('flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors', item.isFolder && 'cursor-pointer')}
                onClick={() => item.isFolder ? loadPath(item.fullPath) : undefined}
              >
                {item.isFolder ? (
                  <Folder className="w-5 h-5 text-yellow-400 shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                )}
                <p className="text-sm text-gray-300 flex-1">{item.name}{item.isFolder ? '/' : ''}</p>
                {!item.isFolder && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                      onClick={e => { e.stopPropagation(); handlePreview(item.fullPath); }}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      onClick={e => { e.stopPropagation(); setDeleteTarget(item.fullPath); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* File Preview Dialog */}
      <Dialog open={!!filePreview} onOpenChange={v => { if (!v) setFilePreview(null); }}>
        <DialogContent className="max-w-lg bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-sm text-white break-all">{filePreview?.path}</DialogTitle>
          </DialogHeader>
          {filePreview && (
            <div className="space-y-3">
              {String(filePreview.metadata?.contentType || '').startsWith('image/') && (
                <img src={filePreview.url} alt="" className="max-h-64 rounded-lg mx-auto" />
              )}
              {String(filePreview.metadata?.contentType || '').startsWith('audio/') && (
                <audio controls src={filePreview.url} className="w-full" />
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(filePreview.metadata).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
                    <p className="text-gray-500">{prettyFieldLabel(key)}</p>
                    <p className="text-gray-200 font-medium truncate">{formatReadableValue(value)}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg overflow-auto max-h-64 bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-gray-400 mb-2">ข้อมูลไฟล์ (JSON)</p>
                <textarea
                  readOnly
                  className="w-full min-h-[180px] resize-y font-mono text-sm leading-6 p-3 bg-black/35 border border-white/[0.08] rounded-lg text-gray-200 outline-none"
                  value={JSON.stringify(filePreview.metadata, null, 2)}
                />
              </div>
              <div className="flex gap-2">
                <a href={filePreview.url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="text-gray-300 border-white/[0.1] hover:bg-white/[0.06]">
                    <Download className="w-4 h-4 mr-1" />ดาวน์โหลด
                  </Button>
                </a>
                <Button size="sm" onClick={() => setDeleteTarget(filePreview.path)} className="bg-red-600 hover:bg-red-700 text-white">
                  <Trash2 className="w-4 h-4 mr-1" />ลบ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#1a1d2e] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">ลบไฟล์?</AlertDialogTitle>
            <AlertDialogDescription className="break-all text-gray-400">ลบ {deleteTarget}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-gray-300 hover:bg-white/[0.1] hover:text-white">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== TAB 7: FIRESTORE EXPLORER ====================
function FirestoreExplorerTab() {
  const [selectedCollection, setSelectedCollection] = useState('users');
  const [documents, setDocuments] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);
  const [loading, setLoading] = useState(false);
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [editDoc, setEditDoc] = useState<{ id: string; data: Record<string, unknown> } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDocId, setNewDocId] = useState('');
  const [newDocItem, setNewDocItem] = useState<Record<string, unknown>>({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [subcollectionView, setSubcollectionView] = useState<{ parentCol: string; parentId: string; subName: string } | null>(null);
  const [subDocs, setSubDocs] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);

  const previewEntries = useMemo(() => {
    if (!editDoc) return [] as Array<[string, unknown]>;
    return Object.entries(editDoc.data).slice(0, 10);
  }, [editDoc]);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await listCollectionDocs(selectedCollection, 100);
      setDocuments(docs);
    } catch (e: unknown) {
      toast.error('โหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [selectedCollection]);

  useEffect(() => { loadCollection(); }, [loadCollection]);

  const handleViewDoc = (d: { id: string; data: Record<string, unknown> }) => {
    setEditDoc({ id: d.id, data: d.data });
    setShowDocDialog(true);
  };

  const handleSaveDoc = async () => {
    if (!editDoc) return;
    try {
      await updateDocument(selectedCollection, editDoc.id, editDoc.data);
      toast.success('บันทึกสำเร็จ');
      setShowDocDialog(false);
      loadCollection();
    } catch (e: unknown) {
      toast.error('บันทึกไม่สำเร็จ');
    }
  };

  const handleCreate = async () => {
    try {
      const id = await createDocument(selectedCollection, newDocItem, newDocId || undefined);
      toast.success('สร้างสำเร็จ: ' + id);
      setShowCreateDialog(false);
      setNewDocId('');
      setNewDocItem({});
      loadCollection();
    } catch (e: unknown) {
      toast.error('สร้างไม่สำเร็จ');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(selectedCollection, deleteTarget);
      toast.success('ลบสำเร็จ');
      setDeleteTarget(null);
      loadCollection();
    } catch (e: unknown) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const handleViewSubcollection = async (parentId: string, subName: string) => {
    try {
      const docs = await listSubcollection(selectedCollection, parentId, subName);
      setSubDocs(docs);
      setSubcollectionView({ parentCol: selectedCollection, parentId, subName });
    } catch (e: unknown) {
      toast.error('โหลดไม่สำเร็จ');
    }
  };

  const handleExportFirestoreCsv = () => {
    const rows = documents.map((item) => ({
      collection: selectedCollection,
      docId: item.id,
      fieldsCount: Object.keys(item.data || {}).length,
      data: JSON.stringify(item.data || {}),
    }));
    exportRowsToCsv(`kaya-firestore-${selectedCollection}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div>
      <SectionHeader
        title="ฐานข้อมูล Firestore"
        subtitle="เรียกดูและแก้ไขข้อมูล"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportFirestoreCsv} className="h-8 px-3 text-xs border-white/[0.1] text-gray-300 hover:text-white hover:bg-white/[0.06]">
              <Download className="w-3.5 h-3.5 mr-1" />CSV
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white h-8 px-3 text-xs rounded-lg">
              <Plus className="w-3.5 h-3.5 mr-1" />เอกสารใหม่
            </Button>
            <Button variant="ghost" size="sm" onClick={loadCollection} disabled={loading} className="text-gray-400 hover:text-white hover:bg-white/[0.06] h-8">
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        }
      />

      {/* Collection Selector */}
      <div className="flex gap-3 items-center mb-4">
        <span className="text-sm font-medium text-gray-300">Collection:</span>
        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
          <SelectTrigger className="w-56 bg-white/[0.03] border-white/[0.08] text-gray-200 h-9 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d2e] border-white/[0.08]">
            {ALL_COLLECTIONS.map(c => (
              <SelectItem key={c} value={c} className="text-gray-300 focus:text-white focus:bg-white/[0.06]">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-400 bg-white/[0.03] px-2 py-1 rounded-md border border-white/[0.06]">
          {documents.length} docs
        </span>
      </div>

      {/* Documents */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <Database className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">ไม่มีเอกสาร</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {documents.map(d => (
            <GlassCard key={d.id} className="p-3 hover:border-white/[0.12] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-gray-200 truncate">{truncate(d.id, 40)}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {Object.keys(d.data).slice(0, 5).map((key) => (
                      <span key={key} className="text-xs px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-gray-400">
                        {prettyFieldLabel(key)}
                      </span>
                    ))}
                    {Object.keys(d.data).length > 5 && (
                      <span className="text-xs text-gray-500">+{Object.keys(d.data).length - 5} fields</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                    onClick={() => handleViewDoc(d)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  {selectedCollection === 'users' && (
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg"
                      onClick={() => handleViewSubcollection(d.id, 'challengeProgress')}>
                      <Database className="w-3 h-3 mr-1" />Sub
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                    onClick={() => setDeleteTarget(d.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Edit Doc Dialog */}
      <Dialog open={showDocDialog} onOpenChange={v => { if (!v) { setShowDocDialog(false); setEditDoc(null); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-base text-white">
              <span className="text-gray-500">{selectedCollection}/</span>{editDoc?.id}
            </DialogTitle>
          </DialogHeader>
          {editDoc && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              {previewEntries.map(([key, value]) => (
                <div key={key} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-xs text-gray-500 mb-0.5">{prettyFieldLabel(key)}</p>
                  <p className="text-sm text-gray-200 break-all">{formatReadableValue(value)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="py-2">
             {editDoc && (
               <RecursiveEditor 
                 data={editDoc.data} 
                 onChange={(newData) => setEditDoc({ ...editDoc, data: newData })} 
               />
             )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowDocDialog(false); setEditDoc(null); }} className="text-gray-400 hover:text-white">ยกเลิก</Button>
            <Button onClick={handleSaveDoc} className="bg-orange-500 hover:bg-orange-600 text-white"><Save className="w-4 h-4 mr-1" />บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Doc Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader><DialogTitle className="text-white">สร้างเอกสารใหม่ใน {selectedCollection}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Document ID (ไม่ใส่ = สร้างอัตโนมัติ)</label>
              <Input value={newDocId} onChange={e => setNewDocId(e.target.value)} placeholder="ปล่อยว่างเพื่อสร้าง ID อัตโนมัติ"
                className="font-mono bg-white/[0.03] border-white/[0.08] text-gray-200 placeholder:text-gray-600" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block">ข้อมูล</label>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                 <RecursiveEditor 
                   data={newDocItem} 
                   onChange={(newData) => setNewDocItem(newData)} 
                 />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-gray-400 hover:text-white">ยกเลิก</Button>
            <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white">สร้าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcollection Dialog */}
      <Dialog open={!!subcollectionView} onOpenChange={v => { if (!v) setSubcollectionView(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-sm text-white">
              {subcollectionView?.parentCol}/{subcollectionView?.parentId}/{subcollectionView?.subName}
            </DialogTitle>
            <DialogDescription className="text-gray-500">{subDocs.length} เอกสาร</DialogDescription>
          </DialogHeader>
          {subDocs.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">ไม่พบข้อมูล</p>
          ) : (
            <div className="space-y-2">
              {subDocs.map(d => (
                <div key={d.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="font-mono text-xs font-medium text-gray-300 mb-2">{d.id}</p>
                  <DynamicViewer data={d.data} />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#1a1d2e] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">ลบเอกสาร?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              ลบ <code className="text-xs text-orange-400">{selectedCollection}/{deleteTarget}</code> จริงหรือ? การลบไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-gray-300 hover:bg-white/[0.1] hover:text-white">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AuditLogsTab() {
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdminAuditLogs(300);
      setLogs(data);
    } catch {
      toast.error('โหลด audit log ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const actions = useMemo(() => Array.from(new Set(logs.map((item) => item.action).filter(Boolean))), [logs]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const customStartDate = new Date(customStart);
    customStartDate.setHours(0, 0, 0, 0);
    const customEndDate = new Date(customEnd);
    customEndDate.setHours(23, 59, 59, 999);

    return logs.filter((item) => {
      if (actionFilter !== 'all' && item.action !== actionFilter) return false;
      const q = actorFilter.trim().toLowerCase();
      const textMatch = !q || (
        String(item.actorName || '').toLowerCase().includes(q)
        || String(item.actorUserId || '').toLowerCase().includes(q)
        || String(item.summary || '').toLowerCase().includes(q)
      );

      const createdDate = toDateFromUnknown(item.createdAt);
      let timeMatch = true;
      if (timeFilter === 'today') {
        timeMatch = !!createdDate && createdDate >= startOfToday;
      } else if (timeFilter === '7d') {
        const from = new Date(startOfToday);
        from.setDate(from.getDate() - 6);
        timeMatch = !!createdDate && createdDate >= from;
      } else if (timeFilter === '30d') {
        const from = new Date(startOfToday);
        from.setDate(from.getDate() - 29);
        timeMatch = !!createdDate && createdDate >= from;
      } else if (timeFilter === 'custom') {
        if (Number.isNaN(customStartDate.getTime()) || Number.isNaN(customEndDate.getTime()) || customEndDate < customStartDate) {
          timeMatch = false;
        } else {
          timeMatch = !!createdDate && createdDate >= customStartDate && createdDate <= customEndDate;
        }
      }

      return textMatch && timeMatch;
    });
  }, [logs, actionFilter, actorFilter, timeFilter, customStart, customEnd]);

  const timeFilterInvalid = useMemo(() => {
    if (timeFilter !== 'custom') return false;
    const start = new Date(customStart);
    const end = new Date(customEnd);
    return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start;
  }, [timeFilter, customStart, customEnd]);

  return (
    <div>
      <SectionHeader
        title="Audit Log"
        subtitle={`บันทึกการแก้ไขล่าสุด ${filteredLogs.length} รายการ`}
        action={
          <Button variant="ghost" size="sm" onClick={loadLogs} disabled={loading} className="text-gray-400 hover:text-white hover:bg-white/[0.06] h-8">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
        }
      />

      <div className="grid md:grid-cols-3 gap-2 mb-3">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-gray-200">
            <SelectValue placeholder="เลือก action" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d2e] border-white/[0.08]">
            <SelectItem value="all" className="text-gray-200">ทั้งหมด</SelectItem>
            {actions.map((action) => (
              <SelectItem key={action} value={action} className="text-gray-200">{action}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          placeholder="ค้นหาตามชื่อแอดมินหรือ userId"
          className="bg-white/[0.03] border-white/[0.08] text-gray-200 placeholder:text-gray-600"
        />
        <Select value={timeFilter} onValueChange={(value: 'all' | 'today' | '7d' | '30d' | 'custom') => setTimeFilter(value)}>
          <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-gray-200">
            <SelectValue placeholder="ช่วงเวลา" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d2e] border-white/[0.08]">
            <SelectItem value="all" className="text-gray-200">ทุกช่วงเวลา</SelectItem>
            <SelectItem value="today" className="text-gray-200">วันนี้</SelectItem>
            <SelectItem value="7d" className="text-gray-200">7 วันล่าสุด</SelectItem>
            <SelectItem value="30d" className="text-gray-200">30 วันล่าสุด</SelectItem>
            <SelectItem value="custom" className="text-gray-200">กำหนดเอง</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {timeFilter === 'custom' && (
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">เริ่ม</p>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-9 text-sm bg-white/[0.03] border-white/[0.08] text-gray-200"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">สิ้นสุด</p>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-9 text-sm bg-white/[0.03] border-white/[0.08] text-gray-200"
            />
          </div>
          {timeFilterInvalid && <p className="text-xs text-red-400 pb-2">ช่วงวันที่ไม่ถูกต้อง</p>}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
      ) : filteredLogs.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <History className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">ยังไม่มีบันทึกที่ตรงกับเงื่อนไข</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((item) => (
            <GlassCard key={item.id} className="p-3 border-white/[0.08]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20">{item.action}</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(item.createdAt)}</span>
                  </div>
                  <p className="text-sm text-white mt-1">{item.summary}</p>
                  <p className="text-xs text-gray-500 mt-1">โดย {item.actorName || '-'} ({item.actorUserId || '-'})</p>
                  {(item.targetCollection || item.targetId) && (
                    <p className="text-xs text-gray-500 mt-1">เป้าหมาย: {item.targetCollection || '-'} / {item.targetId || '-'}</p>
                  )}
                </div>
                {item.details && (
                  <div className="max-w-[360px] w-full hidden md:block">
                    <pre className="text-[10px] font-mono leading-5 p-2 rounded-lg bg-black/30 border border-white/[0.08] text-gray-400 overflow-x-auto">
                      {JSON.stringify(item.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== TAB 8: ADMIN SETTINGS ====================
function AdminSettingsTab() {
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [newId, setNewId] = useState('');
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const ids = await getAdminIds();
      setAdminIds(ids);
    } catch (e: unknown) {
      toast.error('โหลดแอดมินไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const handleAdd = async () => {
    if (!newId.trim()) return;
    try {
      await addAdminId(newId.trim());
      toast.success('เพิ่มแอดมินสำเร็จ');
      setNewId('');
      loadAdmins();
    } catch (e: unknown) {
      toast.error('เพิ่มไม่สำเร็จ');
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeAdminId(removeTarget);
      toast.success('ลบแอดมินสำเร็จ');
      setRemoveTarget(null);
      loadAdmins();
    } catch (e: unknown) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="ตั้งค่าแอดมิน"
        subtitle="จัดการสิทธิ์ผู้ดูแลระบบ"
      />

      <GlassCard className="overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <Shield className="w-4 h-4 text-orange-400" />
          <h3 className="font-semibold text-sm text-white">รายชื่อแอดมิน</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300/80">การเพิ่มแอดมินจะให้สิทธิ์เข้าถึงข้อมูลทั้งหมดในระบบ</p>
          </div>

          {/* Current Admins */}
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-orange-400" /></div>
          ) : (
            <div className="space-y-2">
              {adminIds.map((id, i) => (
                <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <code className="text-xs text-gray-300">{id.slice(0, 20)}...</code>
                      {i === 0 && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">หลัก</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                    onClick={() => setRemoveTarget(id)}
                    disabled={adminIds.length <= 1}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator className="bg-white/[0.06]" />

          {/* Add New Admin */}
          <div className="flex gap-2">
            <Input
              value={newId}
              onChange={e => setNewId(e.target.value)}
              placeholder="ใส่ LINE User ID (เช่น U6807a78e...)"
              className="font-mono text-xs flex-1 bg-white/[0.03] border-white/[0.08] text-gray-200 placeholder:text-gray-600"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} disabled={!newId.trim()} className="bg-orange-500 hover:bg-orange-600 text-white h-9 px-4 rounded-lg">
              <Plus className="w-3.5 h-3.5 mr-1" />เพิ่ม
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard className="overflow-hidden border-red-500/20">
        <div className="px-4 py-3 border-b border-red-500/10">
          <h3 className="font-semibold text-sm text-red-400">โซนอันตราย</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">รีเซ็ตการตั้งค่าแอดมิน</p>
              <p className="text-xs text-gray-500 mt-0.5">รีเซ็ตให้เหลือเฉพาะแอดมินหลักเท่านั้น</p>
            </div>
            <Button
              size="sm"
              className="bg-red-600/80 hover:bg-red-600 text-white h-8 px-3 text-xs rounded-lg"
              onClick={async () => {
                try {
                  await updateDocument('adminConfig', 'admins', {
                    userIds: ['U6807a78e027469dbc86b711c4175f6c6'],
                  });
                  toast.success('รีเซ็ตสำเร็จ');
                  loadAdmins();
                } catch (e: unknown) {
                  toast.error('รีเซ็ตไม่สำเร็จ');
                }
              }}
            >
              รีเซ็ต
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Remove Confirm */}
      <AlertDialog open={!!removeTarget} onOpenChange={v => { if (!v) setRemoveTarget(null); }}>
        <AlertDialogContent className="bg-[#1a1d2e] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">ลบแอดมิน?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              ลบ <code className="text-xs text-orange-400">{removeTarget?.slice(0, 16)}...</code> ออกจากรายชื่อแอดมิน?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.05] border-white/[0.08] text-gray-300 hover:bg-white/[0.1] hover:text-white">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700 text-white">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
