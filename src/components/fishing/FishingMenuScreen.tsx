import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasFishingProgress } from '@/lib/fishingFirestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Play, PlayCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CloudIcon, SunIcon, TreeIcon, DockIcon, BoatIcon, FishIcon,
  TropicalFishIcon, FishermanIcon, FishingRodIcon, SharkIcon,
  OctopusIcon, CrabIcon, StarFilledIcon, ChartIcon, WarningIcon,
  NewBadgeIcon,
} from './FishingIcons';

export function FishingMenuScreen({
  onNewGame,
  onContinue,
  onBack,
}: {
  onNewGame: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const { lineProfile } = useAuth();
  const [hasProgress, setHasProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkProgress() {
      if (lineProfile) {
        const progress = await hasFishingProgress(lineProfile.userId);
        setHasProgress(progress);
      }
      setIsLoading(false);
    }
    checkProgress();
  }, [lineProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-cyan-300 to-blue-400 relative overflow-hidden">
      {/* Sky & Background */}
      <div className="absolute inset-0">
        {/* Clouds */}
        <div className="absolute top-10 left-10 opacity-80 animate-float"><CloudIcon className="w-24 h-16" /></div>
        <div className="absolute top-20 right-20 opacity-70 animate-float-slow"><CloudIcon className="w-20 h-14" /></div>
        <div className="absolute top-32 left-1/3 opacity-60 animate-float-delayed"><CloudIcon className="w-28 h-18" /></div>
        
        {/* Sun */}
        <div className="absolute top-10 right-10 animate-spin-slow"><SunIcon className="w-24 h-24" /></div>
        
        {/* Trees - Left Side */}
        <div className="absolute bottom-32 left-0 opacity-90"><TreeIcon className="w-28 h-36" /></div>
        <div className="absolute bottom-28 left-16 opacity-80"><TreeIcon className="w-24 h-32" /></div>
        <div className="absolute bottom-36 left-8 opacity-70"><TreeIcon className="w-20 h-28" /></div>
        
        {/* Trees - Right Side */}
        <div className="absolute bottom-32 right-0 opacity-90"><TreeIcon className="w-28 h-36" /></div>
        <div className="absolute bottom-28 right-16 opacity-80"><TreeIcon className="w-24 h-32" /></div>
        <div className="absolute bottom-36 right-8 opacity-70"><TreeIcon className="w-20 h-28" /></div>
        
        {/* Water Surface */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-400/60 via-blue-500/70 to-blue-600/80" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-600/40 to-transparent animate-wave" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-500/30 to-transparent animate-wave-slow" />
        
        {/* Dock/Pier */}
        <div className="absolute bottom-48 left-1/4 opacity-90"><DockIcon className="w-20 h-16" /></div>
        
        {/* Boat */}
        <div className="absolute bottom-40 right-1/4 animate-bob"><BoatIcon className="w-24 h-18" /></div>
        
        {/* Jumping Fish */}
        <div className="absolute bottom-64 left-1/3 animate-jump"><FishIcon className="w-20 h-14" /></div>
        <div className="absolute bottom-60 right-1/3 animate-jump-delayed"><TropicalFishIcon className="w-16 h-12" /></div>
        
        {/* Fisherman Character */}
        <div className="absolute bottom-52 left-20 animate-wave-hand"><FishermanIcon className="w-20 h-28" /></div>
        
        {/* Fishing Rod */}
        <div className="absolute bottom-60 left-32 transform rotate-45 animate-fishing"><FishingRodIcon className="w-20 h-20" /></div>
        
        {/* Ripples in water */}
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2">
          <div className="w-32 h-32 rounded-full border-4 border-white/30 animate-ripple" />
          <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-white/20 animate-ripple-delayed" />
        </div>
        
        {/* Bubbles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/30 animate-bubble"
            style={{
              width: `${Math.random() * 20 + 10}px`,
              height: `${Math.random() * 20 + 10}px`,
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 40}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 4}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mb-4 animate-bounce-slow flex justify-center"><FishingRodIcon className="w-20 h-20" /></div>
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl mb-2">
            Fishing Legend
          </h1>
          <p className="text-lg md:text-xl text-white/90 drop-shadow-lg font-semibold">
            ตำนานนักตกปลา - ผจญภัยในทะเลสาบมหัศจรรย์!
          </p>
        </div>

        {/* Menu Card */}
        <Card className="w-full max-w-md bg-gradient-to-br from-white via-blue-50 to-cyan-50 backdrop-blur-sm shadow-2xl border-4 border-blue-200 animate-slide-up">
          <CardContent className="p-8">
            {/* Decorative Fish Icons */}
            <div className="flex justify-between items-center mb-6">
              <span className="animate-bounce-slow inline-block"><FishIcon className="w-12 h-8" /></span>
              <span className="inline-block"><FishingRodIcon className="w-10 h-10" /></span>
              <span className="animate-bounce-slow inline-block" style={{ animationDelay: '0.5s' }}><TropicalFishIcon className="w-12 h-8" /></span>
            </div>

            <div className="space-y-4">
              {/* New Game Button */}
              <Button
                size="lg"
                className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 hover:from-blue-600 hover:via-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-300"
                onClick={onNewGame}
              >
                <PlayCircle className="mr-3 h-8 w-8" />
                <div className="text-left">
                  <div>เริ่มเกมใหม่</div>
                  <div className="text-sm font-normal opacity-90 flex items-center gap-1"><StarFilledIcon className="w-4 h-4 inline" /> เริ่มต้นผจญภัย</div>
                </div>
              </Button>

              {/* Continue Button */}
              <Button
                size="lg"
                className={cn(
                  'w-full h-20 text-2xl font-bold shadow-lg transition-all duration-300 border-2',
                  hasProgress
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 hover:shadow-2xl transform hover:scale-105 border-green-300'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                )}
                onClick={hasProgress ? onContinue : undefined}
                disabled={!hasProgress || isLoading}
              >
                {!hasProgress && <Lock className="mr-3 h-8 w-8" />}
                {hasProgress && <Play className="mr-3 h-8 w-8" />}
                <div className="text-left">
                  <div>{isLoading ? 'กำลังโหลด...' : 'เล่นต่อ'}</div>
                  {hasProgress && !isLoading && (
                    <div className="text-sm font-normal opacity-90 flex items-center gap-1"><ChartIcon className="w-4 h-4 inline" /> ข้อมูลของคุณ</div>
                  )}
                </div>
              </Button>

              {!hasProgress && !isLoading && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-800 font-semibold flex items-center justify-center gap-1">
                    <WarningIcon className="w-4 h-4 inline" /> คุณยังไม่เคยเล่นเกมนี้มาก่อน
                  </p>
                </div>
              )}

              {/* Back Button */}
              <Button
                size="lg"
                className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-500"
                onClick={onBack}
              >
                <ArrowLeft className="mr-2 h-6 w-6" />
                กลับไปหน้าเลือกเกม
              </Button>
            </div>

            {/* User Info */}
            {lineProfile && (
              <div className="mt-6 pt-6 border-t-2 border-blue-200">
                <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border-2 border-blue-200">
                  {lineProfile.pictureUrl && (
                    <img
                      src={lineProfile.pictureUrl}
                      alt={lineProfile.displayName || 'User'}
                      className="w-16 h-16 rounded-full border-4 border-blue-400 shadow-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-800">
                      {lineProfile.displayName || 'Player'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={cn(
                        "text-sm px-3 py-1 rounded-full font-semibold",
                        hasProgress 
                          ? "bg-green-100 text-green-700 border-2 border-green-300" 
                          : "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                      )}>
                        {hasProgress ? <><StarFilledIcon className="w-4 h-4 inline mr-1" />มีข้อมูลการเล่น</> : <><NewBadgeIcon className="w-6 h-4 inline mr-1" />ผู้เล่นใหม่</>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer with decorative fish */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-4 mb-3">
            <span className="animate-bounce-slow inline-block"><SharkIcon className="w-12 h-8" /></span>
            <span className="animate-bounce-slow inline-block" style={{ animationDelay: '0.3s' }}><OctopusIcon className="w-10 h-10" /></span>
            <span className="animate-bounce-slow inline-block" style={{ animationDelay: '0.6s' }}><CrabIcon className="w-10 h-8" /></span>
          </div>
          <p className="text-sm text-white/80 font-semibold drop-shadow-lg">
            v1.0.0 | © 2026 KAYA Fishing Legend
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes wave-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes bubble {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) scale(0.5);
            opacity: 0;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -10px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, -8px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(10px, -15px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes jump {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-60px) rotate(-15deg); }
          50% { transform: translateY(-80px) rotate(0deg); }
          75% { transform: translateY(-60px) rotate(15deg); }
        }
        @keyframes jump-delayed {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-50px) rotate(15deg); }
          50% { transform: translateY(-70px) rotate(0deg); }
          75% { transform: translateY(-50px) rotate(-15deg); }
        }
        @keyframes wave-hand {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(10deg); }
        }
        @keyframes fishing {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(50deg) translateY(-5px); }
        }
        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        @keyframes ripple-delayed {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-wave {
          animation: wave 3s ease-in-out infinite;
        }
        .animate-wave-slow {
          animation: wave-slow 4s ease-in-out infinite;
        }
        .animate-bubble {
          animation: bubble linear infinite;
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 12s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-bob {
          animation: bob 3s ease-in-out infinite;
        }
        .animate-jump {
          animation: jump 4s ease-in-out infinite;
        }
        .animate-jump-delayed {
          animation: jump-delayed 5s ease-in-out infinite 1s;
        }
        .animate-wave-hand {
          animation: wave-hand 2s ease-in-out infinite;
        }
        .animate-fishing {
          animation: fishing 2.5s ease-in-out infinite;
        }
        .animate-ripple {
          animation: ripple 2s ease-out infinite;
        }
        .animate-ripple-delayed {
          animation: ripple-delayed 2s ease-out infinite 1s;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
