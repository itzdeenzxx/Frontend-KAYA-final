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
  Zap
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthData, useUserProfile, useWorkoutHistory } from "@/hooks/useFirestore";

const goals = [
  { label: "Lose Weight", labelTh: "ลดน้ำหนัก", icon: TrendingDown },
  { label: "Build Muscle", labelTh: "สร้างกล้ามเนื้อ", icon: Dumbbell },
  { label: "Stay Fit", labelTh: "ฟิตแอนด์เฟิร์ม", icon: Target },
  { label: "Improve Endurance", labelTh: "เพิ่มความทนทาน", icon: Activity },
];

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

  // Update local state when data loads
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

  // Redirect if not authenticated
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

  // Calculate BMI
  const bmi = userData.weight && userData.height 
    ? (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1) 
    : "0";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-32">
      {/* Header */}
      <div className="gradient-coral px-5 pt-12 pb-24 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">โปรไฟล์</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-all active:scale-95",
              isEditing ? "bg-white text-primary" : "bg-white/20 text-white"
            )}
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center relative z-10"
        >
          <div className="relative">
            {lineProfile?.pictureUrl ? (
              <img 
                src={lineProfile.pictureUrl} 
                alt={userData.nickname}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white/30 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-3xl font-bold text-primary">
                {userData.nickname?.charAt(0) || "?"}
              </div>
            )}
            <button className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform">
              <Camera className="w-4 h-4 text-primary" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-white mt-4">
            {userData.nickname || lineProfile?.displayName || "User"}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white/90 text-sm font-medium">
              {userProfile?.tier?.toUpperCase() || "BRONZE"}
            </span>
            <span className="text-white/80 text-sm">
              {userProfile?.points?.toLocaleString() || 0} pts
            </span>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-12 relative z-10 space-y-4">
        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-4"
        >
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-coral-light flex items-center justify-center mb-2">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-bold">{userData.weight}</p>
              <p className="text-[10px] text-muted-foreground">น้ำหนัก (kg)</p>
            </div>
            <div className="text-center p-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-ocean/10 flex items-center justify-center mb-2">
                <Ruler className="w-5 h-5 text-ocean" />
              </div>
              <p className="text-lg font-bold">{userData.height}</p>
              <p className="text-[10px] text-muted-foreground">ส่วนสูง (cm)</p>
            </div>
            <div className="text-center p-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-nature/10 flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-nature" />
              </div>
              <p className="text-lg font-bold">{userData.age}</p>
              <p className="text-[10px] text-muted-foreground">อายุ (ปี)</p>
            </div>
            <div className="text-center p-2">
              <div className="w-10 h-10 mx-auto rounded-xl bg-secondary/10 flex items-center justify-center mb-2">
                <Heart className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-lg font-bold">{bmi}</p>
              <p className="text-[10px] text-muted-foreground">BMI</p>
            </div>
          </div>
        </motion.div>

        {/* Workout Stats */}
        {stats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">สถิติการออกกำลังกาย</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-coral-light to-coral-light/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Workouts</span>
                </div>
                <p className="text-2xl font-bold text-primary">{stats.totalWorkouts}</p>
              </div>
              <div className="bg-gradient-to-br from-nature/10 to-nature/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-nature" />
                  <span className="text-xs text-muted-foreground">Calories</span>
                </div>
                <p className="text-2xl font-bold text-nature">{stats.totalCalories.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-ocean/10 to-ocean/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="w-4 h-4 text-ocean" />
                  <span className="text-xs text-muted-foreground">Minutes</span>
                </div>
                <p className="text-2xl font-bold text-ocean">{Math.round(stats.totalDuration / 60)}</p>
              </div>
              <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Accuracy</span>
                </div>
                <p className="text-2xl font-bold text-secondary">{stats.averageAccuracy}%</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Goals */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">เป้าหมายของคุณ</h3>
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
                    "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 active:scale-[0.98]",
                    isSelected
                      ? "border-primary bg-coral-light"
                      : "border-border hover:border-primary/30 bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-center">{goal.labelTh}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Edit Form */}
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="bg-white rounded-2xl shadow-lg p-5 space-y-4"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-primary" />
              แก้ไขข้อมูล
            </h3>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">ชื่อเล่น</label>
              <Input
                type="text"
                value={userData.nickname}
                onChange={(e) => setUserData({ ...userData, nickname: e.target.value })}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">น้ำหนัก (kg)</label>
                <Input
                  type="number"
                  value={userData.weight}
                  onChange={(e) => setUserData({ ...userData, weight: Number(e.target.value) })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">ส่วนสูง (cm)</label>
                <Input
                  type="number"
                  value={userData.height}
                  onChange={(e) => setUserData({ ...userData, height: Number(e.target.value) })}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">อายุ</label>
                <Input
                  type="number"
                  value={userData.age}
                  onChange={(e) => setUserData({ ...userData, age: Number(e.target.value) })}
                  className="h-12 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">เพศ</label>
                <select
                  value={userData.gender}
                  onChange={(e) => setUserData({ ...userData, gender: e.target.value as 'male' | 'female' | 'other' })}
                  className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
            </div>
            <Button 
              variant="hero" 
              className="w-full h-12 rounded-xl" 
              onClick={handleSaveChanges}
              disabled={healthLoading}
            >
              {healthLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              บันทึกการเปลี่ยนแปลง
            </Button>
          </motion.div>
        )}

        {/* Menu Items */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <Link 
            to="/settings" 
            className="flex items-center justify-between p-4 active:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-medium">ตั้งค่า</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="h-px bg-border mx-4" />
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 active:bg-destructive/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <span className="font-medium text-destructive">ออกจากระบบ</span>
            </div>
          </button>
        </motion.div>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground py-4">
          KAYA v1.0.0
        </p>
      </div>
    </div>
  );
}