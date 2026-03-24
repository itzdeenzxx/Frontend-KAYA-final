import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Trophy, Flame, Timer, Dumbbell, Star, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { getLeaderboardUserDetails } from "@/lib/firestore";
import { UserTier } from "@/lib/types";

const TIER_GRADIENT: Record<UserTier, string> = {
  bronze:   "from-amber-700 to-amber-900",
  silver:   "from-gray-400 to-gray-600",
  gold:     "from-yellow-400 to-amber-600",
  platinum: "from-cyan-300 to-blue-500",
  diamond:  "from-purple-400 via-pink-400 to-blue-400",
};
const TIER_LABEL: Record<UserTier, string> = {
  bronze: "Bronze", silver: "Silver", gold: "Gold",
  platinum: "Platinum", diamond: "Diamond",
};
const TIER_ICON: Record<UserTier, string> = {
  bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "⚪", diamond: "💎",
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} ชม. ${m} น.`;
  return `${m} นาที`;
}

export default function UserPublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState<Awaited<ReturnType<typeof getLeaderboardUserDetails>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    getLeaderboardUserDetails(userId)
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId]);

  const profile = data?.profile;
  const tier = (profile?.tier ?? "bronze") as UserTier;

  return (
    <div className={cn("min-h-screen", isDark ? "bg-[#0a0a0f] text-white" : "bg-slate-100 text-gray-900")}>
      {/* Hero banner */}
      <div className={cn("relative overflow-hidden h-56 bg-gradient-to-br", TIER_GRADIENT[tier])}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent" />

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1 text-white/80 hover:text-white z-10 transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Leaderboard</span>
        </button>

        {/* Tier icon */}
        <div className="absolute top-4 right-4 opacity-20">
          {tier === "gold" || tier === "platinum" || tier === "diamond"
            ? <Crown className="w-14 h-14 text-white" />
            : <Star className="w-14 h-14 text-white" />}
        </div>
      </div>

      {isLoading || !profile ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>กำลังโหลด...</p>
        </div>
      ) : (
        <div className="px-4 pb-24">
          {/* Avatar */}
          <div className="flex flex-col items-center -mt-14">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={cn("w-28 h-28 rounded-full border-4 overflow-hidden shadow-2xl flex-shrink-0",
                isDark ? "border-[#0a0a0f]" : "border-slate-100")}
            >
              {profile.pictureUrl ? (
                <img src={profile.pictureUrl} className="w-full h-full object-cover"
                  alt={profile.nickname ?? profile.displayName} />
              ) : (
                <div className={cn(
                  "w-full h-full flex items-center justify-center text-4xl font-black text-white bg-gradient-to-br",
                  TIER_GRADIENT[tier]
                )}>
                  {(profile.nickname ?? profile.displayName ?? "?")[0]?.toUpperCase()}
                </div>
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn("text-2xl font-black mt-3 text-center",
                isDark ? "text-white" : "text-gray-900")}
            >
              {profile.nickname ?? profile.displayName}
            </motion.h1>

            <motion.span
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold text-white mt-2 bg-gradient-to-r",
                TIER_GRADIENT[tier])}
            >
              <span className="text-base">{TIER_ICON[tier]}</span>
              {TIER_LABEL[tier]}
            </motion.span>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3 mt-6"
          >
            <BigStat isDark={isDark} icon={<Trophy className="w-6 h-6 text-yellow-500" />}
              label="อันดับโลก" value={`#${data?.rank ?? "-"}`} accent="yellow" />
            <BigStat isDark={isDark} icon={<span className="text-2xl">⭐</span>}
              label="พอยท์สะสม" value={(profile.points ?? 0).toLocaleString()} accent="orange" />
            <BigStat isDark={isDark} icon={<Flame className="w-6 h-6 text-red-500" />}
              label="สตรีคต่อเนื่อง" value={`${profile.streakDays ?? 0} วัน`} accent="red" />
            <BigStat isDark={isDark} icon={<Dumbbell className="w-6 h-6 text-purple-500" />}
              label="ออกกำลังกาย" value={`${data?.totalWorkouts ?? 0} ครั้ง`} accent="purple" />
            <BigStat isDark={isDark} icon={<Timer className="w-6 h-6 text-blue-500" />}
              label="เวลาออกกำลังกาย" value={formatTime(data?.totalWorkoutTime ?? 0)} accent="blue" wide />
            <BigStat isDark={isDark} icon={<Star className="w-6 h-6 text-orange-500" />}
              label="ระดับ" value={TIER_LABEL[tier]} accent="primary" />
          </motion.div>

          {/* Back button */}
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            onClick={() => navigate(-1)}
            className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-primary to-orange-500 text-white font-black text-base shadow-xl shadow-primary/30 hover:opacity-90 transition-opacity"
          >
            กลับไป Leaderboard
          </motion.button>
        </div>
      )}
    </div>
  );
}

function BigStat({
  isDark, icon, label, value, accent, wide,
}: {
  isDark: boolean; icon: React.ReactNode; label: string;
  value: string; accent?: string; wide?: boolean;
}) {
  const accentMap: Record<string, string> = {
    yellow: "from-yellow-500/15 to-amber-500/5 border-yellow-500/25",
    orange: "from-orange-500/15 to-amber-500/5 border-orange-500/25",
    red:    "from-red-500/15 to-orange-500/5 border-red-500/25",
    purple: "from-purple-500/15 to-pink-500/5 border-purple-500/25",
    blue:   "from-blue-500/15 to-cyan-500/5 border-blue-500/25",
    primary:"from-primary/15 to-orange-500/5 border-primary/25",
  };
  const accentClass = accent && isDark ? `bg-gradient-to-br ${accentMap[accent] ?? ""} border` : "";

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-4",
      wide ? "col-span-2" : "",
      isDark
        ? cn("border", accentClass || "bg-white/[0.04] border-white/8")
        : "bg-white shadow-sm border border-gray-100"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center mb-2.5",
        isDark ? "bg-white/8" : "bg-gray-50"
      )}>
        {icon}
      </div>
      <p className={cn("text-xl font-black leading-tight", isDark ? "text-white" : "text-gray-900")}>{value}</p>
      <p className={cn("text-xs mt-0.5", isDark ? "text-gray-500" : "text-gray-400")}>{label}</p>
    </div>
  );
}
