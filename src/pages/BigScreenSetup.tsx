import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Monitor, 
  Smartphone, 
  QrCode, 
  Keyboard, 
  Sparkles, 
  Check, 
  Zap, 
  Activity,
  Wifi,
  Play,
  Star,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import {
  createWorkoutSession,
  subscribeToSession,
  getLocalIP,
  WorkoutSession,
} from '@/lib/session';
import { useTheme } from '@/contexts/ThemeContext';

export default function BigScreenSetup() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(true);

  // Create session and get IP on mount
  useEffect(() => {
    const initSession = async () => {
      setIsCreatingSession(true);
      try {
        const [newSession, ip] = await Promise.all([
          createWorkoutSession('bigscreen'),
          getLocalIP()
        ]);
        setSession(newSession);
        setIpAddress(ip);
      } catch (error) {
        console.error('Failed to create session:', error);
      } finally {
        setIsCreatingSession(false);
      }
    };

    initSession();
  }, []);

  // Subscribe to session updates
  useEffect(() => {
    if (!session?.pairingCode) return;

    const unsubscribe = subscribeToSession(session.pairingCode, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);

        if (updatedSession.status === 'connected') {
          setTimeout(() => {
            navigate(`/workout-bigscreen?code=${updatedSession.pairingCode}`);
          }, 1500);
        }
      }
    });

    return () => unsubscribe();
  }, [session?.pairingCode, navigate]);

  // QR Code value
  const qrValue = session?.pairingCode
    ? JSON.stringify({
        type: 'kaya_pair',
        code: session.pairingCode,
        ip: ipAddress,
        mode: 'bigscreen',
      })
    : '';

  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Epic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Main Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1920&q=80" 
            alt="Gym Background"
            className="w-full h-full object-cover"
          />
          <div className={cn(
            "absolute inset-0",
            isDark 
              ? "bg-gradient-to-br from-black/95 via-black/85 to-black/95" 
              : "bg-gradient-to-br from-white/95 via-white/85 to-white/95"
          )} />
        </div>
        
        {/* Animated Gradient Orbs */}
        {isDark && (
          <>
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          </>
        )}
        
        {/* Grid Pattern */}
        <div className={cn(
          "absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]",
          !isDark && "opacity-30"
        )} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link
              to="/workout-selection"
              className={cn(
                "w-12 h-12 rounded-2xl backdrop-blur-md flex items-center justify-center transition-all border",
                isDark 
                  ? "bg-white/10 border-white/20 hover:bg-white/20" 
                  : "bg-white border-gray-200 shadow-lg hover:bg-gray-50"
              )}
            >
              <ArrowLeft className={cn("w-5 h-5", isDark ? "text-white" : "text-gray-700")} />
            </Link>
            
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md",
                isDark 
                  ? "bg-green-500/20 border-green-500/30" 
                  : "bg-green-500/10 border-green-500/20"
              )}>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-500">Big Screen Mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="max-w-4xl w-full">
            {/* Title Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-orange-500/20 border border-primary/30 mb-6">
                <Crown className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary">PREMIUM EXPERIENCE</span>
                <Star className="w-5 h-5 text-primary" />
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
                <span className={cn(
                  "bg-clip-text text-transparent",
                  isDark 
                    ? "bg-gradient-to-r from-white via-gray-200 to-gray-400" 
                    : "bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500"
                )}>
                  BIG
                </span>
                {' '}
                <span className="bg-gradient-to-r from-primary via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  SCREEN
                </span>
              </h1>
              
              <p className={cn("text-lg md:text-xl max-w-xl mx-auto", isDark ? "text-gray-400" : "text-gray-600")}>
                สแกน QR Code หรือกรอกรหัสบนมือถือเพื่อเริ่มต้น
              </p>
            </div>

            {/* Main QR Section */}
            <div className={cn(
              "relative rounded-3xl overflow-hidden backdrop-blur-xl",
              isDark 
                ? "bg-black/70 border border-white/30 shadow-2xl shadow-black/50" 
                : "bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl"
            )}>
              {/* Decorative Top Bar */}
              <div className="h-2 bg-gradient-to-r from-primary via-orange-400 to-yellow-400" />
              
              <div className="p-8 md:p-12">
                {isCreatingSession ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                    <p className={cn("text-xl font-medium", isDark ? "text-gray-400" : "text-gray-600")}>
                      กำลังสร้าง Session...
                    </p>
                    <p className={cn("text-sm mt-2", isDark ? "text-gray-500" : "text-gray-400")}>
                      รอสักครู่
                    </p>
                  </div>
                ) : session ? (
                  <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                    {/* QR Code Section */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        {/* Glow Effect */}
                        <div className={cn(
                          "absolute -inset-4 rounded-3xl blur-xl transition-all",
                          session.status === 'connected' 
                            ? "bg-green-500/30" 
                            : "bg-primary/20"
                        )} />
                        
                        {/* QR Container */}
                        <div
                          className={cn(
                            'relative p-6 bg-white rounded-3xl shadow-2xl transition-all',
                            session.status === 'connected' && 'ring-4 ring-green-500 ring-offset-4 ring-offset-black'
                          )}
                        >
                          {session.status === 'connected' ? (
                            <div className="w-[220px] h-[220px] flex items-center justify-center">
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-500/50">
                                <Check className="w-12 h-12 text-white" />
                              </div>
                            </div>
                          ) : (
                            <QRCodeSVG
                              value={qrValue}
                              size={220}
                              level="H"
                              fgColor="#dd6e53"
                              bgColor="transparent"
                            />
                          )}
                        </div>
                        
                        {/* Corner Decorations */}
                        <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 text-center lg:text-left">
                      {/* Status Badge */}
                      <div
                        className={cn(
                          'inline-flex items-center gap-3 px-5 py-3 rounded-full font-medium mb-6',
                          session.status === 'connected'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : isDark 
                              ? 'bg-white/10 text-gray-300 border border-white/20' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                        )}
                      >
                        {session.status === 'connected' ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span className="text-lg">เชื่อมต่อสำเร็จ!</span>
                            <Sparkles className="w-5 h-5" />
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                            <span>รอการเชื่อมต่อจากมือถือ...</span>
                          </>
                        )}
                      </div>

                      {/* Pairing Code */}
                      <div className="mb-8">
                        <p className={cn("text-sm mb-3", isDark ? "text-gray-400" : "text-gray-500")}>
                          หรือกรอกรหัสนี้บนมือถือ
                        </p>
                        <div className={cn(
                          "inline-flex items-center gap-4 px-8 py-5 rounded-2xl border",
                          isDark 
                            ? "bg-white/10 border-white/20" 
                            : "bg-gray-50 border-gray-200"
                        )}>
                          <Keyboard className="w-6 h-6 text-primary" />
                          <div className="text-5xl font-mono font-black tracking-[0.4em] text-primary">
                            {session.pairingCode}
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
                        {[
                          { icon: Monitor, label: 'หน้าจอใหญ่', desc: 'แสดงผลชัด' },
                          { icon: Smartphone, label: 'รีโมทควบคุม', desc: 'ใช้มือถือ' },
                          { icon: Zap, label: 'Real-time Sync', desc: 'ตอบสนองไว' },
                          { icon: Activity, label: 'AI Coach', desc: 'วิเคราะห์ท่าทาง' },
                        ].map((feature, i) => (
                          <div key={i} className={cn(
                            "flex items-center gap-3 p-3 rounded-xl",
                            isDark ? "bg-white/5" : "bg-gray-50"
                          )}>
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isDark ? "bg-primary/20" : "bg-primary/10"
                            )}>
                              <feature.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium">{feature.label}</p>
                              <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>{feature.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* IP Address */}
                      {ipAddress && (
                        <div className={cn(
                          "flex items-center justify-center lg:justify-start gap-2 mt-6 text-sm",
                          isDark ? "text-gray-500" : "text-gray-400"
                        )}>
                          <Wifi className="w-4 h-4" />
                          <span>IP: {ipAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Start Button when connected */}
            {session?.status === 'connected' && (
              <div className="mt-8">
                <Button
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 rounded-2xl shadow-lg shadow-green-500/30"
                  onClick={() => navigate(`/workout-bigscreen?code=${session.pairingCode}`)}
                >
                  <Play className="w-6 h-6 mr-3" />
                  เริ่มต้นใช้งาน Big Screen
                  <Sparkles className="w-6 h-6 ml-3" />
                </Button>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'เปิดแอป Kaya บนมือถือ', desc: 'เลือกเมนู "เชื่อมต่อ Big Screen"' },
                { step: '2', title: 'สแกน QR Code หรือกรอกรหัส', desc: 'ใช้มือถือสแกนหรือกรอกรหัส 5 ตัว' },
                { step: '3', title: 'เริ่มออกกำลังกาย!', desc: 'ควบคุมการออกกำลังกายผ่านมือถือ' },
              ].map((item, i) => (
                <div key={i} className={cn(
                  "p-5 rounded-2xl border text-center",
                  isDark 
                    ? "bg-white/5 border-white/10" 
                    : "bg-white border-gray-200 shadow-sm"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-lg",
                    isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                  )}>
                    {item.step}
                  </div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
