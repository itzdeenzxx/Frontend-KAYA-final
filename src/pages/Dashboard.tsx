import { useState, useEffect } from "react";
import { Flame, Timer, Droplets, Activity, Play, ChevronRight, Trophy, Loader2, Target, Zap, Sparkles, TrendingUp, Calendar, Dumbbell, Crown, Star, Brain, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { ChallengeCard } from "@/components/gamification/ChallengeCard";
import { mockBadges } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutHistory, useNutrition, useChallenges, useDailyStats } from "@/hooks/useFirestore";
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
  const { challenges } = useChallenges();
  const { todayStats, cumulativeStats, addWater } = useDailyStats();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isAddingWater, setIsAddingWater] = useState(false);
  
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate("/login");
    }
  }, [isInitialized, isAuthenticated, navigate]);

  const displayName = userProfile?.nickname || lineProfile?.displayName || "User";
  const userTier = (userProfile?.tier || "silver") as keyof typeof tierConfig;
  const streakDays = userProfile?.streakDays || 0;
  const userPoints = userProfile?.points || 0;
  
  // Use daily stats from Firebase (today's data)
  const caloriesBurned = todayStats?.caloriesBurned || 0;
  const workoutTimeSeconds = todayStats?.workoutTime || 0;
  const totalWorkouts = cumulativeStats?.totalWorkouts || 0;
  const waterIntake = todayStats?.waterIntake || 0;
  
  // Format workout time as hh:mm:ss
  const formatWorkoutTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const workoutTimeDisplay = formatWorkoutTime(workoutTimeSeconds);
  
  const caloriesGoal = healthData?.weight ? Math.round(healthData.weight * 30) : 2000;
  const waterGoal = 8;
  
  const progress = caloriesGoal > 0 ? Math.round((caloriesBurned / caloriesGoal) * 100) : 0;
  const tier = tierConfig[userTier] || tierConfig.silver;
  const TierIcon = tier.icon;

  // Handle adding water
  const handleAddWater = async () => {
    if (isAddingWater || waterIntake >= waterGoal) return;
    
    setIsAddingWater(true);
    try {
      await addWater();
    } finally {
      setIsAddingWater(false);
    }
  };

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

  // Desktop Layout Component - No sidebar (handled by AppLayout)
  const DesktopLayout = () => (
    <div className={cn(
      "min-h-screen",
      isDark ? "bg-[#0a0a0f] text-white" : "bg-slate-100 text-gray-900"
    )}>
      {/* Main Content Area */}
      <div className="min-h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className={cn(
          "sticky top-0 z-30 backdrop-blur-xl border-b px-8 py-4",
          isDark ? "bg-[#0a0a0f]/80 border-white/10" : "bg-slate-100/80 border-gray-200"
        )}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-500")}>{t('greeting.morning')}</p>
              <h1 className="text-xl font-bold">{t('greeting.welcome')} {displayName}!</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
                isDark ? "bg-white/5" : "bg-white shadow-sm"
              )}>
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Stats Grid - Large Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {/* Calories */}
            <div className={cn(
              "group relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer",
              isDark ? "bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20" : "bg-white shadow-lg shadow-orange-500/10"
            )}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-black mb-1">{caloriesBurned.toLocaleString()}</p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{t('dashboard.caloriesBurned')}</p>
                <div className={cn("mt-3 h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Workout Time */}
            <div className={cn(
              "group relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer",
              isDark ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20" : "bg-white shadow-lg shadow-blue-500/10"
            )}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-black mb-1 font-mono">{workoutTimeDisplay}</p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{t('dashboard.workoutTime')}</p>
              </div>
            </div>

            {/* Total Workouts */}
            <div className={cn(
              "group relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer",
              isDark ? "bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20" : "bg-white shadow-lg shadow-purple-500/10"
            )}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-black mb-1">{totalWorkouts}</p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Total Workouts</p>
              </div>
            </div>

            {/* Water */}
            <div 
              onClick={handleAddWater}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer",
                isDark ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20" : "bg-white shadow-lg shadow-cyan-500/10",
                waterIntake >= waterGoal && "opacity-70"
              )}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Droplets className="w-6 h-6 text-white" />
                  </div>
                  {waterIntake < waterGoal && (
                    <button
                      disabled={isAddingWater}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        isDark 
                          ? "bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400" 
                          : "bg-cyan-100 hover:bg-cyan-200 text-cyan-600",
                        isAddingWater && "animate-pulse"
                      )}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="text-3xl font-black mb-1">{waterIntake}/{waterGoal}</p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  {waterIntake >= waterGoal ? "✓ " : ""}{t('dashboard.waterIntake')}
                </p>
                {/* Water progress bar */}
                <div className={cn("mt-2 h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300" 
                    style={{ width: `${(waterIntake / waterGoal) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-3 gap-4">
            {/* Left Column - Main Content */}
            <div className="col-span-2 space-y-4">
              {/* Start Workout Hero */}
              <Link to="/workout-selection" className="block group">
                <div className={cn(
                  "relative overflow-hidden rounded-2xl h-56 transition-all hover:scale-[1.01]",
                  isDark ? "bg-gradient-to-br from-primary/30 to-orange-500/20" : "bg-gradient-to-br from-primary to-orange-500"
                )}>
                  <img 
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80"
                    alt="Start Workout"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
                  <div className="relative h-full p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-5 h-5 text-white" />
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">AI-Powered</span>
                      </div>
                      <h2 className="text-2xl font-black text-white mb-1">{t('dashboard.readyWorkout')}</h2>
                      <p className="text-white/80 text-sm">{t('dashboard.crushGoals')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      </div>
                      <span className="text-white font-semibold">Start Now</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Challenges Section */}
              <div className={cn(
                "rounded-2xl p-5",
                isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-lg"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{t('dashboard.challenges')}</h2>
                      <p className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>Complete for bonus points</p>
                    </div>
                  </div>
                  <Link to="/challenges" className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {challenges.length > 0 ? (
                    challenges.slice(0, 4).map(challenge => (
                      <div key={challenge.id} className={cn(
                        "p-4 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer",
                        isDark ? "bg-white/5 border-white/10 hover:border-primary/50" : "bg-gray-50 border-gray-200 hover:border-primary/50"
                      )}>
                        <ChallengeCard challenge={challenge} />
                      </div>
                    ))
                  ) : (
                    <div className={cn(
                      "col-span-2 p-8 rounded-2xl border text-center",
                      isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                    )}>
                      <Target className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-gray-500" : "text-gray-400")} />
                      <p className={cn("font-medium", isDark ? "text-gray-400" : "text-gray-500")}>ยังไม่มี Challenge</p>
                      <p className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>เริ่มออกกำลังกายเพื่อรับ Challenge ใหม่!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Tier Card */}
              <div className={cn(
                "relative overflow-hidden rounded-3xl p-6",
                "bg-gradient-to-br",
                tier.color
              )}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <TierIcon className="w-9 h-9 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-white">{tier.name}</span>
                        <Sparkles className="w-5 h-5 text-white/80" />
                      </div>
                      <p className="text-white/70 text-sm">{userPoints.toLocaleString()} points</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-white/90 text-sm">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4" />
                      <span>{streakDays} Day Streak</span>
                    </div>
                    <Link to="/profile" className="hover:underline">View Profile →</Link>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={cn(
                "rounded-3xl p-6",
                isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-lg"
              )}>
                <h3 className="font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link to="/workout-selection" className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]",
                    isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100"
                  )}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium">Start Workout</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                  </Link>
                  <Link to="/ai-coach" className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]",
                    isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100"
                  )}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium">AI Coach</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                  </Link>
                  <Link to="/nutrition" className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]",
                    isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100"
                  )}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium">Nutrition</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                  </Link>
                </div>
              </div>

              {/* Badges */}
              <div className={cn(
                "rounded-3xl p-6",
                isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-lg"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold">{t('gamification.badges')}</h3>
                </div>
                <BadgeGrid badges={mockBadges} variant="horizontal" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Layout Component (Original Design)
  const MobileLayout = () => (
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
        <div className="px-4 pt-8 pb-6">
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
        <div className="px-4 space-y-6">
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
                <p className="text-xl font-bold font-mono">{workoutTimeDisplay}</p>
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
            <div 
              onClick={handleAddWater}
              className={cn(
                "backdrop-blur border rounded-2xl p-4 relative overflow-hidden group transition-colors cursor-pointer",
                isDark 
                  ? "bg-white/5 border-white/10 hover:border-cyan-500/50" 
                  : "bg-white border-gray-200 shadow-sm hover:border-cyan-500/50",
                waterIntake >= waterGoal && "opacity-70"
              )}
            >
              <div className={cn(
                "absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-colors",
                isDark ? "bg-cyan-500/10 group-hover:bg-cyan-500/20" : "bg-cyan-500/5 group-hover:bg-cyan-500/10"
              )} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
                  {waterIntake < waterGoal && (
                    <button
                      disabled={isAddingWater}
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                        isDark 
                          ? "bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400" 
                          : "bg-cyan-100 hover:bg-cyan-200 text-cyan-600",
                        isAddingWater && "animate-pulse"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-2xl font-bold">{waterIntake}/{waterGoal}</p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  {waterIntake >= waterGoal ? "✓ " : ""}{t('dashboard.waterIntake')}
                </p>
                {/* Water progress bar */}
                <div className={cn("mt-2 h-1 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300" 
                    style={{ width: `${(waterIntake / waterGoal) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Mobile */}
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

          {/* Challenges Section - Mobile */}
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
              {challenges.length > 0 ? (
                challenges.slice(0, 2).map(challenge => (
                  <div key={challenge.id} className={cn(
                    "backdrop-blur border rounded-xl p-4 transition-colors",
                    isDark 
                      ? "bg-white/5 border-white/10 hover:border-primary/30" 
                      : "bg-white border-gray-200 shadow-sm hover:border-primary/30"
                  )}>
                    <ChallengeCard challenge={challenge} />
                  </div>
                ))
              ) : (
                <div className={cn(
                  "p-6 rounded-xl border text-center",
                  isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
                )}>
                  <Target className={cn("w-10 h-10 mx-auto mb-2", isDark ? "text-gray-500" : "text-gray-400")} />
                  <p className={cn("font-medium text-sm", isDark ? "text-gray-400" : "text-gray-500")}>ยังไม่มี Challenge</p>
                </div>
              )}
            </div>

          {/* Badges Section - Mobile */}
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

          {/* Weekly Progress Banner - Mobile */}
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

  // Detect screen size and render appropriate layout
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}
