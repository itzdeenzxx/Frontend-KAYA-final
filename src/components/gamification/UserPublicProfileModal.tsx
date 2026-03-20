import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Timer, Dumbbell, Star, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { getLeaderboardUserDetails } from "@/lib/firestore";
import { UserTier } from "@/lib/types";

type TabKey = "rank" | "workouts" | "time" | "games" | "level" | "streak";

const TIER_GRADIENT: Record<UserTier, string> = {
  bronze:   "from-amber-700 to-amber-900",
  silver:   "from-gray-400 to-gray-600",
  gold:     "from-yellow-400 to-amber-600",
  platinum: "from-cyan-300 to-blue-500",
  diamond:  "from-purple-400 via-pink-400 to-blue-400",
};
const TIER_LABEL: Record<UserTier, string> = {
  bronze:"Bronze", silver:"Silver", gold:"Gold", platinum:"Platinum", diamond:"Diamond",
};
const TIER_ICON: Record<UserTier, string> = {
  bronze:"🥉", silver:"🥈", gold:"🥇", platinum:"⚪", diamond:"💎",
};

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface Props {
  userId: string;
  open: boolean;
  onClose: () => void;
  activeTab?: TabKey;
}

export function UserPublicProfileModal({ userId, open, onClose, activeTab }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState<Awaited<ReturnType<typeof getLeaderboardUserDetails>> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setData(null);
    setLoading(true);
    getLeaderboardUserDetails(userId)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, [open, userId]);

  const profile = data?.profile;
  const tier = (profile?.tier ?? "bronze") as UserTier;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — covers full screen including sidebar */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Centering wrapper — truly full viewport */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              onClick={e => e.stopPropagation()}
              className={cn(
                "pointer-events-auto w-full max-w-[440px] rounded-3xl overflow-hidden shadow-2xl",
                isDark
                  ? "bg-[#111118] border border-white/10"
                  : "bg-white border border-gray-100"
              )}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className={cn(
                  "absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                  isDark
                    ? "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                )}
              >
                <X className="w-4 h-4" />
              </button>

              {loading || !profile ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>
                    กำลังโหลด...
                  </p>
                </div>
              ) : (
                <>
                  {/* ── TIER BANNER (z-0) ── */}
                  <div className={cn(
                    "relative z-0 h-[100px] bg-gradient-to-br overflow-hidden flex-shrink-0",
                    TIER_GRADIENT[tier]
                  )}>
                    {/* Grid texture */}
                    <div className="absolute inset-0 opacity-[0.07]"
                      style={{
                        backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
                        backgroundSize: "24px 24px",
                      }}
                    />
                    <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
                    <div className="absolute top-5 left-5 opacity-20">
                      {["gold","platinum","diamond"].includes(tier)
                        ? <Crown className="w-10 h-10 text-white" />
                        : <Star className="w-10 h-10 text-white" />}
                    </div>
                  </div>

                  {/* ── CONTENT (z-10 sits above banner) ── */}
                  <div className="relative z-10 flex flex-col items-center px-6 pb-6 -mt-12">
                    {/* Avatar */}
                    <div className={cn(
                      "w-24 h-24 rounded-full border-4 overflow-hidden shadow-2xl flex-shrink-0",
                      isDark ? "border-[#111118]" : "border-white"
                    )}>
                      {profile.pictureUrl ? (
                        <img
                          src={profile.pictureUrl}
                          className="w-full h-full object-cover"
                          alt={profile.nickname ?? profile.displayName}
                        />
                      ) : (
                        <div className={cn(
                          "w-full h-full flex items-center justify-center text-3xl font-black text-white bg-gradient-to-br",
                          TIER_GRADIENT[tier]
                        )}>
                          {(profile.nickname ?? profile.displayName ?? "?")[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <h2 className={cn(
                      "text-xl font-black mt-3 text-center",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {profile.nickname ?? profile.displayName}
                    </h2>

                    {/* Tier chip */}
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-white mt-2 bg-gradient-to-r",
                      TIER_GRADIENT[tier]
                    )}>
                      {TIER_ICON[tier]} {TIER_LABEL[tier]}
                    </span>

                    {/* Stats — 3-col grid */}
                    <div className="grid grid-cols-3 gap-2.5 mt-5 w-full">
                      <StatBox
                        isDark={isDark}
                        icon={<Trophy className="w-5 h-5 text-yellow-500" />}
                        label="อันดับ"
                        value={`#${data?.rank ?? "-"}`}
                        hl={activeTab === "rank"}
                      />
                      <StatBox
                        isDark={isDark}
                        icon={<span className="text-xl leading-none">🔥</span>}
                        label="สตรีค"
                        value={`${profile.streakDays ?? 0} วัน`}
                        hl={activeTab === "streak"}
                      />
                      <StatBox
                        isDark={isDark}
                        icon={<span className="text-xl leading-none">{TIER_ICON[tier]}</span>}
                        label="เลเวล"
                        value={TIER_LABEL[tier]}
                        hl={activeTab === "level"}
                        small
                      />
                      <StatBox
                        isDark={isDark}
                        icon={<Dumbbell className="w-5 h-5 text-purple-400" />}
                        label="จำนวนครั้ง"
                        value={`${data?.totalWorkouts ?? 0}`}
                        sub="ครั้ง"
                        hl={activeTab === "workouts"}
                      />
                      <StatBox
                        isDark={isDark}
                        icon={<Timer className="w-5 h-5 text-blue-400" />}
                        label="เวลารวม"
                        value={fmt(data?.totalWorkoutTime ?? 0)}
                        hl={activeTab === "time"}
                      />
                      <StatBox
                        isDark={isDark}
                        icon={<Star className="w-5 h-5 text-orange-400" />}
                        label="พอยท์"
                        value={
                          (profile.points ?? 0) >= 1000
                            ? `${((profile.points ?? 0) / 1000).toFixed(1)}k`
                            : String(profile.points ?? 0)
                        }
                        hl={false}
                      />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatBox({
  isDark, icon, label, value, sub, hl, small,
}: {
  isDark: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  hl?: boolean;
  small?: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-1 p-3 rounded-2xl text-center",
      hl
        ? isDark
          ? "bg-primary/20 border border-primary/40"
          : "bg-primary/8 border border-primary/25"
        : isDark
          ? "bg-white/[0.05] border border-white/[0.07]"
          : "bg-gray-50 border border-gray-100"
    )}>
      {icon}
      <p className={cn(
        "font-black leading-tight",
        small ? "text-xs" : "text-sm",
        hl ? "text-primary" : isDark ? "text-white" : "text-gray-900"
      )}>
        {value}
        {sub && (
          <span className={cn(
            "font-normal text-[10px] ml-0.5",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            {sub}
          </span>
        )}
      </p>
      <p className={cn(
        "text-[10px] leading-tight",
        isDark ? "text-gray-600" : "text-gray-400"
      )}>
        {label}
      </p>
    </div>
  );
}
