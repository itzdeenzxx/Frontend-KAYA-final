import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone, Monitor, ArrowLeft, Check, Computer, Tv, QrCode, Keyboard } from 'lucide-react';
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
      <div className="min-h-screen bg-background px-6 pt-12 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">เริ่มออกกำลังกาย</h1>
            <p className="text-muted-foreground">เลือกรูปแบบที่ต้องการ</p>
          </div>
        </div>

        {/* Mobile Mode Selection */}
        <div className="space-y-4 mb-8">
          {/* Workout on Mobile */}
          <button
            onClick={() => navigate('/workout')}
            className="w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left border-border hover:border-primary/50"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-muted text-muted-foreground">
                <Smartphone className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">ออกกำลังกายบนมือถือ</h3>
                <p className="text-muted-foreground text-sm">
                  ใช้มือถือโดยตรงพร้อม AI Coach
                </p>
              </div>
            </div>
          </button>

          {/* Connect to Big Screen */}
          <button
            onClick={() => setMobileMode('remote')}
            className={cn(
              'w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left',
              mobileMode === 'remote'
                ? 'border-primary bg-coral-light shadow-coral'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center transition-colors',
                  mobileMode === 'remote'
                    ? 'gradient-coral text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Tv className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">เชื่อมต่อกับ Big Screen</h3>
                <p className="text-muted-foreground text-sm">
                  ใช้มือถือเป็น Remote ควบคุมหน้าจอใหญ่
                </p>
              </div>
              {mobileMode === 'remote' && (
                <div className="w-6 h-6 rounded-full gradient-coral flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Pairing Options for Mobile */}
        {mobileMode === 'remote' && (
          <div className="card-elevated p-5 mb-8 animate-fade-in">
            <h3 className="font-medium mb-4">เลือกวิธีเชื่อมต่อ</h3>

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
                    'p-4 rounded-xl border-2 transition-all',
                    pairingMethod === 'qr'
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
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
                  'p-4 rounded-xl border-2 transition-all',
                  pairingMethod === 'code'
                    ? 'border-primary bg-primary/10'
                    : 'border-border',
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
                    className="text-center text-2xl font-mono tracking-widest h-14"
                  />
                </div>

                {connectionError && (
                  <p className="text-destructive text-sm text-center">{connectionError}</p>
                )}

                <Button
                  variant="hero"
                  className="w-full"
                  onClick={() => handleConnect()}
                  disabled={isConnecting || pairingCode.length !== 5}
                >
                  {isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render Desktop View
  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">เริ่มออกกำลังกาย</h1>
          <p className="text-muted-foreground">เลือกรูปแบบการใช้งาน</p>
        </div>
      </div>

      {/* Desktop Mode Selection */}
      <div className="space-y-4 mb-8">
        {/* Workout on Computer */}
        <button
          onClick={() => handleDesktopModeSelect('computer')}
          className={cn(
            'w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left',
            desktopMode === 'computer'
              ? 'border-primary bg-coral-light shadow-coral'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center transition-colors',
                desktopMode === 'computer'
                  ? 'gradient-coral text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Computer className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">ออกกำลังกายบนคอมพิวเตอร์</h3>
              <p className="text-muted-foreground text-sm">
                ใช้คอมพิวเตอร์นี้โดยตรง พร้อม AI Coach และ Pose Detection
              </p>
            </div>
            {desktopMode === 'computer' && (
              <div className="w-6 h-6 rounded-full gradient-coral flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        </button>

        {/* Use as Big Screen */}
        <button
          onClick={() => handleDesktopModeSelect('bigscreen')}
          className={cn(
            'w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left',
            desktopMode === 'bigscreen'
              ? 'border-primary bg-coral-light shadow-coral'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center transition-colors',
                desktopMode === 'bigscreen'
                  ? 'gradient-coral text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Monitor className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">ใช้คอมพิวเตอร์เป็น Big Screen</h3>
              <p className="text-muted-foreground text-sm">
                แสดงผลบนหน้าจอใหญ่ ใช้มือถือเป็น Remote ควบคุม
              </p>
            </div>
            {desktopMode === 'bigscreen' && (
              <div className="w-6 h-6 rounded-full gradient-coral flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Big Screen Pairing Section */}
      {desktopMode === 'bigscreen' && (
        <div className="card-elevated p-6 mb-8 animate-fade-in">
          {isCreatingSession ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">กำลังสร้าง Session...</p>
            </div>
          ) : session ? (
            <div className="text-center">
              <h3 className="font-semibold mb-4">สแกน QR Code หรือกรอกรหัส</h3>

              {/* QR Code */}
              <div
                className={cn(
                  'inline-block p-4 bg-white rounded-2xl shadow-lg mb-4',
                  session.status === 'connected' && 'ring-4 ring-green-500'
                )}
              >
                {session.status === 'connected' ? (
                  <div className="w-[180px] h-[180px] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <QRCodeSVG
                    value={qrValue}
                    size={180}
                    level="H"
                    fgColor="#dd6e53"
                    bgColor="transparent"
                  />
                )}
              </div>

              {/* Pairing Code */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">หรือกรอกรหัส</p>
                <div className="text-4xl font-mono font-bold tracking-widest text-primary">
                  {session.pairingCode}
                </div>
              </div>

              {/* Status */}
              <div
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full',
                  session.status === 'connected'
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {session.status === 'connected' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>เชื่อมต่อแล้ว!</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <span>รอการเชื่อมต่อ...</span>
                  </>
                )}
              </div>

              {ipAddress && (
                <p className="text-xs text-muted-foreground mt-4">IP: {ipAddress}</p>
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
          className="w-full"
          onClick={handleDesktopContinue}
        >
          เริ่มออกกำลังกาย
        </Button>
      )}

      {desktopMode === 'bigscreen' && session?.status === 'connected' && (
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={() => navigate(`/workout-bigscreen?code=${session.pairingCode}`)}
        >
          เริ่มต้นใช้งาน
        </Button>
      )}
    </div>
  );
}