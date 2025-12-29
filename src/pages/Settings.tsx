import { useState } from "react";
import { ArrowLeft, Bell, Sun, Moon, ChevronRight, LogOut, Check, Palette } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const isDark = theme === 'dark';
  
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    mealReminders: false,
    progressUpdates: true,
    coachTips: true,
  });
  const [showThemePreview, setShowThemePreview] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>(theme);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleThemeSelect = async (newTheme: ThemeMode) => {
    setPreviewTheme(newTheme);
    await setTheme(newTheme);
    setShowThemePreview(false);
  };

  const themeOptions = [
    {
      id: 'dark' as ThemeMode,
      name: 'โหมดมืด',
      description: 'สวยงามลึกลับ ดูแพง',
      icon: Moon,
      previewBg: 'bg-black',
      previewCard: 'bg-white/10',
    },
    {
      id: 'light' as ThemeMode,
      name: 'โหมดสว่าง',
      description: 'สดใส สะอาดตา',
      icon: Sun,
      previewBg: 'bg-gray-50',
      previewCard: 'bg-white',
    },
  ];

  return (
    <div className={cn(
      "min-h-screen pb-24 transition-colors duration-300",
      isDark ? "bg-black" : "bg-gray-50"
    )}>
      {/* Animated Background for Dark Theme */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="px-6 pt-12 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link
              to="/profile"
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                isDark 
                  ? "bg-white/10 hover:bg-white/20" 
                  : "bg-gray-200 hover:bg-gray-300"
              )}
            >
              <ArrowLeft className={cn("w-5 h-5", isDark ? "text-white" : "text-gray-700")} />
            </Link>
            <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
              ตั้งค่า
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 space-y-6">
          {/* Theme Selection */}
          <div className={cn(
            "rounded-2xl overflow-hidden border",
            isDark 
              ? "bg-white/5 border-white/10" 
              : "bg-white border-gray-200 shadow-sm"
          )}>
            <div className={cn(
              "p-4 border-b flex items-center gap-3",
              isDark ? "border-white/10" : "border-gray-100"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isDark ? "bg-purple-500/20" : "bg-purple-100"
              )}>
                <Palette className={cn("w-5 h-5", isDark ? "text-purple-400" : "text-purple-600")} />
              </div>
              <h2 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                ธีมแอปพลิเคชัน
              </h2>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleThemeSelect(option.id)}
                      className={cn(
                        "relative rounded-xl p-4 transition-all duration-300 border-2",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : isDark
                            ? "border-white/10 bg-white/5 hover:bg-white/10"
                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                      )}
                    >
                      {/* Preview */}
                      <div className={cn(
                        "w-full h-20 rounded-lg mb-3 overflow-hidden border",
                        option.previewBg,
                        option.id === 'dark' ? 'border-white/10' : 'border-gray-200'
                      )}>
                        <div className={cn(
                          "h-4 flex items-center px-2",
                          option.id === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
                        )}>
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          </div>
                        </div>
                        <div className="p-2 space-y-1">
                          <div className={cn("h-3 rounded w-3/4", option.previewCard)} />
                          <div className={cn("h-3 rounded w-1/2", option.previewCard)} />
                          <div className="flex gap-1 mt-2">
                            <div className="h-4 w-8 rounded bg-orange-500" />
                            <div className={cn("h-4 flex-1 rounded", option.previewCard)} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          "w-4 h-4",
                          isSelected 
                            ? "text-primary" 
                            : isDark ? "text-gray-400" : "text-gray-500"
                        )} />
                        <span className={cn(
                          "font-medium text-sm",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          {option.name}
                        </span>
                        {isSelected && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className={cn(
            "rounded-2xl overflow-hidden border",
            isDark 
              ? "bg-white/5 border-white/10" 
              : "bg-white border-gray-200 shadow-sm"
          )}>
            <div className={cn(
              "p-4 border-b flex items-center gap-3",
              isDark ? "border-white/10" : "border-gray-100"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isDark ? "bg-orange-500/20" : "bg-coral-light"
              )}>
                <Bell className={cn("w-5 h-5", isDark ? "text-orange-400" : "text-primary")} />
              </div>
              <h2 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                การแจ้งเตือน
              </h2>
            </div>
            <div className={cn("divide-y", isDark ? "divide-white/10" : "divide-gray-100")}>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                    เตือนออกกำลังกาย
                  </p>
                  <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    รับการแจ้งเตือนให้ออกกำลังกาย
                  </p>
                </div>
                <Switch
                  checked={notifications.workoutReminders}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, workoutReminders: checked })
                  }
                />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                    เตือนมื้ออาหาร
                  </p>
                  <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    ติดตามโภชนาการของคุณ
                  </p>
                </div>
                <Switch
                  checked={notifications.mealReminders}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, mealReminders: checked })
                  }
                />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                    อัพเดทความก้าวหน้า
                  </p>
                  <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    สรุปประจำสัปดาห์
                  </p>
                </div>
                <Switch
                  checked={notifications.progressUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, progressUpdates: checked })
                  }
                />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                    เคล็ดลับจากโค้ช
                  </p>
                  <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    คำแนะนำจาก AI Coach
                  </p>
                </div>
                <Switch
                  checked={notifications.coachTips}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, coachTips: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              "rounded-2xl p-4 w-full flex items-center gap-3 border transition-colors",
              isDark 
                ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" 
                : "bg-white border-gray-200 text-red-600 hover:bg-red-50"
            )}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
