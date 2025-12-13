import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone, Monitor, ArrowLeft, Check, Computer, Tv, QrCode, Keyboard, Sparkles, Zap, Target, Activity, Dumbbell, Brain, Play, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import {
  isMobileDevice,
  createWorkoutSession,
  connectToSession,
  subscribeToSession,
  getLocalIP,
  WorkoutSession,
} from '@/lib/session';
import { scanQRCode, isQRScannerAvailable, isInLineApp } from '@/lib/liff';
import { getWorkoutStyle } from '@/lib/workoutStyles';
import { useTheme } from '@/contexts/ThemeContext';

type DesktopMode = 'computer' | 'bigscreen' | null;
type MobileMode = 'remote' | null;
type PairingMethod = 'qr' | 'code' | null;

export default function WorkoutMode() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isMobile] = useState(() => isMobileDevice());
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Get selected workout style
  const selectedStyleId = localStorage.getItem('kaya_workout_style');
  const selectedStyle = getWorkoutStyle(selectedStyleId);

  // Desktop state
  const [desktopMode, setDesktopMode] = useState<DesktopMode>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Mobile state
  const [mobileMode, setMobileMode] = useState<MobileMode>(null);
  const [pairingMethod, setPairingMethod] = useState<PairingMethod>(null);
  const [pairingCode, setPairingCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Get IP address on mount for desktop
  useEffect(() => {
    if (!isMobile) {
      getLocalIP().then(setIpAddress);
    }
  }, [isMobile]);

  // Subscribe to session updates when session is created
  useEffect(() => {
    if (!session?.pairingCode) return;

    const unsubscribe = subscribeToSession(session.pairingCode, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);

        if (updatedSession.status === 'connected') {
          setTimeout(() => {
            if (desktopMode === 'bigscreen') {
              navigate(`/workout-bigscreen?code=${updatedSession.pairingCode}`);
            }
          }, 1000);
        }
      }
    });

    return () => unsubscribe();
  }, [session?.pairingCode, desktopMode, navigate]);

  // Desktop: Handle mode selection
  const handleDesktopModeSelect = async (mode: DesktopMode) => {
    setDesktopMode(mode);

    if (mode === 'bigscreen') {
      setIsCreatingSession(true);
      try {
        const newSession = await createWorkoutSession('bigscreen');
        setSession(newSession);
      } catch (error) {
        console.error('Failed to create session:', error);
      } finally {
        setIsCreatingSession(false);
      }
    }
  };

  // Desktop: Continue with workout
  const handleDesktopContinue = () => {
    if (desktopMode === 'computer') {
      navigate('/workout');
    }
  };

  // Mobile: Handle QR Scan using LIFF
  const handleQRScan = useCallback(async () => {
    try {
      const result = await scanQRCode();
      if (result?.value) {
        try {
          const data = JSON.parse(result.value);
          if (data.type === 'kaya_pair' && data.code) {
            setPairingCode(data.code);
            handleConnect(data.code);
          }
        } catch {
          setPairingCode(result.value);
          handleConnect(result.value);
        }
      }
    } catch (error) {
      console.error('QR scan failed:', error);
      setConnectionError('ไม่สามารถสแกน QR code ได้');
    }
  }, []);

  // Mobile: Handle manual code connection
  const handleConnect = async (code?: string) => {
    const codeToUse = code || pairingCode;
    if (!codeToUse || codeToUse.length !== 5) {
      setConnectionError('กรุณากรอกรหัส 5 ตัว');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');

    try {
      // Get the selected workout style from localStorage to send to session
      const workoutStyle = localStorage.getItem('kaya_workout_style') || 'strength';
      const success = await connectToSession(codeToUse, workoutStyle);
      if (success) {
        localStorage.setItem('kaya_pairing_code', codeToUse.toUpperCase());
        navigate(`/workout-remote?code=${codeToUse.toUpperCase()}`);
      } else {
        setConnectionError('ไม่พบ Session หรือ Session หมดอายุแล้ว');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsConnecting(false);
    }
  };

  // QR Code value for desktop BigScreen mode
  const qrValue = session
    ? JSON.stringify({
        type: 'kaya_pair',
        code: session.pairingCode,
        ip: ipAddress,
        timestamp: Date.now(),
      })
    : '';

  // Render Mobile View
  if (isMobile) {
    return (
      <div className={cn(
        "min-h-screen relative overflow-hidden",
        isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
      )}>
        {/* Animated Background - Dark Theme Only */}
        {isDark && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute top-1/3 -left-40 w-60 h-60 bg-purple-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
          </div>
        )}

        <div className="relative z-10 px-5 pt-8 pb-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/workout-selection"
              className={cn(
                "w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center transition-colors",
                isDark 
                  ? "bg-white/10 hover:bg-white/20" 
                  : "bg-white border border-gray-200 shadow-sm hover:bg-gray-100"
              )}
            >
              <ArrowLeft className={cn("w-5 h-5", !isDark && "text-gray-700")} />
            </Link>
          </div>

          {/* Selected Style Banner */}
          {selectedStyle && (
            <div className="relative rounded-2xl overflow-hidden mb-6">
              <div className={cn("absolute inset-0 bg-gradient-to-r", selectedStyle.bgGradient)} />
              <div className="relative p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center", selectedStyle.color)}>
                    {selectedStyle.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{selectedStyle.name}</h3>
                    <p className="text-white/70 text-sm">{selectedStyle.nameEn}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hero Section */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-4">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white">AI-Powered Workout</span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">เลือกโหมด</h1>
            <p className="text-gray-400">เลือกวิธีที่คุณต้องการออกกำลังกาย</p>
          </div>

          {/* Mobile Mode Selection */}
          <div className="space-y-4 mb-8">
            {/* Workout on Mobile */}
            <button
              onClick={() => navigate('/workout')}
              className="w-full relative rounded-2xl overflow-hidden group"
            >
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80"
                alt="Mobile Workout"
                className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
              <div className="absolute inset-0 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Smartphone className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-white">ออกกำลังกายบนมือถือ</h3>
                    <p className="text-white/80 text-sm">ใช้มือถือโดยตรงพร้อม AI Coach</p>
                  </div>
                </div>
                <Play className="w-8 h-8 text-white/80 group-hover:text-white transition-colors" />
              </div>
            </button>

            {/* Connect to Big Screen */}
            <button
              onClick={() => setMobileMode('remote')}
              className={cn(
                "w-full relative rounded-2xl overflow-hidden group border-2 transition-all",
                mobileMode === 'remote' ? 'border-green-500' : 'border-transparent'
              )}
            >
              <img 
                src="https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80"
                alt="Big Screen"
                className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-600/70 to-transparent" />
              <div className="absolute inset-0 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Tv className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">เชื่อมต่อกับ Big Screen</h3>
                      <span className="px-2 py-0.5 rounded-full bg-green-500/30 text-green-300 text-xs font-medium border border-green-500/50">แนะนำ</span>
                    </div>
                    <p className="text-white/80 text-sm">ใช้มือถือเป็น Remote ควบคุม</p>
                  </div>
                </div>
                {mobileMode === 'remote' && (
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Pairing Options for Mobile */}
          {mobileMode === 'remote' && (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-4">
                <Wifi className="w-5 h-5 text-primary" />
                <h3 className="font-bold">เลือกวิธีเชื่อมต่อ</h3>
              </div>

              {/* Pairing Method Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(isInLineApp() || isQRScannerAvailable()) && (
                  <button
                    onClick={() => {
                      setPairingMethod('qr');
                      handleQRScan();
                    }}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all',
                      pairingMethod === 'qr'
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 hover:border-primary/50 bg-white/5'
                    )}
                  >
                    <QrCode className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">สแกน QR Code</p>
                  </button>
                )}

                <button
                  onClick={() => setPairingMethod('code')}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all',
                    pairingMethod === 'code'
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-primary/50 bg-white/5',
                    !(isInLineApp() || isQRScannerAvailable()) && 'col-span-2'
                  )}
                >
                  <Keyboard className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">กรอกรหัส</p>
                </button>
              </div>

              {/* Code Input Form */}
              {pairingMethod === 'code' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      กรอกรหัส 5 ตัวที่แสดงบนหน้าจอใหญ่
                    </label>
                    <Input
                      type="text"
                      maxLength={5}
                      value={pairingCode}
                      onChange={(e) => {
                        setPairingCode(e.target.value.toUpperCase());
                        setConnectionError('');
                      }}
                      placeholder="เช่น ABC12"
                      className="text-center text-2xl font-mono tracking-widest h-14 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {connectionError && (
                    <p className="text-red-400 text-sm text-center">{connectionError}</p>
                  )}

                  <Button
                    className="w-full h-12 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90"
                    onClick={() => handleConnect()}
                    disabled={isConnecting || pairingCode.length !== 5}
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        กำลังเชื่อมต่อ...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        เชื่อมต่อ
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Desktop View
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 -left-40 w-60 h-60 bg-purple-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 px-6 pt-12 pb-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/workout-selection"
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Selected Style Banner */}
        {selectedStyle && (
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <div className={cn("absolute inset-0 bg-gradient-to-r", selectedStyle.bgGradient)} />
            <div className="relative p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center", selectedStyle.color)}>
                  {selectedStyle.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedStyle.name}</h3>
                  <p className="text-white/70">{selectedStyle.nameEn}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-white/80">
                <span>{selectedStyle.duration}</span>
                <span>•</span>
                <span>{selectedStyle.calories} kcal</span>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 mb-5">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-white">AI-Powered Workout Experience</span>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">เลือกโหมดการใช้งาน</h1>
          <p className="text-lg text-gray-400 max-w-md mx-auto">
            ออกกำลังกายอย่างชาญฉลาดกับ AI Coach ที่วิเคราะห์ท่าทางแบบ Real-time
          </p>
        </div>

        {/* AI Features */}
        <div className="flex justify-center gap-8 mb-10">
          {[
            { icon: Target, label: 'Pose Detection', desc: 'ตรวจจับท่าทาง' },
            { icon: Brain, label: 'AI Coaching', desc: 'โค้ชอัจฉริยะ' },
            { icon: Zap, label: 'Real-time', desc: 'วิเคราะห์ทันที' },
            { icon: Activity, label: 'Rep Counter', desc: 'นับรอบอัตโนมัติ' },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <span className="text-sm font-medium">{feature.label}</span>
              <span className="text-xs text-gray-500">{feature.desc}</span>
            </div>
          ))}
        </div>

        {/* Desktop Mode Selection */}
        <div className="max-w-xl mx-auto mb-8">
          {/* Workout on Computer */}
          <button
            onClick={() => handleDesktopModeSelect('computer')}
            className={cn(
              'relative rounded-2xl overflow-hidden group border-2 transition-all',
              desktopMode === 'computer' ? 'border-primary' : 'border-transparent'
            )}
          >
            <img 
              src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80"
              alt="Computer Workout"
              className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
                  desktopMode === 'computer' ? 'bg-primary' : 'bg-white/20'
                )}>
                  <Computer className="w-7 h-7 text-white" />
                </div>
                {desktopMode === 'computer' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-bounce">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-1">ออกกำลังกายบนคอมพิวเตอร์</h3>
              <p className="text-gray-300 text-sm mb-3">ใช้คอมพิวเตอร์นี้โดยตรง พร้อม AI Coach และ Pose Detection</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><Brain className="w-4 h-4" /> AI วิเคราะห์ท่าทาง</span>
                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> เริ่มทันที</span>
              </div>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        {desktopMode === 'computer' && (
          <Button
            className="w-full max-w-xl mx-auto h-14 text-lg bg-gradient-to-r from-primary to-orange-500 hover:opacity-90"
            onClick={handleDesktopContinue}
          >
            <Zap className="w-5 h-5 mr-2" />
            เริ่มออกกำลังกาย
            <Dumbbell className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
