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
  Gem,
  Share2,
  User,
  Shield,
  Bell,
  HelpCircle,
  FileText,
  Lock,
  Palette,
  Globe,
  CreditCard
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthData, useUserProfile, useWorkoutHistory, useDailyStats } from "@/hooks/useFirestore";
import { useTheme } from "@/contexts/ThemeContext";
import liff from "@line/liff";

const goals = [
  { label: "Lose Weight", labelTh: "ลดน้ำหนัก", icon: TrendingDown, color: 'from-green-500 to-emerald-500' },
  { label: "Build Muscle", labelTh: "สร้างกล้ามเนื้อ", icon: Dumbbell, color: 'from-purple-500 to-pink-500' },
  { label: "Stay Fit", labelTh: "ฟิตแอนด์เฟิร์ม", icon: Target, color: 'from-blue-500 to-cyan-500' },
  { label: "Improve Endurance", labelTh: "เพิ่มความทนทาน", icon: Activity, color: 'from-orange-500 to-red-500' },
];

// Epic Tier Configurations
// Bronze: 0-999, Silver: 1000-1999, Gold: 2000-2999, Platinum: 3000-3999, Diamond: 4000+
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
    pointsToNext: 1000,
    minPoints: 0,
    maxPoints: 999
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
    pointsToNext: 2000,
    minPoints: 1000,
    maxPoints: 1999
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
    pointsToNext: 3000,
    minPoints: 2000,
    maxPoints: 2999
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
    pointsToNext: 4000,
    minPoints: 3000,
    maxPoints: 3999
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
    pointsToNext: null,
    minPoints: 4000,
    maxPoints: null
  }
};

