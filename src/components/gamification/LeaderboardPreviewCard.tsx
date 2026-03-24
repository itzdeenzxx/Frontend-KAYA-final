import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, ChevronRight, Flame, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getFullLeaderboard, FullLeaderboardEntry } from "@/lib/firestore";
import { UserTier } from "@/lib/types";

const TIER_GRADIENT: Record<UserTier, string> = {
  bronze:   "from-amber-700 to-amber-900",
  silver:   "from-gray-400 to-gray-600",
  gold:     "from-yellow-400 to-amber-600",
  platinum: "from-cyan-300 to-blue-500",
  diamond:  "from-purple-400 via-pink-400 to-blue-400",
};
const TIER_ICON: Record<UserTier, string> = {
  bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "⚪", diamond: "💎",
};

// Podium indexed by DATA position (0 = 1st place, 1 = 2nd, 2 = 3rd)
const PODIUM = [
  { h: 76, gradient: "from-yellow-400 to-amber-500", ring: "ring-yellow-400/80" }, // 0 → 1st GOLD
  { h: 56, gradient: "from-slate-400 to-slate-600", ring: "ring-slate-400/60" },   // 1 → 2nd SILVER
  { h: 38, gradient: "from-amber-600 to-amber-800", ring: "ring-amber-600/60" },   // 2 → 3rd BRONZE
] as const;
const ORDER = [1, 0, 2]; // display left=2nd, middle=1st, right=3rd

export function LeaderboardPreviewCard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const isDark = theme === "dark";

  const [top3, setTop3] = useState<FullLeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getFullLeaderboard(50)
      .then(data => {
        setTop3(data.slice(0, 3));
        if (userProfile?.lineUserId) {
          const idx = data.findIndex(d => d.userId === userProfile.lineUserId);
          if (idx >= 0) setMyRank(idx + 1);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userProfile?.lineUserId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate("/leaderboard")}
      className={cn(
        "relative overflow-hidden rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]",
        isDark
          ? "bg-gradient-to-br from-[#1a0c00] via-[#1f1000] to-[#120800] border border-white/8"
          : "bg-gradient-to-br from-orange-50 via-amber-50 to-white border border-orange-100 shadow-lg shadow-orange-500/8"
      )}
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(#dd6e53 1px,transparent 1px),linear-gradient(90deg,#dd6e53 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
      {/* Radial glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle,rgba(221,110,83,0.15),transparent_70%)]" />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md shadow-yellow-500/30 flex-shrink-0">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={cn("font-black text-sm leading-tight", isDark ? "text-white" : "text-gray-900")}>
                LEADERBOARD
              </h3>
              <p className={cn("text-[10px] font-medium", isDark ? "text-gray-500" : "text-gray-400")}>
                การแข่งขันระดับโลก
              </p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold",
            isDark ? "text-orange-400" : "text-primary"
          )}>
            ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : top3.length < 3 ? (
          <p className={cn("text-sm text-center py-6", isDark ? "text-gray-500" : "text-gray-400")}>
            ยังไม่มีข้อมูล
          </p>
        ) : (
          <>
            {/* Mini podium */}
            <div className="flex items-end justify-center gap-2 mb-4 px-2">
              {ORDER.map((dataIdx) => {
                const entry = top3[dataIdx];
                const p = PODIUM[dataIdx];
                const isFirst = dataIdx === 0;
                if (!entry) return null;
                return (
                  <div key={entry.userId} className="flex flex-col items-center flex-1">
                    {/* Crown for 1st */}
                    {isFirst && (
                      <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                        <Crown className="w-4 h-4 text-yellow-400 mb-0.5 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
                      </motion.div>
                    )}

                    {/* Avatar */}
                    <div className={cn(
                      "rounded-full overflow-hidden border-2 ring-2 flex-shrink-0",
                      p.ring,
                      isDark ? "border-[#1a0c00]" : "border-orange-50"
                    )}
                      style={{ width: isFirst ? 52 : 40, height: isFirst ? 52 : 40 }}
                    >
                      {entry.avatar ? (
                        <img src={entry.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className={cn(
                          "w-full h-full flex items-center justify-center font-black text-white bg-gradient-to-br",
                          TIER_GRADIENT[entry.tier as UserTier]
                        )} style={{ fontSize: isFirst ? 18 : 14 }}>
                          {entry.nickname?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <p className={cn(
                      "text-center truncate w-full px-0.5 mt-1 font-bold",
                      isFirst ? "text-[11px]" : "text-[9px]",
                      isDark ? "text-gray-200" : "text-gray-700"
                    )}>
                      {entry.nickname}
                    </p>
                    {/* Points */}
                    <p className={cn("text-[9px] font-semibold text-center mb-1",
                      isFirst ? "text-yellow-500" : isDark ? "text-gray-500" : "text-gray-400")}>
                      {(entry.points || 0).toLocaleString()} pts
                    </p>

                    {/* Pedestal */}
                    <div
                      className={cn("w-full rounded-t-lg flex items-center justify-center bg-gradient-to-b", p.gradient)}
                      style={{ height: p.h }}
                    >
                      {isFirst
                        ? <Trophy className="w-4 h-4 text-white/80" />
                        : <Medal className="w-3.5 h-3.5 text-white/80" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* My rank row */}
            {myRank ? (
              <div className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl",
                isDark ? "bg-white/[0.06] border border-white/8" : "bg-white/80 border border-orange-100"
              )}>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary" />
                  <span className={cn("text-xs font-semibold", isDark ? "text-gray-300" : "text-gray-600")}>
                    อันดับของคุณ
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-primary">#{myRank}</span>
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                </div>
              </div>
            ) : (
              <div className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold",
                isDark ? "bg-white/[0.04] text-gray-500" : "bg-white/70 text-gray-400")}>
                <Zap className="w-3.5 h-3.5" /> เริ่มออกกำลังกายเพื่อขึ้นอันดับ!
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
