import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Dumbbell, 
  Utensils, 
  Gamepad2, 
  Brain, 
  User,
  Flame,
  Star,
  Crown,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getCalculatedStreak } from "@/lib/firestore";

const tierConfig = {
  bronze: { name: 'BRONZE', color: 'from-amber-700 to-amber-900', icon: Star },
  silver: { name: 'SILVER', color: 'from-gray-300 to-gray-500', icon: Star },
  gold: { name: 'GOLD', color: 'from-yellow-400 to-amber-600', icon: Crown },
  platinum: { name: 'PLATINUM', color: 'from-cyan-300 to-blue-500', icon: Crown },
  diamond: { name: 'DIAMOND', color: 'from-purple-400 via-pink-400 to-blue-400', icon: Crown }
};

const navItems = [
  { path: '/dashboard', icon: Home, label: 'หน้าหลัก' },
  { path: '/workout-selection', icon: Dumbbell, label: 'ออกกำลังกาย' },
  { path: '/nutrition', icon: Utensils, label: 'โภชนาการ' },
  { path: '/game-mode', icon: Gamepad2, label: 'เกม' },
  { path: '/ai-coach', icon: Brain, label: 'AI Coach' },
];

export function DesktopSidebar() {
  const location = useLocation();
  const { theme } = useTheme();
  const { lineProfile, userProfile } = useAuth();
  const isDark = theme === 'dark';
  
  const displayName = userProfile?.nickname || lineProfile?.displayName || "User";
  const userTier = (userProfile?.tier || "silver") as keyof typeof tierConfig;
  const streakDays = getCalculatedStreak(userProfile?.streakDays || 0, userProfile?.lastActivityDate);
  const userPoints = userProfile?.points || 0;
  const tier = tierConfig[userTier] || tierConfig.silver;
  const TierIcon = tier.icon;

  return (
    <aside className={cn(
      "w-72 flex-shrink-0 h-screen border-r flex flex-col fixed top-0 left-0 overflow-y-auto z-50",
      isDark ? "bg-[#18181f] border-white/20" : "bg-white border-gray-200"
    )}>
      {/* Logo & Brand */}
      <div className={cn(
        "p-6 border-b",
        isDark ? "border-white/10" : "border-gray-200"
      )}>
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">KAYA</h1>
            <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
              AI Fitness
            </p>
          </div>
        </Link>
      </div>

      {/* User Profile Mini */}
      <div className="p-4 border-b border-white/10">
        <Link 
          to="/profile"
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-all",
            isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
          )}
        >
          {lineProfile?.pictureUrl ? (
            <img 
              src={lineProfile.pictureUrl} 
              alt={displayName}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-xl font-bold text-white">
              {displayName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{displayName}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(
                "px-2 py-0.5 rounded-full bg-gradient-to-r font-medium text-white",
                tier.color
              )}>
                <TierIcon className="w-3 h-3 inline mr-1" />
                {tier.name}
              </span>
            </div>
          </div>
        </Link>
        
        {/* Quick Stats */}
        <div className="flex items-center justify-around mt-3 pt-3 border-t border-white/10">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-bold">{streakDays}</span>
            </div>
            <p className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>Streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-bold">{userPoints.toLocaleString()}</span>
            </div>
            <p className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>Points</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className={cn("text-xs font-medium px-3 mb-3", isDark ? "text-gray-500" : "text-gray-400")}>
          เมนูหลัก
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-base font-medium",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/25" 
                    : isDark 
                      ? "hover:bg-white/5 text-gray-400 hover:text-white" 
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                )}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-base font-medium",
            location.pathname === '/settings'
              ? "bg-primary text-white"
              : isDark 
                ? "hover:bg-white/5 text-gray-400 hover:text-white" 
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          )}
        >
          <Settings className="w-5 h-5" />
          <span>ตั้งค่า</span>
        </Link>
      </div>
    </aside>
  );
}
