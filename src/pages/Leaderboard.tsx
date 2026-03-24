import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Crown, Flame, Timer, Dumbbell, Gamepad2, Star, ChevronLeft,
  Medal, Zap, TrendingUp, Loader2, RefreshCw, Users, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getFullLeaderboard,
  getStreakLeaderboard,
  getTierLeaderboard,
  getWorkoutLeaderboard,
  FullLeaderboardEntry,
} from "@/lib/firestore";
import { getGlobalGameLeaderboard } from "@/lib/gameScores";
import { UserTier } from "@/lib/types";
import { UserPublicProfileModal } from "@/components/gamification/UserPublicProfileModal";

// ── Tier helpers ─────────────────────────────────────────────────────────────
const TIER_GRADIENT: Record<UserTier, string> = {
  bronze:   "from-amber-700 to-amber-900",
  silver:   "from-gray-300 to-gray-500",
  gold:     "from-yellow-400 to-amber-600",
  platinum: "from-cyan-300 to-blue-500",
  diamond:  "from-purple-400 via-pink-400 to-blue-400",
  master:   "from-pink-500 via-rose-400 to-fuchsia-500",
};
const TIER_LABEL: Record<UserTier, string> = {
  bronze: "Bronze", silver: "Silver", gold: "Gold",
  platinum: "Platinum", diamond: "Diamond", master: "Master",
};
const TIER_ICON: Record<UserTier, string> = {
  bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "⚪", diamond: "💎", master: "👑",
};

// ── Tab config ────────────────────────────────────────────────────────────────
type TabKey = "rank" | "workouts" | "time" | "games" | "level" | "streak";

const TABS: {
  key: TabKey; labelTh: string; icon: React.FC<{ className?: string }>;
  gradient: string; textColor: string;
  valueFn: (e: AnyRow) => string;
}[] = [
  {
    key: "rank", labelTh: "แรงค์", icon: Trophy,
    gradient: "from-yellow-400 to-amber-500",
    textColor: "text-yellow-400",
    valueFn: e => `${(e.points ?? 0).toLocaleString()} pts`,
  },
  {
    key: "workouts", labelTh: "จำนวน", icon: Dumbbell,
    gradient: "from-purple-500 to-pink-500",
    textColor: "text-purple-400",
    valueFn: e => `${e.totalWorkouts ?? 0} ครั้ง`,
  },
  {
    key: "time", labelTh: "เวลา", icon: Timer,
    gradient: "from-blue-500 to-cyan-400",
    textColor: "text-blue-400",
    valueFn: e => {
      const secs = e.totalWorkoutTime ?? 0;
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      return h > 0 ? `${h}ชม. ${m}น.` : `${m} นาที`;
    },
  },
  {
    key: "games", labelTh: "เกม", icon: Gamepad2,
    gradient: "from-green-500 to-emerald-400",
    textColor: "text-green-400",
    valueFn: e => `${(e.bestScore ?? 0).toLocaleString()} pts`,
  },
  {
    key: "level", labelTh: "เลเวล", icon: Star,
    gradient: "from-orange-500 to-red-500",
    textColor: "text-orange-400",
    valueFn: e => "tier" in e && e.tier ? TIER_LABEL[e.tier as UserTier] : "-",
  },
  {
    key: "streak", labelTh: "สตรีค", icon: Flame,
    gradient: "from-red-500 to-orange-400",
    textColor: "text-red-400",
    valueFn: e => `${e.streakDays ?? 0} วัน`,
  },
];

// ── Unified row type ──────────────────────────────────────────────────────────
type AnyRow = FullLeaderboardEntry & {
  bestScore?: number;
  totalGamesPlayed?: number;
};

