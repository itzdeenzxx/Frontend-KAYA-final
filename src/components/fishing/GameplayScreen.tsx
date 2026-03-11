import { useEffect, useState } from 'react';
import { PlayerProgress, FishingSession, CaughtFish, BiomeType } from '@/types/fishing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Fish, 
  Weight, 
  Package, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getRandomFishForBiome, 
  calculateFishWeight, 
  calculateFishPrice,
  getFishById,
} from '@/lib/fishingDatabase';
import { 
  getRodById, 
  getBaitById,
  calculateCatchRate,
  calculateFishingExp,
} from '@/lib/equipmentDatabase';
import { BIOME_NAMES_TH, RARITY_COLORS, RARITY_NAMES_TH } from '@/types/fishing';
import { useFishingGame } from '@/hooks/useFishingGame';

type FishingPhase = 'idle' | 'casting' | 'waiting' | 'bite' | 'pulling' | 'caught' | 'full';

export function GameplayScreen({
  player,
  session,
  onCatchFish,
  onFinish,
}: {
  player: PlayerProgress;
  session: FishingSession;
  onCatchFish: (fish: CaughtFish) => void;
  onFinish: () => void;
}) {
  const [phase, setPhase] = useState<FishingPhase>('idle');
  const [currentFish, setCurrentFish] = useState<any>(null);
  const [pullProgress, setPullProgress] = useState(0);
  const [catchAttempts, setcatchAttempts] = useState(0);

  // Get equipped items
  const equippedRod = player.equippedRod ? getRodById(player.equippedRod) : null;
  const equippedBait = player.equippedBait ? getBaitById(player.equippedBait) : null;
  const baitCount = player.equippedBait ? (player.ownedBaits[player.equippedBait] || 0) : 0;

  // Gesture detection hook (เชื่อมกับ MediaPipe เดิม)
  const {
    videoRef,
    canvasRef,
    gesture,
    isLoading: gestureLoading,
  } = useFishingGame();

  const weightProgress = (session.currentWeight / session.maxWeight) * 100;
  const isFull = session.currentWeight >= session.maxWeight;

  // Handle casting
  useEffect(() => {
    if (phase === 'idle' && gesture.isCasting && !isFull && baitCount > 0) {
      handleCast();
    }
  }, [gesture.isCasting, phase, isFull, baitCount]);

  // Handle pulling
  useEffect(() => {
    if (phase === 'pulling' && gesture.isSlapping) {
      handlePull();
    }
  }, [gesture.slapCount, phase]);

  const handleCast = () => {
    setPhase('casting');
    setTimeout(() => {
      setPhase('waiting');
      // สุ่มเวลารอ 2-5 วินาที
      const waitTime = Math.random() * 3000 + 2000;
      setTimeout(() => {
        handleFishBite();
      }, waitTime);
    }, 1000);
  };

  const handleFishBite = () => {
    // สุ่มปลา
    const fish = getRandomFishForBiome(
      session.biome,
      equippedBait?.rarityBonus || 0
    );

    if (!fish) {
      setPhase('idle');
      return;
    }

    const weight = calculateFishWeight(fish);
    const catchRate = calculateCatchRate(
      fish.catchDifficulty,
      equippedRod?.catchBonus || 0,
      equippedBait?.rarityBonus || 0
    );

    setCurrentFish({ ...fish, weight, catchRate });
    setPhase('bite');
    setPullProgress(50); // เริ่มที่ 50%
    setcatchAttempts(0);
    
    // หลัง 1 วินาที เข้าโหมดดึง
    setTimeout(() => {
      setPhase('pulling');
    }, 1000);
  };

  const handlePull = () => {
    if (!currentFish) return;

    // เพิ่ม progress ตามอัตรา catch rate
    const gainPerSlap = Math.random() * 15 + 5; // 5-20% ต่อครั้ง
    const newProgress = Math.min(100, pullProgress + gainPerSlap);
    setPullProgress(newProgress);
    setcatchAttempts(prev => prev + 1);

    // ถ้าถึง 100% จับได้
    if (newProgress >= 100) {
      handleCaught();
    }
  };

  // Decay progress (ปลาหนี)
  useEffect(() => {
    if (phase === 'pulling' && currentFish) {
      const interval = setInterval(() => {
        setPullProgress((prev) => {
          const decayRate = currentFish.catchDifficulty * 0.5; // ยิ่งยากยิ่งหนีเร็ว
          const newProgress = Math.max(0, prev - decayRate);
          
          // ถ้าลดลงเหลือ 0 ปลาหนี
          if (newProgress <= 0) {
            setPhase('idle');
            setCurrentFish(null);
            return 0;
          }
          
          return newProgress;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [phase, currentFish]);

  const handleCaught = () => {
    if (!currentFish) return;

    const caughtFish: CaughtFish = {
      fishId: currentFish.id,
      weight: currentFish.weight,
      caughtAt: new Date(),
      biome: session.biome,
      sellPrice: calculateFishPrice(currentFish, currentFish.weight),
    };

    onCatchFish(caughtFish);
    setPhase('caught');
    setTimeout(() => {
      setPhase('idle');
      setCurrentFish(null);
      setPullProgress(0);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-blue-300 to-blue-400 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-9xl opacity-10">🎣</div>
        <div className="absolute top-40 right-20 text-8xl opacity-10">🐟</div>
        <div className="absolute bottom-20 left-1/4 text-7xl opacity-10">🌊</div>
      </div>

      {/* Video & Canvas for gesture detection - Top Right Corner */}
      <div className="absolute right-2 sm:right-4 top-24 sm:top-28 z-20">
        <div className="relative w-32 h-24 sm:w-40 sm:h-30 md:w-48 md:h-36 lg:w-56 lg:h-42 rounded-lg sm:rounded-xl overflow-hidden border-2 sm:border-4 border-white/30 shadow-xl sm:shadow-2xl bg-black/50">
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
          />
          {/* Skeleton overlay canvas */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Camera label */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] sm:text-xs text-center py-0.5 sm:py-1 hidden sm:block">
            📷 กล้องของคุณ
          </div>
        </div>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 p-6">
        {/* Top Bar */}
        <div className="flex justify-between items-start mb-6">
          {/* Session Info */}
          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {BIOME_NAMES_TH[session.biome]}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    ปลาที่จับได้: <strong>{session.caughtFish.length}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Fish className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    เหยื่อคงเหลือ: <strong>{baitCount}</strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weight Bar */}
          <Card className={cn(
            'bg-white/95 backdrop-blur w-80 relative z-30',
            isFull && 'ring-4 ring-red-500'
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Weight className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    น้ำหนักเรือ
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-800">
                  {session.currentWeight.toFixed(1)} / {session.maxWeight} kg
                </span>
              </div>
              <Progress value={weightProgress} className="h-3" />
              {isFull && (
                <p className="text-xs text-red-600 mt-1 font-semibold flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  เรือเต็มแล้ว! กดจบเพื่อขายปลา
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center - Fishing Action */}
        <div className="flex items-center justify-center min-h-[60vh]">
          {phase === 'idle' && (
            <Card className="bg-white/95 backdrop-blur shadow-2xl max-w-md">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🎣</div>
                {isFull ? (
                  <>
                    <h2 className="text-3xl font-bold text-red-600 mb-4">
                      เรือเต็มแล้ว!
                    </h2>
                    <p className="text-gray-700 mb-6">
                      ไม่สามารถตกปลาต่อได้ กดปุ่มจบเพื่อขายปลา
                    </p>
                  </>
                ) : baitCount <= 0 ? (
                  <>
                    <h2 className="text-3xl font-bold text-orange-600 mb-4">
                      เหยื่อหมดแล้ว!
                    </h2>
                    <p className="text-gray-700 mb-6">
                      กลับไปซื้อเหยื่อเพิ่ม
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-blue-600 mb-4">
                      ขว้างเบ็ด!
                    </h2>
                    <p className="text-gray-700 mb-6">
                      โยกมือขึ้นเพื่อขว้างเบ็ดลงน้ำ
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {phase === 'casting' && (
            <Card className="bg-white/95 backdrop-blur shadow-2xl max-w-md">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4 animate-bounce">🎣</div>
                <h2 className="text-3xl font-bold text-blue-600">
                  กำลังขว้าง...
                </h2>
              </CardContent>
            </Card>
          )}

          {phase === 'waiting' && (
            <Card className="bg-white/95 backdrop-blur shadow-2xl max-w-md">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🌊</div>
                <h2 className="text-3xl font-bold text-blue-600 mb-2">
                  รอปลาติด...
                </h2>
                <div className="flex justify-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </CardContent>
            </Card>
          )}

          {phase === 'bite' && currentFish && (
            <Card className="bg-white/95 backdrop-blur shadow-2xl max-w-md animate-pulse">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">{currentFish.emoji}</div>
                <h2 className="text-3xl font-bold text-red-600 mb-2">
                  ปลาติดเบ็ด!
                </h2>
                <p className="text-xl text-gray-700">
                  {currentFish.nameTh}
                </p>
              </CardContent>
            </Card>
          )}

          {phase === 'pulling' && currentFish && (
            <Card className="bg-white/95 backdrop-blur shadow-2xl max-w-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{currentFish.emoji}</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {currentFish.nameTh}
                  </h2>
                  <span
                    className="text-sm px-3 py-1 rounded-full font-bold"
                    style={{
                      backgroundColor: RARITY_COLORS[currentFish.rarity] + '20',
                      color: RARITY_COLORS[currentFish.rarity],
                    }}
                  >
                    {RARITY_NAMES_TH[currentFish.rarity]}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      ความคืบหน้า
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {pullProgress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={pullProgress} 
                    className="h-4"
                  />
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center">
                  <p className="text-lg font-bold text-yellow-800">
                    👋 ตบมือลงเพื่อดึงปลา!
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    ต้องตบ: {catchAttempts} ครั้ง
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {phase === 'caught' && currentFish && (
            <Card className="bg-gradient-to-br from-green-400 to-blue-500 shadow-2xl max-w-md animate-bounce">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">{currentFish.emoji}</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  🎉 จับได้แล้ว!
                </h2>
                <p className="text-xl text-white font-semibold">
                  {currentFish.nameTh}
                </p>
                <p className="text-2xl text-white font-bold mt-2">
                  {currentFish.weight.toFixed(2)} kg
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
          <Button
            size="lg"
            className="h-16 px-8 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-2xl"
            onClick={onFinish}
          >
            <CheckCircle className="mr-2 h-6 w-6" />
            จบและขายปลา
          </Button>
        </div>
      </div>
    </div>
  );
}
