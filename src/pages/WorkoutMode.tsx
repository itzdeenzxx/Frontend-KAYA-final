import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone, Monitor, ArrowLeft, Check, Computer, Tv, QrCode, Keyboard, Sparkles, Zap, Target, Activity, Dumbbell, Brain } from 'lucide-react';
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

type DesktopMode = 'computer' | 'bigscreen' | null;
type MobileMode = 'remote' | null;
type PairingMethod = 'qr' | 'code' | null;

export default function WorkoutMode() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isMobile] = useState(() => isMobileDevice());

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

        // When connected, redirect to appropriate page
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
        // Parse QR data
        try {
          const data = JSON.parse(result.value);
          if (data.type === 'kaya_pair' && data.code) {
            setPairingCode(data.code);
            handleConnect(data.code);
          }
        } catch {
          // If not JSON, treat as plain code
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
      const success = await connectToSession(codeToUse);
      if (success) {
        // Save code for remote page
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
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-primary/20 to-orange-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -left-32 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-bl from-green-500/10 to-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Sport-themed decorative icons */}
          <Dumbbell className="absolute top-24 right-8 w-6 h-6 text-primary/10 animate-bounce" style={{ animationDuration: '3s' }} />
          <Target className="absolute top-48 left-6 w-5 h-5 text-primary/10 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
          <Activity className="absolute bottom-32 right-12 w-6 h-6 text-primary/10 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
        </div>

        <div className="relative px-6 pt-12 pb-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-xl bg-muted/80 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>

          {/* Hero Section */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-orange-400/10 border border-primary/20 mb-4">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Workout</span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              เริ่มออกกำลังกาย
            </h1>
            <p className="text-muted-foreground">
              ออกกำลังกายอย่างชาญฉลาดกับ AI Coach ของคุณ
            </p>
          </div>

          {/* AI Features Banner */}
          <div className="bg-gradient-to-r from-primary/5 via-orange-400/5 to-primary/5 rounded-2xl p-4 mb-6 border border-primary/10">
            <div className="flex items-center justify-around text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Pose Detection</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">AI Coaching</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Real-time</span>
              </div>
            </div>
          </div>

        {/* Mobile Mode Selection */}
        <div className="space-y-4 mb-8">
          {/* Workout on Mobile */}
          <button
            onClick={() => navigate('/workout')}
            className="w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left border-border hover:border-primary/50 bg-gradient-to-br from-background to-muted/30 hover:shadow-lg hover:shadow-primary/5 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-orange-400/20 text-primary group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">ออกกำลังกายบนมือถือ</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  ใช้มือถือโดยตรงพร้อม AI Coach วิเคราะห์ท่าทาง
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Brain className="w-3 h-3" /> AI วิเคราะห์
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3" /> เริ่มทันที
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Connect to Big Screen */}
          <button
            onClick={() => setMobileMode('remote')}
            className={cn(
              'w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left bg-gradient-to-br from-background to-muted/30',
              mobileMode === 'remote'
                ? 'border-primary bg-coral-light shadow-coral shadow-lg'
                : 'border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center transition-all',
                  mobileMode === 'remote'
                    ? 'gradient-coral text-primary-foreground scale-110'
                    : 'bg-gradient-to-br from-primary/20 to-orange-400/20 text-primary'
                )}
              >
                <Tv className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">เชื่อมต่อกับ Big Screen</h3>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">แนะนำ</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  ใช้มือถือเป็น Remote ควบคุมหน้าจอใหญ่
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Monitor className="w-3 h-3" /> จอใหญ่
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Smartphone className="w-3 h-3" /> รีโมท
                  </span>
                </div>
              </div>
              {mobileMode === 'remote' && (
                <div className="w-6 h-6 rounded-full gradient-coral flex items-center justify-center animate-bounce">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Pairing Options for Mobile */}
        {mobileMode === 'remote' && (
          <div className="card-elevated p-5 mb-8 animate-fade-in border border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-medium">เลือกวิธีเชื่อมต่อ</h3>
            </div>

            {/* Pairing Method Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* QR Scan Button - Only show if LIFF scanner available */}
              {(isInLineApp() || isQRScannerAvailable()) && (
                <button
                  onClick={() => {
                    setPairingMethod('qr');
                    handleQRScan();
                  }}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all hover:scale-105',
                    pairingMethod === 'qr'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <QrCode className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">สแกน QR Code</p>
                </button>
              )}

              {/* Code Input Button */}
              <button
                onClick={() => setPairingMethod('code')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all hover:scale-105',
                  pairingMethod === 'code'
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-border hover:border-primary/50',
                  !(isInLineApp() || isQRScannerAvailable()) && 'col-span-2'
                )}
              >
                <Keyboard className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">กรอกรหัส</p>
              </button>
            </div>

            {/* Code Input Form */}
            {pairingMethod === 'code' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
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
                    className="text-center text-2xl font-mono tracking-widest h-14 border-2 focus:border-primary"
                  />
                </div>

                {connectionError && (
                  <p className="text-destructive text-sm text-center">{connectionError}</p>
                )}

                <Button
                  variant="hero"
                  className="w-full group"
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
                      <Zap className="w-4 h-4 mr-2 group-hover:animate-pulse" />
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-orange-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 -left-48 w-72 h-72 bg-gradient-to-tr from-blue-500/10 to-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-gradient-to-bl from-green-500/10 to-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gradient-to-tl from-purple-500/5 to-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        
        {/* Sport-themed decorative icons */}
        <Dumbbell className="absolute top-32 right-20 w-10 h-10 text-primary/10 animate-bounce" style={{ animationDuration: '3s' }} />
        <Target className="absolute top-64 left-16 w-8 h-8 text-primary/10 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
        <Activity className="absolute bottom-48 right-32 w-10 h-10 text-primary/10 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
        <Zap className="absolute top-1/2 right-1/4 w-6 h-6 text-primary/10 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.75s' }} />
      </div>

      <div className="relative px-6 pt-12 pb-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-xl bg-muted/80 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Hero Section */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-orange-400/10 border border-primary/20 mb-5">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">AI-Powered Workout Experience</span>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            เริ่มออกกำลังกาย
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            ออกกำลังกายอย่างชาญฉลาดกับ AI Coach ที่วิเคราะห์ท่าทางแบบ Real-time
          </p>
        </div>

        {/* AI Features Banner */}
        <div className="bg-gradient-to-r from-primary/5 via-orange-400/5 to-primary/5 rounded-3xl p-6 mb-8 border border-primary/10 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-8 md:gap-16 text-center">
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-400/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <span className="text-sm font-medium">Pose Detection</span>
              <span className="text-xs text-muted-foreground">ตรวจจับท่าทาง</span>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-400/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <span className="text-sm font-medium">AI Coaching</span>
              <span className="text-xs text-muted-foreground">โค้ชอัจฉริยะ</span>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-400/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <span className="text-sm font-medium">Real-time</span>
              <span className="text-xs text-muted-foreground">วิเคราะห์ทันที</span>
            </div>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-400/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Activity className="w-7 h-7 text-primary" />
              </div>
              <span className="text-sm font-medium">Rep Counter</span>
              <span className="text-xs text-muted-foreground">นับรอบอัตโนมัติ</span>
            </div>
          </div>
        </div>

      {/* Desktop Mode Selection */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Workout on Computer */}
        <button
          onClick={() => handleDesktopModeSelect('computer')}
          className={cn(
            'p-8 rounded-3xl border-2 transition-all duration-300 text-left bg-gradient-to-br from-background to-muted/30 hover:shadow-xl group',
            desktopMode === 'computer'
              ? 'border-primary bg-coral-light shadow-coral shadow-xl scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:shadow-primary/10'
          )}
        >
          <div className="flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center transition-all',
                  desktopMode === 'computer'
                    ? 'gradient-coral text-primary-foreground scale-110'
                    : 'bg-gradient-to-br from-primary/20 to-orange-400/20 text-primary group-hover:scale-110'
                )}
              >
                <Computer className="w-8 h-8" />
              </div>
              {desktopMode === 'computer' && (
                <div className="w-8 h-8 rounded-full gradient-coral flex items-center justify-center animate-bounce">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold">ออกกำลังกายบนคอมพิวเตอร์</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              ใช้คอมพิวเตอร์นี้โดยตรง พร้อม AI Coach และ Pose Detection
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Brain className="w-4 h-4" /> AI วิเคราะห์ท่าทาง
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" /> เริ่มทันที
              </span>
            </div>
          </div>
        </button>

        {/* Use as Big Screen */}
        <button
          onClick={() => handleDesktopModeSelect('bigscreen')}
          className={cn(
            'p-8 rounded-3xl border-2 transition-all duration-300 text-left bg-gradient-to-br from-background to-muted/30 hover:shadow-xl group',
            desktopMode === 'bigscreen'
              ? 'border-primary bg-coral-light shadow-coral shadow-xl scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:shadow-primary/10'
          )}
        >
          <div className="flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center transition-all',
                  desktopMode === 'bigscreen'
                    ? 'gradient-coral text-primary-foreground scale-110'
                    : 'bg-gradient-to-br from-primary/20 to-orange-400/20 text-primary group-hover:scale-110'
                )}
              >
                <Monitor className="w-8 h-8" />
              </div>
              {desktopMode === 'bigscreen' && (
                <div className="w-8 h-8 rounded-full gradient-coral flex items-center justify-center animate-bounce">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold">ใช้คอมพิวเตอร์เป็น Big Screen</h3>
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">แนะนำ</span>
            </div>
            <p className="text-muted-foreground mb-4">
              แสดงผลบนหน้าจอใหญ่ ใช้มือถือเป็น Remote ควบคุม
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Monitor className="w-4 h-4" /> จอภาพใหญ่
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Smartphone className="w-4 h-4" /> รีโมทควบคุม
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Big Screen Pairing Section */}
      {desktopMode === 'bigscreen' && (
        <div className="card-elevated p-8 mb-8 animate-fade-in border border-primary/20 bg-gradient-to-br from-background to-primary/5 rounded-3xl">
          {isCreatingSession ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">กำลังสร้าง Session...</p>
            </div>
          ) : session ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-xl">สแกน QR Code หรือกรอกรหัส</h3>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              {/* QR Code */}
              <div
                className={cn(
                  'inline-block p-6 bg-white rounded-3xl shadow-2xl mb-6 transition-all',
                  session.status === 'connected' && 'ring-4 ring-green-500 ring-offset-4'
                )}
              >
                {session.status === 'connected' ? (
                  <div className="w-[200px] h-[200px] flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center animate-pulse">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                  </div>
                ) : (
                  <QRCodeSVG
                    value={qrValue}
                    size={200}
                    level="H"
                    fgColor="#dd6e53"
                    bgColor="transparent"
                  />
                )}
              </div>

              {/* Pairing Code */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-3">หรือกรอกรหัสนี้บนมือถือ</p>
                <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary/10 to-orange-400/10 rounded-2xl border border-primary/20">
                  <Keyboard className="w-5 h-5 text-primary" />
                  <div className="text-4xl font-mono font-bold tracking-[0.3em] text-primary">
                    {session.pairingCode}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div
                className={cn(
                  'inline-flex items-center gap-3 px-6 py-3 rounded-full font-medium',
                  session.status === 'connected'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {session.status === 'connected' ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>เชื่อมต่อสำเร็จ!</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <span>รอการเชื่อมต่อจากมือถือ...</span>
                  </>
                )}
              </div>

              {ipAddress && (
                <p className="text-xs text-muted-foreground mt-6 flex items-center justify-center gap-2">
                  <Activity className="w-3 h-3" />
                  IP: {ipAddress}
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Continue Button */}
      {desktopMode === 'computer' && (
        <Button
          variant="hero"
          size="xl"
          className="w-full group text-lg"
          onClick={handleDesktopContinue}
        >
          <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
          เริ่มออกกำลังกาย
          <Dumbbell className="w-5 h-5 ml-2 group-hover:animate-bounce" />
        </Button>
      )}

      {desktopMode === 'bigscreen' && session?.status === 'connected' && (
        <Button
          variant="hero"
          size="xl"
          className="w-full group text-lg"
          onClick={() => navigate(`/workout-bigscreen?code=${session.pairingCode}`)}
        >
          <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
          เริ่มต้นใช้งาน
          <Monitor className="w-5 h-5 ml-2" />
        </Button>
      )}
      </div>
    </div>
  );
}