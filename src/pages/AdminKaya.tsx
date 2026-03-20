// Admin Dashboard - KAYA Fitness App
// Access: URL-only (/admin-kaya), no buttons/links in app
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  isAdmin,
  initializeAdminConfig,
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
  ALL_COLLECTIONS,
  type StorageItem,
} from '@/lib/adminFirestore';
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
  LayoutDashboard, Crown, Zap,
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

// ==================== MAIN COMPONENT ====================
export default function AdminKaya() {
  const { lineProfile, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const checkAccess = async () => {
      if (!lineProfile?.userId) {
        setIsCheckingAdmin(false);
        return;
      }
      const result = await isAdmin(lineProfile.userId);
      setIsAdminUser(result);
      if (result) await initializeAdminConfig();
      setIsCheckingAdmin(false);
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
    { id: 'challenges', label: 'ชาเลนจ์', icon: Trophy },
    { id: 'content', label: 'เนื้อหา', icon: Utensils },
    { id: 'games', label: 'เกม', icon: Gamepad2 },
    { id: 'storage', label: 'ไฟล์', icon: FolderOpen },
    { id: 'firestore', label: 'ฐานข้อมูล', icon: Database },
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
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                    'data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-300 data-[state=inactive]:hover:bg-white/[0.04]',
                    'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/10',
                    'data-[state=active]:text-orange-400 data-[state=active]:shadow-[0_0_12px_rgba(249,115,22,0.15)]',
                    'data-[state=active]:border data-[state=active]:border-orange-500/20',
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="users"><UserManagementTab /></TabsContent>
          <TabsContent value="challenges"><ChallengeManagementTab /></TabsContent>
          <TabsContent value="content"><ContentManagementTab /></TabsContent>
          <TabsContent value="games"><GameManagementTab /></TabsContent>
          <TabsContent value="storage"><StorageBrowserTab /></TabsContent>
          <TabsContent value="firestore"><FirestoreExplorerTab /></TabsContent>
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
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ==================== TAB 1: DASHBOARD ====================
function DashboardTab() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getAdminDashboardStats();
      setStats(s);
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

      {/* Quick Actions */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">เข้าถึงด่วน</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'จัดการผู้ใช้', icon: Users, tab: 'users' },
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

  const tierColors: Record<string, string> = {
    bronze: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    silver: 'bg-gray-400/10 text-gray-300 border-gray-400/20',
    gold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    platinum: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    diamond: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  };

  return (
    <div>
      <SectionHeader
        title="จัดการผู้ใช้"
        subtitle={`ทั้งหมด ${users.length} คน`}
        action={
          <Button variant="ghost" size="sm" onClick={loadUsers} disabled={loading} className="text-gray-400 hover:text-white hover:bg-white/[0.06] h-8">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
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
                      <h4 className="font-semibold text-xs text-gray-300">{sectionLabels[section] || section}</h4>
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
  const [editingItem, setEditingItem] = useState<{ id: string; data: Record<string, any> } | null>(null);
  const [newItem, setNewItem] = useState<Record<string, any>>({});
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

  return (
    <div>
      <SectionHeader
        title="จัดการไฟล์"
        subtitle="Firebase Cloud Storage"
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
              <div className="p-3 rounded-lg overflow-auto max-h-48 bg-white/[0.03] border border-white/[0.06]">
                  <DynamicViewer data={filePreview.metadata} />
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
  const [editDoc, setEditDoc] = useState<{ id: string; data: Record<string, any> } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDocId, setNewDocId] = useState('');
  const [newDocItem, setNewDocItem] = useState<Record<string, any>>({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [subcollectionView, setSubcollectionView] = useState<{ parentCol: string; parentId: string; subName: string } | null>(null);
  const [subDocs, setSubDocs] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);

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

  const handleViewDoc = (d: { id: string; data: Record<string, any> }) => {
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

  return (
    <div>
      <SectionHeader
        title="ฐานข้อมูล Firestore"
        subtitle="เรียกดูและแก้ไขข้อมูล"
        action={
          <div className="flex gap-2">
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
        <span className="text-xs font-medium text-gray-500">Collection:</span>
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
        <span className="text-[10px] text-gray-600 bg-white/[0.03] px-2 py-1 rounded-md border border-white/[0.06]">
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
                  <p className="text-xs font-mono text-gray-300 truncate">{truncate(d.id, 32)}</p>
                  <p className="text-[10px] text-gray-600 truncate">{truncate(JSON.stringify(d.data), 80)}</p>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1a1d2e] border-white/[0.08] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-sm text-white">
              <span className="text-gray-500">{selectedCollection}/</span>{editDoc?.id}
            </DialogTitle>
          </DialogHeader>
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