// ── Podium avatar ─────────────────────────────────────────────────────────────
function PodiumAvatar({
  row, size, ringColor, onClick,
}: {
  row: AnyRow; size: number; ringColor: string; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-full overflow-hidden border-[3px] cursor-pointer flex-shrink-0",
        ringColor
      )}
      style={{ width: size, height: size }}
    >
      {row.avatar ? (
        <img src={row.avatar} className="w-full h-full object-cover" alt={row.nickname} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white/10 text-white font-black"
          style={{ fontSize: size * 0.35 }}>
          {row.nickname?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const [activeTab, setActiveTab] = useState<TabKey>("rank");
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const fetchData = useCallback(async (tab: TabKey) => {
    setIsLoading(true);
    setRows([]);
    try {
      switch (tab) {
        case "rank":    setRows(await getFullLeaderboard(50)); break;
        case "workouts": setRows(await getWorkoutLeaderboard("count", 50)); break;
        case "time":    setRows(await getWorkoutLeaderboard("time", 50)); break;
        case "level":   setRows(await getTierLeaderboard(50)); break;
        case "streak":  setRows(await getStreakLeaderboard(50)); break;
        case "games": {
          const data = await getGlobalGameLeaderboard(50);
          setRows(data.map(g => ({
            rank: g.rank, userId: g.userId, nickname: g.userName,
            tier: "bronze" as UserTier, points: 0, streakDays: 0,
            avatar: g.userAvatar, bestScore: g.bestScore,
            totalGamesPlayed: g.totalGamesPlayed,
          })));
          break;
        }
      }
    } catch (err) {
      console.error("Leaderboard fetch:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(activeTab); }, [activeTab, fetchData]);

  const openProfile = (userId: string) => {
    if (isMobile) navigate(`/user-profile/${userId}`);
    else { setSelectedUserId(userId); setProfileOpen(true); }
  };

  const currentTab = TABS.find(t => t.key === activeTab)!;
  const currentUserId = userProfile?.lineUserId;
  const myRankIndex = rows.findIndex(r => r.userId === currentUserId);

  const showPodium = rows.length >= 3;
  const first  = rows[0];
  const second = rows[1];
  const third  = rows[2];
  const rest   = showPodium ? rows.slice(3) : rows; // if <3 rows, show all in list

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      isDark ? "bg-[#0a0a0f] text-white" : "bg-slate-100 text-gray-900"
    )}>

      {/* ═══ HERO HEADER ════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1a0a00] via-[#2d1200] to-[hsl(11,68%,14%)]">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(221,110,83,0.35),transparent)]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(#dd6e53 1px,transparent 1px),linear-gradient(90deg,#dd6e53 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div key={i}
            className="absolute w-1 h-1 rounded-full bg-orange-400/50"
            style={{ left: `${10 + i * 11}%`, top: `${20 + (i * 13) % 60}%` }}
            animate={{ y: [-8, 8, -8], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}

        <div className="relative px-4 pt-5 pb-8">
          {/* Back */}
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-white/60 hover:text-white/90 mb-6 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" /> กลับ
          </button>

          {/* Title row */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={{ rotate: [0, -8, 8, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                >
                  <Trophy className="w-7 h-7 text-yellow-400" />
                </motion.div>
                <span className="text-xs font-bold tracking-[0.2em] text-orange-400/80 uppercase">
                  Global Ranking
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight leading-none">
                LEADER<span className="text-[hsl(11,68%,60%)]">BOARD</span>
              </h1>
              <p className="text-white/40 text-sm mt-1.5">แข่งขันกับผู้ใช้ทั่วโลก — ใครจะครองอันดับ 1?</p>
            </div>

            {/* My rank badge */}
            {myRankIndex >= 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="flex flex-col items-center bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-center flex-shrink-0"
              >
                <span className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">คุณ</span>
                <span className="text-2xl font-black text-white leading-none">#{myRankIndex + 1}</span>
                <span className="text-orange-400 text-[10px] font-bold">{currentTab.labelTh}</span>
              </motion.div>
            )}
          </div>

          {/* Stats row */}
          {rows.length > 0 && (
            <div className="flex items-center gap-3 mt-5">
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Users className="w-3.5 h-3.5" />
                <span>{rows.length} ผู้ใช้</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Zap className="w-3.5 h-3.5 text-yellow-400/60" />
                <span>อัปเดตแบบเรียลไทม์</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TABS ════════════════════════════════════════════════════════════════ */}
      <div className={cn(
        "sticky top-0 z-20 border-b overflow-x-auto no-scrollbar",
        isDark ? "bg-[#0d0d0d] border-white/8" : "bg-white border-gray-200 shadow-sm"
      )}>
        <div className="flex w-max min-w-full">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex-1 flex flex-col items-center gap-1 px-4 py-3 text-[11px] font-bold transition-all whitespace-nowrap min-w-[72px]",
                  active
                    ? isDark ? "text-white" : "text-gray-900"
                    : isDark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon className={cn("w-4 h-4", active ? tab.textColor : "")} />
                {tab.labelTh}
                {active && (
                  <motion.div layoutId="tab-indicator"
                    className={cn("absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r", tab.gradient)} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ CONTENT ═════════════════════════════════════════════════════════════ */}
      <div className="flex-1 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center",
              isDark ? "bg-white/5" : "bg-white shadow")}>
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
            <p className={cn("text-sm font-medium", isDark ? "text-gray-500" : "text-gray-400")}>กำลังโหลดอันดับ...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <TrendingUp className={cn("w-16 h-16", isDark ? "text-white/10" : "text-gray-200")} />
            <div className="text-center">
              <p className={cn("font-bold text-lg", isDark ? "text-gray-400" : "text-gray-500")}>ยังไม่มีข้อมูล</p>
              <p className={cn("text-sm mt-1", isDark ? "text-gray-600" : "text-gray-400")}>เริ่มออกกำลังกายเพื่อขึ้นอันดับ!</p>
            </div>
            <button onClick={() => fetchData(activeTab)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/30">
              <RefreshCw className="w-4 h-4" /> ลองใหม่
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>

              {/* ── PODIUM ── */}
              {showPodium && first && second && third && (
                <div className={cn(
                  "px-4 pt-6 pb-0",
                  isDark
                    ? "bg-gradient-to-b from-[hsl(11,68%,9%)] to-transparent"
                    : "bg-gradient-to-b from-orange-50 to-transparent"
                )}>
                  <div className="flex items-end justify-center gap-2 max-w-sm mx-auto">

                    {/* 2nd ── silver */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex flex-col items-center flex-1 cursor-pointer"
                      onClick={() => openProfile(second.userId)}
                    >
                      <PodiumAvatar row={second} size={52} ringColor="border-gray-400" onClick={() => openProfile(second.userId)} />
                      <p className={cn("text-xs font-bold text-center mt-1.5 mb-1 w-full truncate px-1",
                        isDark ? "text-gray-200" : "text-gray-700")}>{second.nickname}</p>
                      <p className={cn("text-[11px] font-semibold mb-2 text-center",
                        isDark ? "text-gray-400" : "text-gray-500")}>{currentTab.valueFn(second)}</p>
                      {currentUserId === second.userId && (
                        <span className="text-[9px] bg-primary text-white rounded px-1.5 py-0.5 font-bold mb-1.5">YOU</span>
                      )}
                      {/* Pedestal */}
                      <div className="w-full h-16 bg-gradient-to-b from-slate-400 to-slate-600 rounded-t-xl flex flex-col items-center justify-center shadow-lg">
                        <Medal className="w-4 h-4 text-white/80 mb-0.5" />
                        <span className="text-white font-black text-base leading-none">2</span>
                      </div>
                    </motion.div>

                    {/* 1st ── gold */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0 }}
                      className="flex flex-col items-center flex-1 cursor-pointer"
                      onClick={() => openProfile(first.userId)}
                    >
                      {/* Crown */}
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-1"
                      >
                        <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                      </motion.div>
                      <div className="relative">
                        <PodiumAvatar row={first} size={68} ringColor="border-yellow-400" onClick={() => openProfile(first.userId)} />
                        {/* Glow ring */}
                        <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] pointer-events-none" />
                      </div>
                      <p className={cn("text-sm font-black text-center mt-2 mb-1 w-full truncate px-1",
                        isDark ? "text-white" : "text-gray-900")}>{first.nickname}</p>
                      <p className="text-[12px] font-bold mb-2 text-center text-yellow-500">{currentTab.valueFn(first)}</p>
                      {currentUserId === first.userId && (
                        <span className="text-[9px] bg-primary text-white rounded px-1.5 py-0.5 font-bold mb-1.5">YOU</span>
                      )}
                      {/* Pedestal - tallest */}
                      <div className="w-full h-24 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-t-xl flex flex-col items-center justify-center shadow-xl shadow-yellow-500/30">
                        <Trophy className="w-5 h-5 text-white/90 mb-0.5" />
                        <span className="text-white font-black text-xl leading-none">1</span>
                      </div>
                    </motion.div>

                    {/* 3rd ── bronze */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center flex-1 cursor-pointer"
                      onClick={() => openProfile(third.userId)}
                    >
                      <PodiumAvatar row={third} size={52} ringColor="border-amber-600" onClick={() => openProfile(third.userId)} />
                      <p className={cn("text-xs font-bold text-center mt-1.5 mb-1 w-full truncate px-1",
                        isDark ? "text-gray-200" : "text-gray-700")}>{third.nickname}</p>
                      <p className={cn("text-[11px] font-semibold mb-2 text-center",
                        isDark ? "text-gray-400" : "text-gray-500")}>{currentTab.valueFn(third)}</p>
                      {currentUserId === third.userId && (
                        <span className="text-[9px] bg-primary text-white rounded px-1.5 py-0.5 font-bold mb-1.5">YOU</span>
                      )}
                      {/* Pedestal */}
                      <div className="w-full h-10 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-xl flex flex-col items-center justify-center shadow-lg">
                        <span className="text-white font-black text-base leading-none">3</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* ── SEPARATOR ── */}
              {showPodium && rest.length > 0 && (
                <div className={cn(
                  "flex items-center gap-3 px-4 py-4 mx-4 mt-0",
                )}>
                  <div className={cn("flex-1 h-px", isDark ? "bg-white/8" : "bg-gray-200")} />
                  <span className={cn("text-xs font-bold tracking-widest uppercase",
                    isDark ? "text-gray-600" : "text-gray-400")}>
                    อันดับถัดไป
                  </span>
                  <div className={cn("flex-1 h-px", isDark ? "bg-white/8" : "bg-gray-200")} />
                </div>
              )}

              {/* ── RANKED LIST (4+) ── */}
              <div className="px-3 space-y-1.5">
                {rest.map((row, i) => {
                  const rank = showPodium ? 3 + i + 1 : i + 1;
                  const isMe = row.userId === currentUserId;
                  return (
                    <motion.div
                      key={row.userId}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.5) }}
                      onClick={() => openProfile(row.userId)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98]",
                        isMe
                          ? isDark
                            ? "bg-primary/15 border border-primary/40"
                            : "bg-primary/8 border border-primary/25"
                          : isDark
                            ? "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07]"
                            : "bg-white border border-gray-100 hover:border-primary/20 shadow-sm"
                      )}
                    >
                      {/* Rank number */}
                      <div className="w-8 text-center flex-shrink-0">
                        <span className={cn(
                          "text-sm font-black",
                          isMe ? "text-primary" : isDark ? "text-gray-500" : "text-gray-400"
                        )}>
                          {rank}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className={cn(
                        "w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2",
                        isMe ? "border-primary/50" : isDark ? "border-white/10" : "border-gray-100"
                      )}>
                        {row.avatar ? (
                          <img src={row.avatar} className="w-full h-full object-cover" alt={row.nickname} />
                        ) : (
                          <div className={cn(
                            "w-full h-full flex items-center justify-center text-sm font-black",
                            isDark ? "bg-white/8 text-gray-300" : "bg-gray-100 text-gray-500"
                          )}>
                            {row.nickname?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                      </div>

                      {/* Name + tier */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            "text-sm font-bold truncate",
                            isMe ? "text-primary" : isDark ? "text-white" : "text-gray-900"
                          )}>
                            {row.nickname}
                          </span>
                          {isMe && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary text-white font-black flex-shrink-0">YOU</span>
                          )}
                        </div>
                        {"tier" in row && row.tier && activeTab !== "games" && (
                          <span className={cn(
                            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold mt-0.5",
                            `bg-gradient-to-r ${TIER_GRADIENT[row.tier as UserTier]} text-white`
                          )}>
                            {TIER_ICON[row.tier as UserTier]} {TIER_LABEL[row.tier as UserTier]}
                          </span>
                        )}
                      </div>

                      {/* Stat value */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={cn(
                          "text-sm font-black tabular-nums",
                          isMe ? "text-primary" : currentTab.textColor
                        )}>
                          {currentTab.valueFn(row)}
                        </span>
                        <ChevronRight className={cn("w-3.5 h-3.5", isDark ? "text-white/20" : "text-gray-300")} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Desktop profile modal */}
      {!isMobile && selectedUserId && (
        <UserPublicProfileModal
          userId={selectedUserId}
          open={profileOpen}
          onClose={() => { setProfileOpen(false); setSelectedUserId(null); }}
          activeTab={activeTab}
        />
      )}
    </div>
  );
}
