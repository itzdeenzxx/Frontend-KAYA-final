import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Camera, 
  Edit2, 
  ChevronRight, 
  Target, 
  TrendingUp, 
  LogOut, 
  Loader2, 
  Activity, 
  TrendingDown, 
  Dumbbell,
  Settings,
  Scale,
  Ruler,
  Calendar,
  Flame,
  Timer,
  Heart,
  Zap,
  Crown,
  Star,
  Sparkles,
  Trophy,
  Medal,
  Award,
  Gem
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthData, useUserProfile, useWorkoutHistory } from "@/hooks/useFirestore";
import { useTheme } from "@/contexts/ThemeContext";

const goals = [
  { label: "Lose Weight", labelTh: "ลดน้ำหนัก", icon: TrendingDown, color: 'from-green-500 to-emerald-500' },
  { label: "Build Muscle", labelTh: "สร้างกล้ามเนื้อ", icon: Dumbbell, color: 'from-purple-500 to-pink-500' },
  { label: "Stay Fit", labelTh: "ฟิตแอนด์เฟิร์ม", icon: Target, color: 'from-blue-500 to-cyan-500' },
  { label: "Improve Endurance", labelTh: "เพิ่มความทนทาน", icon: Activity, color: 'from-orange-500 to-red-500' },
];

// Epic Tier Configurations
const tierConfig = {
  bronze: {
    name: 'BRONZE',
    subtitle: 'Warrior',
    color: 'from-amber-700 via-amber-600 to-amber-800',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    icon: Star,
    secondaryIcon: Medal,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    glow: 'shadow-amber-500/30',
    particles: 'bg-amber-400',
    nextTier: 'silver',
    pointsToNext: 1000
  },
  silver: {
    name: 'SILVER',
    subtitle: 'Champion',
    color: 'from-gray-400 via-gray-300 to-gray-500',
    textColor: 'text-gray-200',
    borderColor: 'border-gray-400/50',
    icon: Star,
    secondaryIcon: Trophy,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    glow: 'shadow-gray-400/30',
    particles: 'bg-gray-300',
    nextTier: 'gold',
    pointsToNext: 5000
  },
  gold: {
    name: 'GOLD',
    subtitle: 'Elite',
    color: 'from-yellow-500 via-amber-400 to-yellow-600',
    textColor: 'text-yellow-300',
    borderColor: 'border-yellow-500/50',
    icon: Crown,
    secondaryIcon: Trophy,
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80',
    glow: 'shadow-yellow-500/40',
    particles: 'bg-yellow-400',
    nextTier: 'platinum',
    pointsToNext: 15000
  },
  platinum: {
    name: 'PLATINUM',
    subtitle: 'Master',
    color: 'from-cyan-400 via-blue-400 to-indigo-500',
    textColor: 'text-cyan-200',
    borderColor: 'border-cyan-400/50',
    icon: Crown,
    secondaryIcon: Award,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    glow: 'shadow-cyan-500/50',
    particles: 'bg-cyan-300',
    nextTier: 'diamond',
    pointsToNext: 50000
  },
  diamond: {
    name: 'DIAMOND',
    subtitle: 'Legend',
    color: 'from-purple-500 via-pink-400 to-blue-500',
    textColor: 'text-purple-200',
    borderColor: 'border-purple-400/50',
    icon: Gem,
    secondaryIcon: Crown,
    image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80',
    glow: 'shadow-purple-500/50',
    particles: 'bg-purple-400',
    nextTier: null,
    pointsToNext: null
  }
};

