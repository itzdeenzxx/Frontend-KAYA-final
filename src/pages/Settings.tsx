import { useState, useEffect } from "react";
import { ArrowLeft, Sun, Moon, ChevronRight, LogOut, Check, Palette, Shield, Copy, MessageCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { isLineUserAdmin } from "@/lib/adminAccess";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { CoachSettings } from "@/components/settings/CoachSettings";
import { getUserSettings, updateLineNotificationSettings } from "@/lib/firestore";

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { logout, userProfile, userSettings, refreshSettings } = useAuth();
  const isDark = theme === 'dark';
  const rawAdminIds = (import.meta.env.VITE_ADMIN_USER_IDS as string | undefined) ?? '';
  const isAdmin = isLineUserAdmin(userProfile?.lineUserId, rawAdminIds);

  type LineSetupStep = 'setup' | 'checking' | 'error' | 'activated';
  const [lineStep, setLineStep] = useState<LineSetupStep>('setup');
  const [lineNotifyHour, setLineNotifyHour] = useState(7);
  const [savingHour, setSavingHour] = useState(false);
  const [copiedLineId, setCopiedLineId] = useState(false);

  const [lineNotifEnabled, setLineNotifEnabled] = useState(false);
  const [savingLineToggle, setSavingLineToggle] = useState(false);

  // Initialise from Firestore — show activated if accepted (regardless of enabled)
  useEffect(() => {
    const ln = userSettings?.lineNotification;
    if (ln?.accepted === true) {
      setLineStep('activated');
      setLineNotifyHour(ln.notifyHour ?? 7);
      setLineNotifEnabled(ln.enabled ?? false);
    }
  }, [userSettings]);

  const handleLineNotifToggle = async (checked: boolean) => {
    if (!userProfile?.lineUserId) return;
    setLineNotifEnabled(checked);
    setSavingLineToggle(true);
    try {
      await updateLineNotificationSettings(userProfile.lineUserId, { enabled: checked });
      await refreshSettings();
    } finally {
      setSavingLineToggle(false);
    }
  };

  const handleCheckLineAccepted = async () => {
    if (!userProfile?.lineUserId) return;
    setLineStep('checking');
    try {
      const latest = await getUserSettings(userProfile.lineUserId);
      if (latest?.lineNotification?.accepted === true) {
        await updateLineNotificationSettings(userProfile.lineUserId, {
          enabled: true,
          notifyHour: latest.lineNotification.notifyHour ?? 7,
        });
        await refreshSettings();
        setLineNotifyHour(latest.lineNotification.notifyHour ?? 7);
        setLineNotifEnabled(true);
        setLineStep('activated');
      } else {
        setLineStep('error');
      }
    } catch {
      setLineStep('error');
    }
  };

  const handleSaveNotifyHour = async () => {
    if (!userProfile?.lineUserId) return;
    setSavingHour(true);
    try {
      await updateLineNotificationSettings(userProfile.lineUserId, { notifyHour: lineNotifyHour });
      await refreshSettings();
    } finally {
      setSavingHour(false);
    }
  };

  const handleCopyLineId = () => {
    navigator.clipboard.writeText('@426emlbf');
    setCopiedLineId(true);
    setTimeout(() => setCopiedLineId(false), 2000);
  };
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
        <div className="fixed inset-0 lg:left-72 overflow-hidden pointer-events-none z-0">
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

          {/* Coach Settings */}
          <CoachSettings isDark={isDark} />

          {/* Admin Tools */}
          {isAdmin && (
            <Link
              to="/admin/badges"
              className={cn(
                "rounded-2xl p-4 w-full flex items-center gap-3 border transition-colors",
                isDark
                  ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20"
                  : "bg-white border-cyan-200 text-cyan-700 hover:bg-cyan-50"
              )}
            >
              <Shield className="w-5 h-5" />
              <div className="flex-1 text-left">
                <p className="font-medium">Admin: Badge Manager</p>
                <p className={cn("text-sm", isDark ? "text-cyan-200/80" : "text-cyan-700/80")}>
                  จัดการ Badge Catalog
                </p>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}

          {/* LINE Notification */}
          <div className={cn(
            "rounded-2xl overflow-hidden border",
            isDark
              ? "bg-white/5 border-white/10"
              : "bg-white border-gray-200 shadow-sm"
          )}>
            {/* Header */}
            <div className={cn(
              "p-4 border-b flex items-center gap-3",
              isDark ? "border-white/10" : "border-gray-100"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isDark ? "bg-green-500/20" : "bg-green-100"
              )}>
                <MessageCircle className={cn("w-5 h-5", isDark ? "text-green-400" : "text-green-600")} />
              </div>
              <div>
                <h2 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                  แจ้งเตือนออกกำลังกายผ่าน LINE
                </h2>
                <p className={cn("text-xs mt-0.5", isDark ? "text-gray-400" : "text-gray-500")}>
                  รับการแจ้งเตือนรายวันจาก KAYA AI
                </p>
              </div>
            </div>

            <div className="p-4 space-y-4">

              {/* ── STEP: SETUP ── */}
              {(lineStep === 'setup' || lineStep === 'error') && (
                <>
                  {/* Instruction */}
                  <p className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-600")}>
                    เพิ่มเพื่อน LINE OA ของ KAYA AI เพื่อรับแจ้งเตือนออกกำลังกายทุกวัน
                  </p>

                  {/* LINE OA Card */}
                  <div className={cn(
                    "rounded-xl p-4 flex items-center justify-between border",
                    isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm",
                        "bg-gradient-to-br from-green-400 to-green-600"
                      )}>
                        K
                      </div>
                      <div>
                        <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>
                          KAYA AI Notification
                        </p>
                        <p className={cn("text-xs font-mono", isDark ? "text-green-400" : "text-green-700")}>
                          @426emlbf
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyLineId}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        copiedLineId
                          ? isDark ? "bg-green-500/30 text-green-300" : "bg-green-200 text-green-800"
                          : isDark ? "bg-white/10 text-gray-200 hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {copiedLineId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedLineId ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                  </div>

                  {/* Add friend button */}
                  <a
                    href="https://line.me/R/ti/p/%40426emlbf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                      "bg-[#06C755] hover:bg-[#05b04c] active:scale-[0.98] text-white"
                    )}
                  >
                    <MessageCircle className="w-4 h-4" />
                    เพิ่มเพื่อนใน LINE
                  </a>

                  {/* Error message */}
                  {lineStep === 'error' && (
                    <div className={cn(
                      "flex items-center gap-2 rounded-xl p-3 text-sm",
                      isDark ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-200"
                    )}>
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>ยืนยันตัวไม่สำเร็จ กรุณาเพิ่มเพื่อนก่อนแล้วลองใหม่อีกครั้ง</span>
                    </div>
                  )}

                  {/* Confirm button */}
                  <button
                    onClick={handleCheckLineAccepted}
                    className={cn(
                      "w-full py-3 rounded-xl font-semibold text-sm transition-all border-2",
                      isDark
                        ? "border-green-500/40 text-green-400 hover:bg-green-500/10 active:scale-[0.98]"
                        : "border-green-500/50 text-green-700 hover:bg-green-50 active:scale-[0.98]"
                    )}
                  >
                    เพิ่มเพื่อนเรียบร้อยแล้ว →
                  </button>
                </>
              )}

              {/* ── STEP: CHECKING ── */}
              {lineStep === 'checking' && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className={cn("w-8 h-8 animate-spin", isDark ? "text-green-400" : "text-green-600")} />
                  <p className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-600")}>
                    กำลังตรวจสอบสถานะ...
                  </p>
                </div>
              )}

              {/* ── STEP: ACTIVATED ── */}
              {lineStep === 'activated' && (
                <>
                  {/* Toggle เปิด/ปิด */}
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl border",
                    isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                  )}>
                    <div>
                      <p className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>
                        การแจ้งเตือนออกกำลังกาย
                      </p>
                      <p className={cn("text-xs mt-0.5", isDark ? "text-gray-400" : "text-gray-500")}>
                        {lineNotifEnabled ? "เปิดอยู่ · จะแจ้งเตือนทุกวันเวลา " + String(lineNotifyHour).padStart(2,'0') + ":00" : "ปิดอยู่"}
                      </p>
                    </div>
                    <Switch
                      checked={lineNotifEnabled}
                      disabled={savingLineToggle}
                      onCheckedChange={handleLineNotifToggle}
                    />
                  </div>

                  {/* Time picker */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className={cn("w-4 h-4", isDark ? "text-gray-400" : "text-gray-500")} />
                      <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                        เวลาแจ้งเตือนออกกำลังกายประจำวัน
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                        <button
                          key={hour}
                          onClick={() => setLineNotifyHour(hour)}
                          className={cn(
                            "py-2 rounded-xl text-sm font-medium transition-all",
                            lineNotifyHour === hour
                              ? "bg-primary text-white"
                              : isDark
                                ? "bg-white/8 text-gray-300 hover:bg-white/15"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          )}
                        >
                          {String(hour).padStart(2, '0')}:00
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSaveNotifyHour}
                      disabled={savingHour}
                      className={cn(
                        "mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all",
                        "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]",
                        savingHour && "opacity-60 pointer-events-none"
                      )}
                    >
                      {savingHour ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> บันทึก...
                        </span>
                      ) : 'บันทึกเวลาแจ้งเตือน'}
                    </button>
                  </div>
                </>
              )}

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