export default function Profile() {
  const navigate = useNavigate();
  const { lineProfile, userProfile, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { healthData, saveHealth, isLoading: healthLoading } = useHealthData();
  const { profile, updateProfile } = useUserProfile();
  const { stats } = useWorkoutHistory();
  const { todayStats, cumulativeStats } = useDailyStats();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'stats' | 'goals' | 'settings'>('profile');
  const [userData, setUserData] = useState({
    nickname: "",
    weight: 70,
    height: 170,
    age: 25,
    gender: "male" as 'male' | 'female' | 'other',
    goal: "Stay Fit",
    activityLevel: "moderate" as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
  });
  
  // Format workout time as hh:mm:ss
  const formatWorkoutTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  // Share profile to LINE using Flex Message
  const handleShareProfile = async () => {
    if (!liff.isApiAvailable('shareTargetPicker')) {
      alert('การแชร์ไม่พร้อมใช้งาน กรุณาเปิดใน LINE App');
      return;
    }

    const profileName = userData.nickname || lineProfile?.displayName || "KAYA User";
    const profilePic = lineProfile?.pictureUrl || "https://kaya-fitness.vercel.app/icon-512.png";
    const appUrl = "https://miniapp.line.me/2008680520-UNJtwcRg";
    
    // Create Flex Message - simplified for compatibility
    const flexMessage: any = {
      type: "flex",
      altText: `🔥 ${profileName} ชวนคุณมาออกกำลังกายกับ KAYA!`,
      contents: {
        type: "bubble",
        size: "mega",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            // Profile Image Circle
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "image",
                  url: profilePic,
                  size: "full",
                  aspectMode: "cover"
                }
              ],
              width: "100px",
              height: "100px",
              cornerRadius: "50px",
              borderWidth: "3px",
              borderColor: "#dd6e53",
              offsetStart: "0px",
              offsetEnd: "0px",
              alignItems: "center"
            },
            // Name
            {
              type: "text",
              text: profileName,
              weight: "bold",
              size: "xl",
              align: "center",
              margin: "lg",
              color: "#ffffff"
            },
            // Tier Badge
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: `⭐ ${tier.name}`,
                      size: "sm",
                      color: "#ffffff",
                      weight: "bold",
                      align: "center"
                    }
                  ],
                  backgroundColor: "#dd6e53",
                  cornerRadius: "15px",
                  paddingAll: "8px",
                  paddingStart: "15px",
                  paddingEnd: "15px"
                }
              ],
              justifyContent: "center",
              margin: "md"
            },
            // Streak
            {
              type: "text",
              text: `🔥 ${streakDays} Day Streak`,
              size: "sm",
              color: "#aaaaaa",
              align: "center",
              margin: "sm"
            },
            // Separator
            {
              type: "separator",
              margin: "xl",
              color: "#333333"
            },
            // Stats Row
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: String(userPoints),
                      size: "lg",
                      weight: "bold",
                      color: "#dd6e53",
                      align: "center"
                    },
                    {
                      type: "text",
                      text: "Points",
                      size: "xxs",
                      color: "#888888",
                      align: "center"
                    }
                  ],
                  flex: 1
                },
                {
                  type: "separator",
                  color: "#444444"
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: String(cumulativeStats?.totalWorkouts || 0),
                      size: "lg",
                      weight: "bold",
                      color: "#dd6e53",
                      align: "center"
                    },
                    {
                      type: "text",
                      text: "Workouts",
                      size: "xxs",
                      color: "#888888",
                      align: "center"
                    }
                  ],
                  flex: 1
                },
                {
                  type: "separator",
                  color: "#444444"
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: String(cumulativeStats?.totalCalories || 0),
                      size: "lg",
                      weight: "bold",
                      color: "#dd6e53",
                      align: "center"
                    },
                    {
                      type: "text",
                      text: "Calories",
                      size: "xxs",
                      color: "#888888",
                      align: "center"
                    }
                  ],
                  flex: 1
                }
              ],
              margin: "lg",
              paddingTop: "md",
              paddingBottom: "md"
            },
            // Invite Text
            {
              type: "text",
              text: "🏋️ มาออกกำลังกายด้วยกัน!",
              size: "md",
              color: "#ffffff",
              align: "center",
              margin: "lg",
              weight: "bold"
            },
            {
              type: "text",
              text: "AI-Powered Fitness App",
              size: "xs",
              color: "#888888",
              align: "center",
              margin: "sm"
            }
          ],
          backgroundColor: "#1a1a2e",
          paddingAll: "25px",
          alignItems: "center"
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "เข้าใช้งาน KAYA",
                uri: appUrl
              },
              style: "primary",
              color: "#dd6e53",
              height: "sm"
            }
          ],
          backgroundColor: "#1a1a2e",
          paddingAll: "15px",
          paddingTop: "0px"
        }
      }
    };

    try {
      const result = await liff.shareTargetPicker([flexMessage]);
      if (result) {
        console.log('Share success:', result);
      } else {
        console.log('Share was cancelled or closed');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      alert('เกิดข้อผิดพลาดในการแชร์: ' + (error as Error).message);
    }
  };

  const bmi = userData.weight && userData.height 
    ? (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1) 
    : "0";

  const userTier = (userProfile?.tier || "bronze") as keyof typeof tierConfig;
  const tier = tierConfig[userTier];
  const TierIcon = tier.icon;
  const SecondaryIcon = tier.secondaryIcon;
  const userPoints = userProfile?.points || 0;
  const streakDays = userProfile?.streakDays || 0;
  
  // Theme
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Calculate progress to next tier based on new thresholds
  // Bronze: 0-999, Silver: 1000-1999, Gold: 2000-2999, Platinum: 3000-3999, Diamond: 4000+
  const calculateProgressToNext = () => {
    if (!tier.pointsToNext) return 100; // Diamond has no next tier
    const pointsInCurrentTier = userPoints - tier.minPoints;
    const pointsNeededForNextTier = tier.pointsToNext - tier.minPoints;
    return Math.min((pointsInCurrentTier / pointsNeededForNextTier) * 100, 100);
  };
  const progressToNext = calculateProgressToNext();
  const pointsToNextTier = tier.pointsToNext ? tier.pointsToNext - userPoints : 0;

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

  // Sidebar menu items for desktop
  const sidebarMenuItems = [
    { id: 'profile', label: 'ข้อมูลส่วนตัว', icon: User },
    { id: 'stats', label: 'สถิติ', icon: Activity },
    { id: 'goals', label: 'เป้าหมาย', icon: Target },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings },
  ];

  // Desktop Layout - Account Settings Style
  const DesktopLayout = () => (
    <div className={cn(
      "min-h-screen flex",
      isDark ? "bg-[#0a0a0f] text-white" : "bg-slate-100 text-gray-900"
    )}>
        {/* Left Sidebar */}
        <aside className={cn(
          "w-72 flex-shrink-0 min-h-screen border-r flex flex-col sticky top-0",
          isDark ? "bg-[#12121a] border-white/10" : "bg-white border-gray-200"
        )}>
          {/* Profile Card */}
          <div className="p-6">
            <Link to="/dashboard" className={cn(
              "flex items-center gap-2 text-base mb-6 transition-colors",
              isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            )}>
              <ArrowLeft className="w-5 h-5" />
              <span>กลับหน้าหลัก</span>
            </Link>
            
            <div className={cn(
              "relative rounded-2xl overflow-hidden p-6",
              `bg-gradient-to-br ${tier.color}`
            )}>
              {/* Animated particles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={cn("absolute w-1.5 h-1.5 rounded-full animate-pulse", tier.particles)}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                    }}
                  />
                ))}
              </div>
              
              <div className="relative flex flex-col items-center">
                <div className="relative mb-4">
                  {lineProfile?.pictureUrl ? (
                    <img 
                      src={lineProfile.pictureUrl} 
                      alt={userData.nickname}
                      className="w-24 h-24 rounded-xl object-cover ring-4 ring-white/30"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-white/20 flex items-center justify-center text-4xl font-bold text-white">
                      {userData.nickname?.charAt(0) || "?"}
                    </div>
                  )}
                  <button className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4 text-gray-800" />
                  </button>
                </div>
                
                <h2 className="text-xl font-bold text-white mb-1">
                  {userData.nickname || lineProfile?.displayName || "User"}
                </h2>
                
                <div className="flex items-center gap-2 mb-4">
                  <TierIcon className="w-4 h-4 text-white" />
                  <span className="text-white/90 text-sm font-medium">{tier.name} {tier.subtitle}</span>
                </div>
                
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    <span>{streakDays} days</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4" />
                    <span>{userPoints.toLocaleString()} pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 px-4">
            <div className="space-y-2">
              {sidebarMenuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as typeof activeSection)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-base",
                      isActive 
                        ? "bg-primary text-white" 
                        : isDark 
                          ? "hover:bg-white/5 text-gray-400 hover:text-white" 
                          : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
          
          {/* Bottom Actions */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleShareProfile}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 text-base",
                isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-600"
              )}
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">แชร์โปรไฟล์</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-400 hover:bg-red-500/10 text-base"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">ออกจากระบบ</span>
            </button>
          </div>
        </aside>
      
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {activeSection === 'profile' && 'ข้อมูลส่วนตัว'}
                  {activeSection === 'stats' && 'สถิติการออกกำลังกาย'}
                  {activeSection === 'goals' && 'เป้าหมายของคุณ'}
                  {activeSection === 'settings' && 'ตั้งค่า'}
                </h1>
                <p className={cn("text-base", isDark ? "text-gray-500" : "text-gray-400")}>
                  {activeSection === 'profile' && 'จัดการข้อมูลส่วนตัวและข้อมูลสุขภาพของคุณ'}
                  {activeSection === 'stats' && 'ดูความก้าวหน้าและผลลัพธ์การออกกำลังกาย'}
                  {activeSection === 'goals' && 'ตั้งเป้าหมายและติดตามความสำเร็จ'}
                  {activeSection === 'settings' && 'ปรับแต่งการตั้งค่าแอพ'}
                </p>
              </div>
              {activeSection === 'profile' && (
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  size="default"
                  className={cn(
                    "gap-2",
                    isEditing ? "bg-primary" : isDark ? "bg-white/10 hover:bg-white/20" : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  )}
                >
                  <Edit2 className="w-4 h-4" />
                  {isEditing ? 'กำลังแก้ไข' : 'แก้ไขข้อมูล'}
                </Button>
              )}
            </div>
          
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                {/* Basic Info Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className={cn(
                    "p-6 rounded-2xl border",
                    isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
                  )}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center mb-4">
                      <Scale className="w-6 h-6 text-white" />
                    </div>
                    <p className={cn("text-sm mb-1", isDark ? "text-gray-500" : "text-gray-400")}>น้ำหนัก</p>
                    <p className="text-2xl font-bold">{userData.weight} <span className="text-sm font-normal text-gray-500">kg</span></p>
                  </div>
                  <div className={cn(
                    "p-6 rounded-2xl border",
                    isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
                  )}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                      <Ruler className="w-6 h-6 text-white" />
                    </div>
                    <p className={cn("text-sm mb-1", isDark ? "text-gray-500" : "text-gray-400")}>ส่วนสูง</p>
                    <p className="text-2xl font-bold">{userData.height} <span className="text-sm font-normal text-gray-500">cm</span></p>
                  </div>
                  <div className={cn(
                    "p-6 rounded-2xl border",
                    isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
                  )}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <p className={cn("text-sm mb-1", isDark ? "text-gray-500" : "text-gray-400")}>อายุ</p>
                    <p className="text-2xl font-bold">{userData.age} <span className="text-sm font-normal text-gray-500">ปี</span></p>
                  </div>
                  <div className={cn(
                    "p-6 rounded-2xl border",
                    isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
                  )}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <p className={cn("text-sm mb-1", isDark ? "text-gray-500" : "text-gray-400")}>BMI</p>
                    <p className="text-2xl font-bold">{bmi}</p>
                  </div>
                </div>
              
                {/* Edit Form */}
                {isEditing && (
                  <div className={cn(
                    "p-6 rounded-2xl border animate-in fade-in slide-in-from-top-4",
                    isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
                  )}>
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <Edit2 className="w-5 h-5 text-primary" />
                      แก้ไขข้อมูล
                    </h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className={cn("text-sm mb-2 block font-medium", isDark ? "text-gray-400" : "text-gray-500")}>ชื่อเล่น</label>
                        <Input
                          type="text"
                          value={userData.nickname}
                          onChange={(e) => setUserData({ ...userData, nickname: e.target.value })}
                          className={cn(
                            "h-12 rounded-xl text-base",
                            isDark ? "bg-white/5 border-white/20 text-white" : "bg-gray-50 border-gray-200"
                          )}
                        />
                    </div>
                    <div>
                      <label className={cn("text-sm mb-2 block font-medium", isDark ? "text-gray-400" : "text-gray-500")}>เพศ</label>
                      <select
                        value={userData.gender}
                        onChange={(e) => setUserData({ ...userData, gender: e.target.value as 'male' | 'female' | 'other' })}
                        className={cn(
                          "w-full h-12 rounded-xl border px-4 text-base",
                          isDark ? "border-white/20 bg-white/5 text-white" : "border-gray-200 bg-gray-50"
                        )}
                      >
                        <option value="male" className={isDark ? "bg-gray-900" : ""}>ชาย</option>
                        <option value="female" className={isDark ? "bg-gray-900" : ""}>หญิง</option>
                        <option value="other" className={isDark ? "bg-gray-900" : ""}>อื่นๆ</option>
                      </select>
                    </div>
                    <div>
                      <label className={cn("text-sm mb-2 block font-medium", isDark ? "text-gray-400" : "text-gray-500")}>น้ำหนัก (kg)</label>
                      <Input
                        type="number"
                        value={userData.weight}
                        onChange={(e) => setUserData({ ...userData, weight: Number(e.target.value) })}
                        className={cn(
                          "h-12 rounded-xl text-base",
                          isDark ? "bg-white/5 border-white/20 text-white" : "bg-gray-50 border-gray-200"
                        )}
                      />
                    </div>
                    <div>
                      <label className={cn("text-sm mb-2 block font-medium", isDark ? "text-gray-400" : "text-gray-500")}>ส่วนสูง (cm)</label>
                      <Input
                        type="number"
                        value={userData.height}
                        onChange={(e) => setUserData({ ...userData, height: Number(e.target.value) })}
                        className={cn(
                          "h-12 rounded-xl text-base",
                          isDark ? "bg-white/5 border-white/20 text-white" : "bg-gray-50 border-gray-200"
                        )}
                      />
                    </div>
                    <div>
                      <label className={cn("text-sm mb-2 block font-medium", isDark ? "text-gray-400" : "text-gray-500")}>อายุ</label>
                      <Input
                        type="number"
                        value={userData.age}
                        onChange={(e) => setUserData({ ...userData, age: Number(e.target.value) })}
                        className={cn(
                          "h-12 rounded-xl text-base",
                          isDark ? "bg-white/5 border-white/20 text-white" : "bg-gray-50 border-gray-200"
                        )}
                      />
                    </div>
                  </div>
                  <Button 
                    className="mt-6 h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 text-base" 
                    onClick={handleSaveChanges}
                    disabled={healthLoading}
                  >
                    {healthLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    บันทึกการเปลี่ยนแปลง
                  </Button>
                </div>
              )}
              
              {/* Tier Progress Card */}
              <div className={cn(
                "p-6 rounded-2xl border",
                isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
              )}>
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  ระดับสมาชิก
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-3">
                  {Object.entries(tierConfig).map(([key, tierInfo]) => {
                    const isCurrentTier = key === userTier;
                    const TIcon = tierInfo.icon;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex-shrink-0 w-28 p-4 rounded-xl border-2 transition-all",
                          isCurrentTier 
                            ? `bg-gradient-to-br ${tierInfo.color} border-white/50 scale-105` 
                            : isDark 
                              ? "bg-white/5 border-white/10 opacity-50"
                              : "bg-gray-50 border-gray-200 opacity-50"
                        )}
                      >
                        <div className="flex flex-col items-center text-center">
                          <TIcon className={cn(
                            "w-10 h-10 mb-2",
                            isCurrentTier ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
                          )} />
                          <span className={cn(
                            "text-sm font-bold",
                            isCurrentTier ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
                          )}>
                            {tierInfo.name}
                          </span>
                          {isCurrentTier && (
                            <span className="text-xs text-white/70 mt-1">ปัจจุบัน</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {tier.nextTier && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className={isDark ? "text-gray-400" : "text-gray-500"}>{tier.name}</span>
                      <span className={isDark ? "text-gray-400" : "text-gray-500"}>{tierConfig[tier.nextTier as keyof typeof tierConfig].name}</span>
                    </div>
                    <div className={cn("h-3 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500 bg-gradient-to-r", tier.color)}
                        style={{ width: `${progressToNext}%` }}
                      />
                    </div>
                    <p className={cn("text-center text-sm mt-2", isDark ? "text-gray-500" : "text-gray-400")}>
                      อีก {pointsToNextTier.toLocaleString()} แต้มจะถึงระดับถัดไป
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
            {/* Stats Section */}
            {activeSection === 'stats' && (
              <div className="space-y-6">
                {/* Main Stats - Using cumulativeStats from dailyStats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className={cn(
                    "p-6 rounded-2xl border bg-gradient-to-br from-primary/20 to-orange-500/10",
                    isDark ? "border-primary/30" : "border-primary/20"
                  )}>
                    <Dumbbell className="w-8 h-8 text-primary mb-4" />
                    <p className="text-3xl font-bold text-primary">{cumulativeStats?.totalWorkouts || 0}</p>
                    <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Workouts</p>
                  </div>
                  <div className={cn(
                    "p-6 rounded-2xl border bg-gradient-to-br from-green-500/20 to-emerald-500/10",
                    isDark ? "border-green-500/30" : "border-green-500/20"
                  )}>
                    <Flame className="w-8 h-8 text-green-400 mb-4" />
                    <p className="text-3xl font-bold text-green-400">{(cumulativeStats?.totalCalories || 0).toLocaleString()}</p>
                    <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Calories Burned</p>
                  </div>
                  <div className={cn(
                    "p-6 rounded-2xl border bg-gradient-to-br from-blue-500/20 to-cyan-500/10",
                    isDark ? "border-blue-500/30" : "border-blue-500/20"
                  )}>
                    <Timer className="w-8 h-8 text-blue-400 mb-4" />
                    <p className="text-2xl font-bold text-blue-400 font-mono">{formatWorkoutTime(cumulativeStats?.totalWorkoutTime || 0)}</p>
                    <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Total Time</p>
                  </div>
                  <div className={cn(
                    "p-6 rounded-2xl border bg-gradient-to-br from-purple-500/20 to-pink-500/10",
                    isDark ? "border-purple-500/30" : "border-purple-500/20"
                  )}>
                    <Zap className="w-8 h-8 text-purple-400 mb-4" />
                    <p className="text-3xl font-bold text-purple-400">{userPoints.toLocaleString()}</p>
                    <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>Total Points</p>
                  </div>
                </div>
              
                {/* Streak Card */}
                <div className={cn(
                  "p-6 rounded-2xl border",
                  isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-2">🔥 Current Streak</h3>
                      <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                        ติดต่อกันออกกำลังกายมาแล้ว
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-black text-primary">{streakDays}</p>
                      <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>วัน</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          
            {/* Goals Section */}
            {activeSection === 'goals' && (
              <div className="space-y-6">
                <div className={cn(
                  "p-6 rounded-2xl border",
                  isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
                )}>
                  <h3 className="font-bold text-lg mb-6">เลือกเป้าหมายของคุณ</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {goals.map((goal) => {
                      const IconComponent = goal.icon;
                      const isSelected = userData.goal === goal.label;
                      return (
                        <button
                          key={goal.label}
                          onClick={() => setUserData({ ...userData, goal: goal.label })}
                          className={cn(
                            "p-5 rounded-xl border-2 transition-all flex items-center gap-4 text-left",
                            isSelected
                              ? `border-primary bg-gradient-to-br ${goal.color} bg-opacity-20`
                              : isDark 
                                ? "border-white/10 hover:border-white/30 bg-white/5"
                                : "border-gray-200 hover:border-gray-300 bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                            isSelected 
                              ? `bg-gradient-to-br ${goal.color}` 
                              : isDark ? "bg-white/10" : "bg-gray-200"
                          )}>
                            <IconComponent className={cn("w-6 h-6", isSelected ? "text-white" : isDark ? "text-gray-400" : "text-gray-500")} />
                          </div>
                          <div>
                            <p className={cn(
                              "font-bold text-base",
                              isSelected ? "text-white" : ""
                            )}>{goal.labelTh}</p>
                            <p className={cn(
                              "text-sm",
                              isSelected ? "text-white/70" : isDark ? "text-gray-500" : "text-gray-400"
                            )}>{goal.label}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          
            {/* Settings Section */}
            {activeSection === 'settings' && (
              <div className="space-y-4">
                {[
                  { icon: Bell, label: 'การแจ้งเตือน', desc: 'ตั้งค่าการแจ้งเตือนแอพ' },
                  { icon: Palette, label: 'ธีม', desc: 'เปลี่ยนธีมแอพ' },
                  { icon: Globe, label: 'ภาษา', desc: 'เปลี่ยนภาษาแอพ' },
                  { icon: Lock, label: 'ความเป็นส่วนตัว', desc: 'จัดการความเป็นส่วนตัว' },
                  { icon: HelpCircle, label: 'ช่วยเหลือ', desc: 'คำถามที่พบบ่อย' },
                  { icon: FileText, label: 'เงื่อนไขการใช้งาน', desc: 'อ่านเงื่อนไขการใช้งาน' },
                ].map((item, index) => (
                  <Link
                    key={index}
                    to="/settings"
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border transition-all",
                      isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        isDark ? "bg-white/10" : "bg-gray-100"
                      )}>
                        <item.icon className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
                      </div>
                      <div>
                        <p className="font-medium text-base">{item.label}</p>
                        <p className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-400")}>{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className={cn("w-5 h-5", isDark ? "text-gray-500" : "text-gray-400")} />
                  </Link>
                ))}
              </div>
            )}
          
            {/* App Version */}
            <p className={cn("text-center text-sm py-8", isDark ? "text-gray-600" : "text-gray-400")}>
              KAYA v1.0.0
            </p>
          </div>
        </main>
    </div>
  );

  // Mobile Layout (Original)
  const MobileLayout = () => (
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

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="px-5 lg:px-8 pt-8 pb-4">
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
        <div className="px-5 lg:px-8 mb-6">
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
            <div className="relative p-6 lg:p-8">
              {/* Share Button - Top Right */}
              <button
                onClick={handleShareProfile}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 z-10"
                title="แชร์โปรไฟล์ไปยัง LINE"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
              
              {/* Profile Section - Desktop Layout */}
              <div className="hidden lg:flex lg:items-center lg:gap-8">
                <div className="relative">
                  {lineProfile?.pictureUrl ? (
                    <img 
                      src={lineProfile.pictureUrl} 
                      alt={userData.nickname}
                      className={cn(
                        "w-28 h-28 rounded-2xl object-cover ring-4",
                        tier.borderColor,
                        "ring-white/30"
                      )}
                    />
                  ) : (
                    <div className={cn(
                      "w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-bold",
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
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {userData.nickname || lineProfile?.displayName || "User"}
                  </h2>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-white" />
                      <span className="text-white/90">{streakDays} Day Streak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TierIcon className="w-5 h-5 text-white" />
                      <span className="text-white font-bold">{tier.name} {tier.subtitle}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{userPoints.toLocaleString()}</p>
                      <p className="text-white/70 text-sm">POINTS</p>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{cumulativeStats?.totalWorkouts || 0}</p>
                      <p className="text-white/70 text-sm">WORKOUTS</p>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{(cumulativeStats?.totalCalories || 0).toLocaleString()}</p>
                      <p className="text-white/70 text-sm">CALORIES</p>
                    </div>
                  </div>
                </div>
                
                {/* Progress to next tier - Desktop */}
                {tier.nextTier && (
                  <div className={cn(
                    "w-64 bg-white/10 backdrop-blur-sm rounded-xl p-4 border",
                    tier.borderColor
                  )}>
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

              {/* Profile Section - Mobile Layout */}
              <div className="lg:hidden">
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
              
              {/* Tier Display - Mobile */}
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
        </div>

        {/* All Tiers Preview */}
        <div className="px-5 lg:px-8 mb-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            ระดับทั้งหมด
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 lg:-mx-8 px-5 lg:px-8 scrollbar-hide lg:overflow-x-visible lg:flex-wrap">
            {Object.entries(tierConfig).map(([key, tierInfo]) => {
              const isCurrentTier = key === userTier;
              const TIcon = tierInfo.icon;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex-shrink-0 w-24 lg:w-32 p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 transition-all",
                    isCurrentTier 
                      ? `bg-gradient-to-br ${tierInfo.color} border-white/50 scale-105` 
                      : isDark 
                        ? "bg-white/5 border-white/10 opacity-60 hover:opacity-80"
                        : "bg-white border-gray-200 opacity-60 hover:opacity-80"
                  )}
                >
                  <div className="flex flex-col items-center text-center">
                    <TIcon className={cn(
                      "w-8 h-8 lg:w-10 lg:h-10 mb-2",
                      isCurrentTier ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
                    )} />
                    <span className={cn(
                      "text-xs lg:text-sm font-bold",
                      isCurrentTier ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
                    )}>
                      {tierInfo.name}
                    </span>
                    {isCurrentTier && (
                      <span className="text-[10px] lg:text-xs text-white/70 mt-1">ปัจจุบัน</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Section - Desktop Two Column Layout */}
        <div className="px-5 lg:px-8 space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          {/* Quick Stats */}
          <div className={cn(
            "backdrop-blur border rounded-2xl lg:rounded-3xl p-4 lg:p-6",
            isDark 
              ? "bg-white/5 border-white/10" 
              : "bg-white border-gray-200 shadow-sm"
          )}>
            <div className="grid grid-cols-4 gap-3 lg:gap-4">
              <div className="text-center">
                <div className="w-12 h-12 lg:w-14 lg:h-14 mx-auto rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center mb-2">
                  <Scale className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <p className="text-lg lg:text-xl font-bold">{userData.weight}</p>
                <p className={cn("text-[10px] lg:text-xs", isDark ? "text-gray-500" : "text-gray-400")}>น้ำหนัก (kg)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 lg:w-14 lg:h-14 mx-auto rounded-xl lg:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-2">
                  <Ruler className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <p className="text-lg lg:text-xl font-bold">{userData.height}</p>
                <p className={cn("text-[10px] lg:text-xs", isDark ? "text-gray-500" : "text-gray-400")}>ส่วนสูง (cm)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 lg:w-14 lg:h-14 mx-auto rounded-xl lg:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-2">
                  <Calendar className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <p className="text-lg lg:text-xl font-bold">{userData.age}</p>
                <p className={cn("text-[10px] lg:text-xs", isDark ? "text-gray-500" : "text-gray-400")}>อายุ (ปี)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 lg:w-14 lg:h-14 mx-auto rounded-xl lg:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2">
                  <Heart className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <p className="text-lg lg:text-xl font-bold">{bmi}</p>
                <p className={cn("text-[10px] lg:text-xs", isDark ? "text-gray-500" : "text-gray-400")}>BMI</p>
              </div>
            </div>
          </div>

          {/* Workout Stats */}
          {stats && (
            <div className={cn(
              "backdrop-blur border rounded-2xl lg:rounded-3xl p-5 lg:p-6",
              isDark 
                ? "bg-white/5 border-white/10" 
                : "bg-white border-gray-200 shadow-sm"
            )}>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-bold">สถิติการออกกำลังกาย</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-xl lg:rounded-2xl p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Workouts</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-primary">{stats.totalWorkouts}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl lg:rounded-2xl p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-green-400" />
                    <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Calories</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-green-400">{stats.totalCalories.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl lg:rounded-2xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-blue-400" />
                    <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Minutes</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-400">{Math.round(stats.totalDuration / 60)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl lg:rounded-2xl p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Accuracy</span>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-purple-400">{stats.averageAccuracy}%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Goals & Edit Section */}
        <div className="px-5 lg:px-8 mt-4 lg:mt-6 space-y-4">
          {/* Goals */}
          <div className={cn(
            "backdrop-blur border rounded-2xl lg:rounded-3xl p-5 lg:p-6",
            isDark 
              ? "bg-white/5 border-white/10" 
              : "bg-white border-gray-200 shadow-sm"
          )}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-bold">เป้าหมายของคุณ</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {goals.map((goal) => {
                const IconComponent = goal.icon;
                const isSelected = userData.goal === goal.label;
                return (
                  <button
                    key={goal.label}
                    onClick={() => setUserData({ ...userData, goal: goal.label })}
                    className={cn(
                      "p-4 lg:p-5 rounded-xl lg:rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                      isSelected
                        ? `border-primary bg-gradient-to-br ${goal.color} bg-opacity-20`
                        : isDark 
                          ? "border-white/10 hover:border-white/30 bg-white/5"
                          : "border-gray-200 hover:border-gray-300 bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center",
                      isSelected 
                        ? `bg-gradient-to-br ${goal.color}` 
                        : isDark ? "bg-white/10" : "bg-gray-200"
                    )}>
                      <IconComponent className={cn("w-5 h-5 lg:w-6 lg:h-6", isSelected ? "text-white" : isDark ? "text-gray-400" : "text-gray-500")} />
                    </div>
                    <span className={cn(
                      "text-xs lg:text-sm font-medium text-center",
                      isSelected ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
                    )}>{goal.labelTh}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className={cn(
              "backdrop-blur border rounded-2xl lg:rounded-3xl p-5 lg:p-6 space-y-4 animate-in fade-in slide-in-from-top-4",
              isDark 
                ? "bg-white/5 border-white/10" 
                : "bg-white border-gray-200 shadow-sm"
            )}>
              <h3 className="font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" />
                แก้ไขข้อมูล
              </h3>
              <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
                <div>
                  <label className={cn("text-sm mb-2 block", isDark ? "text-gray-400" : "text-gray-500")}>ชื่อเล่น</label>
                  <Input
                    type="text"
                    value={userData.nickname}
                    onChange={(e) => setUserData({ ...userData, nickname: e.target.value })}
                    className={cn(
                      "h-12 rounded-xl",
                      isDark 
                        ? "bg-white/5 border-white/20 text-white" 
                        : "bg-gray-50 border-gray-200"
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cn("text-sm mb-2 block", isDark ? "text-gray-400" : "text-gray-500")}>น้ำหนัก (kg)</label>
                  <Input
                    type="number"
                    value={userData.weight}
                    onChange={(e) => setUserData({ ...userData, weight: Number(e.target.value) })}
                    className={cn(
                      "h-12 rounded-xl",
                      isDark 
                        ? "bg-white/5 border-white/20 text-white" 
                        : "bg-gray-50 border-gray-200"
                    )}
                  />
                </div>
                <div>
                  <label className={cn("text-sm mb-2 block", isDark ? "text-gray-400" : "text-gray-500")}>ส่วนสูง (cm)</label>
                  <Input
                    type="number"
                    value={userData.height}
                    onChange={(e) => setUserData({ ...userData, height: Number(e.target.value) })}
                    className={cn(
                      "h-12 rounded-xl",
                      isDark 
                        ? "bg-white/5 border-white/20 text-white" 
                        : "bg-gray-50 border-gray-200"
                    )}
                  />
                </div>
              </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={cn("text-sm mb-2 block", isDark ? "text-gray-400" : "text-gray-500")}>อายุ</label>
                  <Input
                    type="number"
                    value={userData.age}
                    onChange={(e) => setUserData({ ...userData, age: Number(e.target.value) })}
                    className={cn(
                      "h-12 rounded-xl",
                      isDark 
                        ? "bg-white/5 border-white/20 text-white" 
                        : "bg-gray-50 border-gray-200"
                    )}
                  />
                </div>
                <div>
                  <label className={cn("text-sm mb-2 block", isDark ? "text-gray-400" : "text-gray-500")}>เพศ</label>
                  <select
                    value={userData.gender}
                    onChange={(e) => setUserData({ ...userData, gender: e.target.value as 'male' | 'female' | 'other' })}
                    className={cn(
                      "w-full h-12 rounded-xl border px-3 text-sm",
                      isDark 
                        ? "border-white/20 bg-white/5 text-white" 
                        : "border-gray-200 bg-gray-50"
                    )}
                  >
                    <option value="male" className={isDark ? "bg-gray-900" : ""}>ชาย</option>
                    <option value="female" className={isDark ? "bg-gray-900" : ""}>หญิง</option>
                    <option value="other" className={isDark ? "bg-gray-900" : ""}>อื่นๆ</option>
                  </select>
                </div>
              </div>
              <Button 
                className="w-full lg:w-auto h-12 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 lg:px-8" 
                onClick={handleSaveChanges}
                disabled={healthLoading}
              >
                {healthLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                บันทึกการเปลี่ยนแปลง
              </Button>
            </div>
          )}

          {/* Menu Items */}
          <div className={cn(
            "backdrop-blur border rounded-2xl lg:rounded-3xl overflow-hidden",
            isDark 
              ? "bg-white/5 border-white/10" 
              : "bg-white border-gray-200 shadow-sm"
          )}>
            <Link 
              to="/settings" 
              className={cn(
                "flex items-center justify-between p-4 lg:p-5 transition-colors",
                isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center",
                  isDark ? "bg-white/10" : "bg-gray-100"
                )}>
                  <Settings className={cn("w-5 h-5 lg:w-6 lg:h-6", isDark ? "text-gray-400" : "text-gray-500")} />
                </div>
                <span className="font-medium">ตั้งค่า</span>
              </div>
              <ChevronRight className={cn("w-5 h-5", isDark ? "text-gray-500" : "text-gray-400")} />
            </Link>
            <div className={cn("h-px mx-4", isDark ? "bg-white/10" : "bg-gray-200")} />
            <button 
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center justify-between p-4 lg:p-5 transition-colors",
                "hover:bg-red-500/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <LogOut className="w-5 h-5 lg:w-6 lg:h-6 text-red-400" />
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

  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}
