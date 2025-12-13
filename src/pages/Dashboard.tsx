import { Flame, Timer, Droplets, Activity, Play, ChevronRight, Trophy, Loader2, Target, Zap, Sparkles, TrendingUp, Calendar, Dumbbell, Crown, Star, Brain } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { ChallengeCard } from "@/components/gamification/ChallengeCard";
import { mockBadges, mockChallenges } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutHistory, useNutrition } from "@/hooks/useFirestore";
import { useTheme } from "@/contexts/ThemeContext";

// Tier configurations
const tierConfig = {
  bronze: {
    name: 'BRONZE',
    color: 'from-amber-700 to-amber-900',
    textColor: 'text-amber-400',
    icon: Star,
    glow: 'shadow-amber-500/20'
  },
  silver: {
    name: 'SILVER',
    color: 'from-gray-300 to-gray-500',
    textColor: 'text-gray-300',
    icon: Star,
    glow: 'shadow-gray-400/20'
  },
  gold: {
    name: 'GOLD',
    color: 'from-yellow-400 to-amber-600',
    textColor: 'text-yellow-400',
    icon: Crown,
    glow: 'shadow-yellow-500/30'
  },
  platinum: {
    name: 'PLATINUM',
    color: 'from-cyan-300 to-blue-500',
    textColor: 'text-cyan-300',
    icon: Crown,
    glow: 'shadow-cyan-500/30'
  },
  diamond: {
    name: 'DIAMOND',
    color: 'from-purple-400 via-pink-400 to-blue-400',
    textColor: 'text-purple-300',
    icon: Crown,
    glow: 'shadow-purple-500/40'
  }
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { lineProfile, userProfile, healthData, isAuthenticated, isLoading, isInitialized } = useAuth();
  const { stats } = useWorkoutHistory();
  const { logs: nutritionLogs } = useNutrition();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate("/login");
    }
  }, [isInitialized, isAuthenticated, navigate]);

  const displayName = userProfile?.nickname || lineProfile?.displayName || "User";
  const userTier = (userProfile?.tier || "silver") as keyof typeof tierConfig;
  const streakDays = userProfile?.streakDays || 0;
  const userPoints = userProfile?.points || 0;
  
  const caloriesBurned = stats?.totalCalories || 0;
  const workoutTime = stats?.totalDuration ? Math.round(stats.totalDuration / 60) : 0;
  const totalWorkouts = stats?.totalWorkouts || 0;
  
  const todayLog = nutritionLogs.length > 0 ? nutritionLogs[0] : null;
  const waterIntake = todayLog?.waterIntake ? Math.round(todayLog.waterIntake / 250) : 0;
  
  const caloriesGoal = healthData?.weight ? Math.round(healthData.weight * 30) : 2000;
  const waterGoal = 8;
  
  const progress = caloriesGoal > 0 ? Math.round((caloriesBurned / caloriesGoal) * 100) : 0;
  const tier = tierConfig[userTier] || tierConfig.silver;
  const TierIcon = tier.icon;

  if (isLoading || !isInitialized) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDark ? "bg-black" : "bg-gray-50"
      )}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className={isDark ? "text-gray-400" : "text-gray-500"}>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen relative overflow-x-hidden pb-24",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Animated Background - Dark Theme Only */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/3 -left-40 w-60 h-60 bg-purple-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
      )}

      <div className="relative z-10">
        {/* Header Section */}
        <div className="px-4 md:px-6 pt-8 pb-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>{t('greeting.morning')}</p>
              <h1 className="text-2xl font-bold">{t('greeting.welcome')} {displayName}!</h1>
            </div>
            <Link
              to="/profile"
              className={cn(
                "w-12 h-12 rounded-full overflow-hidden backdrop-blur-xl flex items-center justify-center ring-2 transition-all",
                isDark 
                  ? "bg-white/10 ring-white/20 hover:ring-primary/50" 
                  : "bg-white ring-gray-200 hover:ring-primary/50 shadow-sm"
              )}
            >
              {lineProfile?.pictureUrl ? (
                <img src={lineProfile.pictureUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold">{displayName[0]}</span>
              )}
            </Link>
          </div>

          {/* Tier & Stats Banner */}
          <div className={cn(
            "relative rounded-2xl overflow-hidden p-5",
            "bg-gradient-to-r",
            tier.color
          )}>
            {/* Animated glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 animate-pulse" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <TierIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-black text-white">{tier.name}</span>
                    <Sparkles className="w-5 h-5 text-white/80" />
                  </div>
                  <p className="text-white/80 text-sm">{userPoints.toLocaleString()} points</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <Flame className="w-5 h-5 text-white" />
                  <span className="text-2xl font-bold text-white">{streakDays}</span>
                </div>
                <p className="text-white/80 text-sm">Day Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 md:px-6 space-y-6">
          {/* Start Workout Banner */}
          <Link 
            to="/workout-selection"
            className="block relative rounded-2xl overflow-hidden group"
          >
            <img 
              src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80"
              alt="Start Workout"
              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
            <div className="absolute inset-0 p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-white" />
                  <span className="text-white/90 text-sm font-medium">AI-Powered</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{t('dashboard.readyWorkout')}</h3>
                <p className="text-white/80 text-sm">{t('dashboard.crushGoals')}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </Link>

          {/* Progress Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Calories Burned */}
            <div className={cn(
              "backdrop-blur border rounded-2xl p-4 relative overflow-hidden group transition-colors",
              isDark 
                ? "bg-white/5 border-white/10 hover:border-orange-500/50" 
                : "bg-white border-gray-200 shadow-sm hover:border-orange-500/50"
            )}>
              <div className={cn(
                "absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-colors",
                isDark ? "bg-orange-500/10 group-hover:bg-orange-500/20" : "bg-orange-500/5 group-hover:bg-orange-500/10"
              )} />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{caloriesBurned.toLocaleString()}</p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{t('dashboard.caloriesBurned')}</p>
                <div className={cn(
                  "mt-2 h-1 rounded-full overflow-hidden",
                  isDark ? "bg-white/10" : "bg-gray-200"
                )}>
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Workout Time */}
            <div className={cn(
              "backdrop-blur border rounded-2xl p-4 relative overflow-hidden group transition-colors",
              isDark 
                ? "bg-white/5 border-white/10 hover:border-blue-500/50" 
                : "bg-white border-gray-200 shadow-sm hover:border-blue-500/50"
            )}>
              <div className={cn(
                "absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-colors",
                isDark ? "bg-blue-500/10 group-hover:bg-blue-500/20" : "bg-blue-500/5 group-hover:bg-blue-500/10"
              )} />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                  <Timer className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{workoutTime}</p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{t('dashboard.workoutTime')}</p>
              </div>
            </div>

            {/* Total Workouts */}
            <div className={cn(
              "backdrop-blur border rounded-2xl p-4 relative overflow-hidden group transition-colors",
              isDark 
                ? "bg-white/5 border-white/10 hover:border-purple-500/50" 
                : "bg-white border-gray-200 shadow-sm hover:border-purple-500/50"
            )}>
              <div className={cn(
                "absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-colors",
                isDark ? "bg-purple-500/10 group-hover:bg-purple-500/20" : "bg-purple-500/5 group-hover:bg-purple-500/10"
              )} />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{totalWorkouts}</p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Total Workouts</p>
              </div>
            </div>

            {/* Water Intake */}
            <div className={cn(
              "backdrop-blur border rounded-2xl p-4 relative overflow-hidden group transition-colors",
              isDark 
                ? "bg-white/5 border-white/10 hover:border-cyan-500/50" 
                : "bg-white border-gray-200 shadow-sm hover:border-cyan-500/50"
            )}>
              <div className={cn(
                "absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-colors",
                isDark ? "bg-cyan-500/10 group-hover:bg-cyan-500/20" : "bg-cyan-500/5 group-hover:bg-cyan-500/10"
              )} />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-3">
                  <Droplets className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{waterIntake}/{waterGoal}</p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{t('dashboard.waterIntake')}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Link to="/workout-selection" className={cn(
                "flex flex-col items-center p-3 rounded-xl border transition-colors group",
                isDark 
                  ? "bg-white/5 border-white/10 hover:border-primary/50" 
                  : "bg-white border-gray-200 shadow-sm hover:border-primary/50"
              )}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Workout</span>
              </Link>
              <Link to="/nutrition" className={cn(
                "flex flex-col items-center p-3 rounded-xl border transition-colors group",
                isDark 
                  ? "bg-white/5 border-white/10 hover:border-green-500/50" 
                  : "bg-white border-gray-200 shadow-sm hover:border-green-500/50"
              )}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Nutrition</span>
              </Link>
              <Link to="/ai-coach" className={cn(
                "flex flex-col items-center p-3 rounded-xl border transition-colors group",
                isDark 
                  ? "bg-white/5 border-white/10 hover:border-purple-500/50" 
                  : "bg-white border-gray-200 shadow-sm hover:border-purple-500/50"
              )}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>AI Coach</span>
              </Link>
              <Link to="/profile" className={cn(
                "flex flex-col items-center p-3 rounded-xl border transition-colors group",
                isDark 
                  ? "bg-white/5 border-white/10 hover:border-cyan-500/50" 
                  : "bg-white border-gray-200 shadow-sm hover:border-cyan-500/50"
              )}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Goals</span>
              </Link>
            </div>
          </div>

          {/* Challenges Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold">{t('dashboard.challenges')}</h2>
              </div>
              <Link to="/challenges" className="text-primary text-sm flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {mockChallenges.slice(0, 2).map(challenge => (
                <div key={challenge.id} className={cn(
                  "backdrop-blur border rounded-xl p-4 transition-colors",
                  isDark 
                    ? "bg-white/5 border-white/10 hover:border-primary/30" 
                    : "bg-white border-gray-200 shadow-sm hover:border-primary/30"
                )}>
                  <ChallengeCard challenge={challenge} />
                </div>
              ))}
            </div>
          </div>

          {/* Badges Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold">{t('gamification.badges')}</h2>
              </div>
            </div>
            <div className={cn(
              "backdrop-blur border rounded-xl p-4",
              isDark 
                ? "bg-white/5 border-white/10" 
                : "bg-white border-gray-200 shadow-sm"
            )}>
              <BadgeGrid badges={mockBadges} variant="horizontal" />
            </div>
          </div>

          {/* Weekly Progress Banner */}
          <div className="relative rounded-2xl overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80"
              alt="Weekly Progress"
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-transparent" />
            <div className="absolute inset-0 p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">+12% vs last week</span>
                </div>
                <h3 className="text-xl font-bold text-white">Weekly Progress</h3>
              </div>
              <Link 
                to="/profile"
                className="px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-white text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                View Stats <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
