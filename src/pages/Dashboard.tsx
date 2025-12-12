import { Flame, Timer, Moon, Droplets, Apple, Activity, Play, ChevronRight, Trophy, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { TierBadge } from "@/components/shared/TierBadge";
import { StreakCounter } from "@/components/shared/StreakCounter";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { ChallengeCard } from "@/components/gamification/ChallengeCard";
import { mockBadges, mockChallenges, mockWorkoutTemplates } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutHistory, useNutrition } from "@/hooks/useFirestore";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { lineProfile, userProfile, healthData, isAuthenticated, isLoading, isInitialized } = useAuth();
  const { stats } = useWorkoutHistory();
  const { logs: nutritionLogs } = useNutrition();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate("/login");
    }
  }, [isInitialized, isAuthenticated, navigate]);

  // Use real data when available
  const displayName = userProfile?.nickname || lineProfile?.displayName || "User";
  const userTier = userProfile?.tier || "silver";
  const streakDays = userProfile?.streakDays || 0;
  const userPoints = userProfile?.points || 0;
  
  // Real stats from Firestore
  const caloriesBurned = stats?.totalCalories || 0;
  const workoutTime = stats?.totalDuration ? Math.round(stats.totalDuration / 60) : 0;
  const totalWorkouts = stats?.totalWorkouts || 0;
  
  // Nutrition from today's log (first log is most recent)
  const todayLog = nutritionLogs.length > 0 ? nutritionLogs[0] : null;
  const dailyCalories = todayLog?.totalCalories || 0;
  const waterIntake = todayLog?.waterIntake ? Math.round(todayLog.waterIntake / 250) : 0; // Convert ml to cups
  
  // Goals based on health data
  const caloriesGoal = healthData?.weight ? Math.round(healthData.weight * 30) : 2000; // Rough estimate
  const waterGoal = 8; // 8 cups default
  
  const progress = caloriesGoal > 0 ? Math.round((caloriesBurned / caloriesGoal) * 100) : 0;
  const recommendedWorkout = mockWorkoutTemplates[0];

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-coral px-6 pt-12 pb-16 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/80 text-sm">{t('greeting.morning')}</p>
            <h1 className="text-2xl font-bold text-primary-foreground">{t('greeting.welcome')} {displayName}!</h1>
          </div>
          <Link
            to="/profile"
            className="w-12 h-12 rounded-full overflow-hidden bg-primary-foreground/20 backdrop-blur-xl flex items-center justify-center text-primary-foreground font-bold text-lg"
          >
            {lineProfile?.pictureUrl ? (
              <img src={lineProfile.pictureUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName[0]
            )}
          </Link>
        </div>

        {/* Tier & Streak */}
        <div className="flex items-center gap-3 mb-6">
          <TierBadge tier={userTier} size="md" />
          <StreakCounter days={streakDays} variant="compact" />
          <span className="text-primary-foreground/80 text-sm ml-auto">{userPoints} pts</span>
        </div>

        {/* Progress Ring Card */}
        <div className="bg-background/10 backdrop-blur-xl rounded-2xl p-6 flex items-center gap-6">
          <ProgressRing progress={progress} size={100} strokeWidth={8}>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-foreground">{progress}%</p>
              <p className="text-xs text-primary-foreground/70">{t('dashboard.goalLabel')}</p>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <p className="text-primary-foreground/80 text-sm mb-1">{t('dashboard.todayProgress')}</p>
            <p className="text-lg font-semibold text-primary-foreground mb-2">
              {caloriesBurned} / {caloriesGoal} {t('common.kcal')}
            </p>
            <div className="flex items-center gap-4 text-sm text-primary-foreground/80">
              <span className="flex items-center gap-1">
                <Timer className="w-4 h-4" /> {workoutTime} {t('common.min')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-6 relative z-10 space-y-6">
        {/* Start Workout CTA */}
        <div className="card-elevated p-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">{t('dashboard.readyWorkout')}</h3>
            <p className="text-muted-foreground text-sm">{t('dashboard.crushGoals')}</p>
          </div>
          <Button variant="hero" size="lg" asChild>
            <Link to="/workout-mode" className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              {t('dashboard.start')}
            </Link>
          </Button>
        </div>

        {/* Challenges */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('dashboard.challenges')}</h2>
            <Trophy className="w-5 h-5 text-energy" />
          </div>
          <div className="space-y-3">
            {mockChallenges.slice(0, 2).map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('gamification.badges')}</h2>
          <BadgeGrid badges={mockBadges} variant="horizontal" />
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.todayStats')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={Flame}
              label={t('dashboard.caloriesBurned')}
              value={caloriesBurned}
              unit={t('common.kcal')}
              color="coral"
            />
            <StatCard
              icon={Timer}
              label={t('dashboard.workoutTime')}
              value={workoutTime}
              unit={t('common.min')}
              color="energy"
            />
            <StatCard
              icon={Moon}
              label={t('dashboard.sleep')}
              value={totalWorkouts}
              unit="workouts"
              color="calm"
            />
            <StatCard
              icon={Droplets}
              label={t('dashboard.waterIntake')}
              value={`${waterIntake}/${waterGoal}`}
              unit={t('common.cups')}
              color="nature"
            />
          </div>
        </div>

        {/* Recommended Workout */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('dashboard.recommendedWorkout')}</h2>
            <Link to="/workout-mode" className="text-primary text-sm font-medium flex items-center gap-1">
              {t('dashboard.viewAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <Link to="/workout-mode" className="card-elevated p-5 flex items-center gap-4 group">
            <div className="w-16 h-16 rounded-xl gradient-coral flex items-center justify-center shadow-coral">
              <Activity className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                {i18n.language === 'th' ? recommendedWorkout.nameTh : recommendedWorkout.nameEn}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{recommendedWorkout.duration} {t('common.min')}</span>
                <span>•</span>
                <span>{recommendedWorkout.difficulty}</span>
                <span>•</span>
                <span>{recommendedWorkout.calories} {t('common.kcal')}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>

        {/* Food Summary */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('dashboard.foodSummary')}</h2>
            <Link to="/nutrition" className="text-primary text-sm font-medium flex items-center gap-1">
              {t('dashboard.viewAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-nature/10 flex items-center justify-center">
                <Apple className="w-6 h-6 text-nature" />
              </div>
              <div>
                <p className="font-semibold">{dailyCalories.toLocaleString()} / {caloriesGoal.toLocaleString()} {t('common.kcal')}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.dailyIntake')}</p>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-coral rounded-full" 
                style={{ width: `${Math.min((dailyCalories / caloriesGoal) * 100, 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}