export default function Profile() {
  const navigate = useNavigate();
  const { lineProfile, userProfile, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { healthData, saveHealth, isLoading: healthLoading } = useHealthData();
  const { profile, updateProfile } = useUserProfile();
  const { stats } = useWorkoutHistory();
  
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    nickname: "",
    weight: 70,
    height: 170,
    age: 25,
    gender: "male" as 'male' | 'female' | 'other',
    goal: "Stay Fit",
    activityLevel: "moderate" as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
  });

  useEffect(() => {
    if (userProfile) {
      setUserData(prev => ({
        ...prev,
        nickname: userProfile.nickname || userProfile.displayName || "",
      }));
    }
    if (healthData) {
      setUserData(prev => ({
        ...prev,
        weight: healthData.weight || 70,
        height: healthData.height || 170,
        age: healthData.age || 25,
        gender: healthData.gender || "male",
        activityLevel: healthData.activityLevel || "moderate",
      }));
    }
  }, [userProfile, healthData]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSaveChanges = async () => {
    await saveHealth({
      weight: userData.weight,
      height: userData.height,
      age: userData.age,
      gender: userData.gender,
      activityLevel: userData.activityLevel,
      healthGoals: [userData.goal],
    });
    
    if (userData.nickname !== userProfile?.nickname) {
      await updateProfile({ nickname: userData.nickname });
    }
    
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const bmi = userData.weight && userData.height 
    ? (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1) 
    : "0";

  const userTier = (userProfile?.tier || "silver") as keyof typeof tierConfig;
  const tier = tierConfig[userTier];
  const TierIcon = tier.icon;
  const SecondaryIcon = tier.secondaryIcon;
  const userPoints = userProfile?.points || 0;
  const streakDays = userProfile?.streakDays || 0;
  
  // Theme
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Calculate progress to next tier
  const progressToNext = tier.pointsToNext 
    ? Math.min((userPoints / tier.pointsToNext) * 100, 100) 
    : 100;

  if (authLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDark ? "bg-black" : "bg-gray-50"
      )}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen relative overflow-x-hidden pb-32",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Animated Background - Dark Theme Only */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/3 -left-40 w-60 h-60 bg-purple-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="px-5 pt-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/dashboard"
              className={cn(
                "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors",
                isDark 
                  ? "bg-white/10 hover:bg-white/20" 
                  : "bg-white border border-gray-200 shadow-sm hover:bg-gray-100"
              )}
            >
              <ArrowLeft className={cn("w-5 h-5", isDark ? "" : "text-gray-700")} />
            </Link>
            <h1 className="text-lg font-bold">โปรไฟล์</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-all",
                isEditing 
                  ? "bg-primary text-white" 
                  : isDark 
                    ? "bg-white/10 hover:bg-white/20" 
                    : "bg-white border border-gray-200 shadow-sm hover:bg-gray-100"
              )}
            >
              <Edit2 className={cn("w-5 h-5", !isEditing && !isDark ? "text-gray-700" : "")} />
            </button>
          </div>
        </div>

        {/* EPIC Tier Banner */}
        <div className="px-5 mb-6">
          <div className={cn(
            "relative rounded-3xl overflow-hidden",
            tier.glow,
            "shadow-2xl"
          )}>
            {/* Background Image */}
            <img 
              src={tier.image}
              alt={tier.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-90",
              tier.color
            )} />
            
            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute w-1 h-1 rounded-full animate-pulse",
                    tier.particles
                  )}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
            
            {/* Content */}
            <div className="relative p-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  {lineProfile?.pictureUrl ? (
                    <img 
                      src={lineProfile.pictureUrl} 
                      alt={userData.nickname}
                      className={cn(
                        "w-20 h-20 rounded-2xl object-cover ring-4",
                        tier.borderColor,
                        "ring-white/30"
                      )}
                    />
                  ) : (
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold",
                      "bg-white/20 backdrop-blur"
                    )}>
                      {userData.nickname?.charAt(0) || "?"}
                    </div>
                  )}
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <Camera className="w-4 h-4 text-gray-800" />
                  </button>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {userData.nickname || lineProfile?.displayName || "User"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-white" />
                    <span className="text-white/90 text-sm">{streakDays} Day Streak</span>
                  </div>
                </div>
              </div>
              
              {/* Tier Display */}
              <div className={cn(
                "bg-white/10 backdrop-blur-sm rounded-2xl p-4 border",
                tier.borderColor
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                      <TierIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-white">{tier.name}</span>
                        <Sparkles className="w-5 h-5 text-white/80" />
                      </div>
                      <p className="text-white/70 text-sm">{tier.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{userPoints.toLocaleString()}</p>
                    <p className="text-white/70 text-xs">POINTS</p>
                  </div>
                </div>
                
                {/* Progress to next tier */}
                {tier.nextTier && (
                  <div>
                    <div className="flex justify-between text-xs text-white/70 mb-2">
                      <span>{tier.name}</span>
                      <span>{tierConfig[tier.nextTier as keyof typeof tierConfig].name}</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${progressToNext}%` }}
                      />
                    </div>
                    <p className="text-center text-xs text-white/60 mt-2">
                      {(tier.pointsToNext! - userPoints).toLocaleString()} points to next tier
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* All Tiers Preview */}
        <div className="px-5 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            ระดับทั้งหมด
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {Object.entries(tierConfig).map(([key, tierInfo]) => {
              const isCurrentTier = key === userTier;
              const TIcon = tierInfo.icon;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex-shrink-0 w-24 p-3 rounded-xl border-2 transition-all",
                    isCurrentTier 
                      ? `bg-gradient-to-br ${tierInfo.color} border-white/50 scale-105` 
                      : isDark 
                        ? "bg-white/5 border-white/10 opacity-60"
                        : "bg-white border-gray-200 opacity-60"
                  )}
                >
                  <div className="flex flex-col items-center text-center">
                    <TIcon className={cn(
                      "w-8 h-8 mb-2",
                      isCurrentTier ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
                    )} />
                    <span className={cn(
                      "text-xs font-bold",
                      isCurrentTier ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
                    )}>
                      {tierInfo.name}
                    </span>
                    {isCurrentTier && (
                      <span className="text-[10px] text-white/70 mt-1">ปัจจุบัน</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="px-5 space-y-4">
          {/* Quick Stats */}
          <div className={cn(
            "backdrop-blur border rounded-2xl p-4",
            isDark 
              ? "bg-white/5 border-white/10" 
              : "bg-white border-gray-200 shadow-sm"
          )}>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center mb-2">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <p className="text-lg font-bold">{userData.weight}</p>
                <p className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>น้ำหนัก (kg)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-2">
                  <Ruler className="w-6 h-6 text-white" />
                </div>
                <p className="text-lg font-bold">{userData.height}</p>
                <p className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>ส่วนสูง (cm)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-2">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <p className="text-lg font-bold">{userData.age}</p>
                <p className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>อายุ (ปี)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <p className="text-lg font-bold">{bmi}</p>
                <p className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>BMI</p>
              </div>
            </div>
          </div>

          {/* Workout Stats */}
          {stats && (
            <div className={cn(
              "backdrop-blur border rounded-2xl p-5",
              isDark 
                ? "bg-white/5 border-white/10" 
                : "bg-white border-gray-200 shadow-sm"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-bold">สถิติการออกกำลังกาย</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Workouts</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{stats.totalWorkouts}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-green-400" />
                    <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Calories</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{stats.totalCalories.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-blue-400" />
                    <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Minutes</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{Math.round(stats.totalDuration / 60)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Accuracy</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">{stats.averageAccuracy}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Goals */}
          <div className={cn(
            "backdrop-blur border rounded-2xl p-5",
            isDark 
              ? "bg-white/5 border-white/10" 
              : "bg-white border-gray-200 shadow-sm"
          )}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-bold">เป้าหมายของคุณ</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {goals.map((goal) => {
                const IconComponent = goal.icon;
                const isSelected = userData.goal === goal.label;
                return (
                  <button
                    key={goal.label}
                    onClick={() => setUserData({ ...userData, goal: goal.label })}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                      isSelected
                        ? `border-primary bg-gradient-to-br ${goal.color} bg-opacity-20`
                        : isDark 
                          ? "border-white/10 hover:border-white/30 bg-white/5"
                          : "border-gray-200 hover:border-gray-300 bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isSelected 
                        ? `bg-gradient-to-br ${goal.color}` 
                        : isDark ? "bg-white/10" : "bg-gray-200"
                    )}>
                      <IconComponent className={cn("w-5 h-5", isSelected ? "text-white" : isDark ? "text-gray-400" : "text-gray-500")} />
                    </div>
                    <span className={cn(
                      "text-xs font-medium text-center",
                      isSelected ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
                    )}>{goal.labelTh}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" />
                แก้ไขข้อมูล
              </h3>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">ชื่อเล่น</label>
                <Input
                  type="text"
                  value={userData.nickname}
                  onChange={(e) => setUserData({ ...userData, nickname: e.target.value })}
                  className="h-12 rounded-xl bg-white/5 border-white/20 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">น้ำหนัก (kg)</label>
                  <Input
                    type="number"
                    value={userData.weight}
                    onChange={(e) => setUserData({ ...userData, weight: Number(e.target.value) })}
                    className="h-12 rounded-xl bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">ส่วนสูง (cm)</label>
                  <Input
                    type="number"
                    value={userData.height}
                    onChange={(e) => setUserData({ ...userData, height: Number(e.target.value) })}
                    className="h-12 rounded-xl bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">อายุ</label>
                  <Input
                    type="number"
                    value={userData.age}
                    onChange={(e) => setUserData({ ...userData, age: Number(e.target.value) })}
                    className="h-12 rounded-xl bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">เพศ</label>
                  <select
                    value={userData.gender}
                    onChange={(e) => setUserData({ ...userData, gender: e.target.value as 'male' | 'female' | 'other' })}
                    className="w-full h-12 rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-white"
                  >
                    <option value="male" className="bg-gray-900">ชาย</option>
                    <option value="female" className="bg-gray-900">หญิง</option>
                    <option value="other" className="bg-gray-900">อื่นๆ</option>
                  </select>
                </div>
              </div>
              <Button 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:opacity-90" 
                onClick={handleSaveChanges}
                disabled={healthLoading}
              >
                {healthLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                บันทึกการเปลี่ยนแปลง
              </Button>
            </div>
          )}

          {/* Menu Items */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
            <Link 
              to="/settings" 
              className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-gray-400" />
                </div>
                <span className="font-medium">ตั้งค่า</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </Link>
            <div className="h-px bg-white/10 mx-4" />
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <span className="font-medium text-red-400">ออกจากระบบ</span>
              </div>
            </button>
          </div>

          {/* App Version */}
          <p className="text-center text-xs text-gray-600 py-4">
            KAYA v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
