import { PlayerProgress } from '@/types/fishing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Coins, 
  ShoppingBag, 
  Trophy,
  Fish,
  ArrowLeft,
  Award,
} from 'lucide-react';
import { getRodById, getBaitById, getBoatById } from '@/lib/equipmentDatabase';
import { RARITY_COLORS, RARITY_NAMES_TH } from '@/types/fishing';

export function MainHubScreen({
  player,
  onStartFishing,
  onOpenShop,
  onBack,
}: {
  player: PlayerProgress;
  onStartFishing: () => void;
  onOpenShop: () => void;
  onOpenInventory?: () => void;
  onBack?: () => void;
}) {
  const equippedRod = player.equippedRod ? getRodById(player.equippedRod) : null;
  const equippedBait = player.equippedBait ? getBaitById(player.equippedBait) : null;
  const equippedBoat = player.equippedBoat ? getBoatById(player.equippedBoat) : null;

  const expProgress = (player.exp / player.expToNextLevel) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-sky-300 via-cyan-400 to-blue-500">
      {/* Ocean Background */}
      <div className="absolute inset-0">
        {/* Sky with clouds */}
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-sky-200 via-sky-300 to-transparent">
          <div className="absolute top-8 left-20 text-5xl opacity-50 animate-float">☁️</div>
          <div className="absolute top-12 right-32 text-4xl opacity-40 animate-float-slow">☁️</div>
          <div className="absolute top-20 left-1/3 text-6xl opacity-30 animate-float">☁️</div>
        </div>

        {/* Ocean gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-600 opacity-80" />
        
        {/* Underwater rocks and coral */}
        <div className="absolute bottom-32 left-1/4 text-6xl opacity-30 animate-float-slow">🪨</div>
        <div className="absolute bottom-40 right-1/3 text-5xl opacity-25 animate-float">🪸</div>
        <div className="absolute bottom-48 left-1/3 text-4xl opacity-20">🪨</div>
        
        {/* Swimming fish */}
        <div className="absolute top-1/3 left-1/4 text-4xl opacity-40 animate-swim">🐟</div>
        <div className="absolute top-1/2 right-1/4 text-3xl opacity-35 animate-swim-reverse">🐠</div>
        <div className="absolute bottom-1/2 left-1/3 text-5xl opacity-30 animate-swim-slow">🐡</div>
        <div className="absolute top-2/3 right-1/3 text-4xl opacity-40 animate-swim">🦈</div>
        <div className="absolute bottom-2/3 left-2/3 text-3xl opacity-35 -scale-x-100 animate-swim-reverse">🐟</div>
        <div className="absolute top-1/2 left-1/2 text-2xl opacity-25 animate-swim-slow">🐠</div>
        
        {/* Rocks on sides */}
        <div className="absolute bottom-0 left-0 text-9xl opacity-60">🪨</div>
        <div className="absolute bottom-16 left-16 text-7xl opacity-50">🪨</div>
        <div className="absolute bottom-8 left-8 text-5xl opacity-40">🪨</div>
        <div className="absolute bottom-0 right-0 text-9xl opacity-60">🪨</div>
        <div className="absolute bottom-12 right-20 text-8xl opacity-50">🪨</div>
        <div className="absolute bottom-6 right-12 text-6xl opacity-45">🪨</div>
        
        {/* Beach/Sand elements */}
        <div className="absolute bottom-0 left-1/4 text-4xl opacity-40">🏖️</div>
        <div className="absolute bottom-4 right-1/3 text-3xl opacity-35">🐚</div>
        <div className="absolute bottom-8 left-1/3 text-3xl opacity-30">⭐</div>
        
        {/* Wooden pier/dock on left */}
        <div className="absolute bottom-0 left-0 ml-32 mb-20 flex flex-col items-center space-y-1">
          <div className="text-5xl opacity-50">🪵</div>
          <div className="text-5xl opacity-50">🪵</div>
          <div className="text-5xl opacity-50">🪵</div>
          <div className="text-5xl opacity-50">🪵</div>
        </div>
        
        {/* Palm trees on sides */}
        <div className="absolute bottom-32 left-4 text-7xl opacity-50">🌴</div>
        <div className="absolute bottom-28 right-4 text-8xl opacity-55">🌴</div>
        <div className="absolute bottom-36 left-24 text-6xl opacity-40">🌳</div>
        
        {/* Water waves */}
        <div className="absolute bottom-1/4 left-1/4 text-3xl opacity-20 animate-wave">🌊</div>
        <div className="absolute bottom-1/3 right-1/4 text-3xl opacity-25 animate-wave">🌊</div>
        <div className="absolute bottom-1/2 left-1/2 text-2xl opacity-15 animate-wave">🌊</div>
        
        {/* Fishing boat */}
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 text-8xl animate-bob">🚢</div>
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 translate-y-8 text-5xl rotate-45 animate-fishing">🎣</div>
        
        {/* Seagulls */}
        <div className="absolute top-1/4 left-1/4 text-3xl opacity-50 animate-float">🦜</div>
        <div className="absolute top-1/3 right-1/3 text-2xl opacity-40 animate-float-slow">🦜</div>
      </div>

      {/* Top Stats Bar */}
      <div className="relative z-30 px-4 py-3 bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-md border-b-2 border-yellow-500/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          {/* Player Info */}
          <div className="flex items-center space-x-3">
            {player.photoURL && (
              <img
                src={player.photoURL}
                alt={player.displayName}
                className="w-12 h-12 rounded-full border-2 border-yellow-500"
              />
            )}
            <div>
              <p className="text-white font-bold text-base sm:text-lg">{player.displayName}</p>
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm">Level {player.level}</span>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="flex items-center gap-3">
            {/* Coins */}
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-3 sm:px-4 py-2 rounded-lg border-2 border-yellow-400 shadow-lg flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-900" />
              <span className="text-white font-bold text-sm sm:text-lg">{player.coins.toLocaleString()}</span>
            </div>

            {/* Fish Caught */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-3 sm:px-4 py-2 rounded-lg border-2 border-cyan-400 shadow-lg flex items-center space-x-2">
              <Fish className="h-5 w-5 text-white" />
              <span className="text-white font-bold text-sm sm:text-lg">{player.totalFishCaught}</span>
            </div>

            {/* EXP */}
            <div className="bg-gradient-to-r from-green-600 to-lime-500 px-3 sm:px-4 py-2 rounded-lg border-2 border-green-400 shadow-lg flex items-center space-x-2">
              <Award className="h-5 w-5 text-white" />
              <span className="text-white font-bold text-sm sm:text-lg">{player.exp.toLocaleString()} EXP</span>
            </div>
          </div>
        </div>

        {/* EXP Bar */}
        <div className="max-w-7xl mx-auto mt-2">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-lime-400 to-yellow-500 transition-all duration-500"
              style={{ width: `${expProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-[calc(100vh-100px)] flex">
        {/* Left Sidebar */}
        <div className="w-24 sm:w-32 bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-sm border-r-2 border-gray-700 flex flex-col items-center py-6 space-y-4">
          {/* Shop */}
          <button 
            onClick={onOpenShop}
            className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-xl border-2 sm:border-3 border-green-400 shadow-xl flex flex-col items-center justify-center transition-all hover:scale-110"
          >
            <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-white mb-1" />
            <span className="text-white text-xs font-bold">SHOP</span>
          </button>

          {/* Back */}
          {onBack && (
            <button 
              onClick={onBack}
              className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded-xl border-2 sm:border-3 border-gray-500 shadow-xl flex flex-col items-center justify-center transition-all hover:scale-110 mt-auto"
            >
              <ArrowLeft className="h-6 w-6 sm:h-8 sm:w-8 text-white mb-1" />
              <span className="text-white text-xs font-bold">Menu</span>
            </button>
          )}
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-end pb-8 px-4">
          {/* Bottom CAST Button */}
          <Button
            onClick={onStartFishing}
            className="h-20 sm:h-24 px-12 sm:px-16 text-3xl sm:text-4xl font-black bg-gradient-to-r from-green-600 via-lime-500 to-green-600 hover:from-green-500 hover:via-lime-400 hover:to-green-500 shadow-2xl border-4 border-green-400 rounded-2xl transform hover:scale-110 transition-all duration-300"
          >
            CAST
          </Button>
        </div>

        {/* Right Side - Equipped Items Card */}
        <div className="absolute bottom-6 right-6 w-72 sm:w-80 z-30 hidden md:block">
          <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg border-4 border-yellow-500 shadow-2xl">
            <CardContent className="p-4 sm:p-6">
              {/* Equipped Rod */}
              {equippedRod && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-yellow-400 font-bold text-xs sm:text-sm">EQUIPPED</span>
                    <span
                      className="text-xs px-2 sm:px-3 py-1 rounded-full font-bold border-2"
                      style={{
                        backgroundColor: RARITY_COLORS[equippedRod.rarity] + '40',
                        color: RARITY_COLORS[equippedRod.rarity],
                        borderColor: RARITY_COLORS[equippedRod.rarity],
                      }}
                    >
                      {RARITY_NAMES_TH[equippedRod.rarity].toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-3 sm:p-4 border-2 border-blue-500/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="text-4xl sm:text-5xl">🎣</div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-base sm:text-lg">{equippedRod.nameTh}</p>
                        <p className="text-cyan-300 text-xs sm:text-sm">คันเบ็ด</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-xs sm:text-sm">โอกาสจับได้</span>
                        <span className="text-green-400 font-bold text-sm">+{equippedRod.catchBonus}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-blue-900/50 rounded-lg p-2 sm:p-3 border border-blue-500/30">
                  <p className="text-gray-400 text-xs">เหยื่อ</p>
                  <p className="text-white font-bold text-sm sm:text-lg">
                    {equippedBait ? `x${player.ownedBaits[equippedBait.id] || 0}` : '-'}
                  </p>
                </div>
                <div className="bg-purple-900/50 rounded-lg p-2 sm:p-3 border border-purple-500/30">
                  <p className="text-gray-400 text-xs">เรือ</p>
                  <p className="text-white font-bold text-sm sm:text-lg">
                    {equippedBoat ? `${equippedBoat.capacity}kg` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -10px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, -8px); }
        }
        @keyframes bob {
          0%, 100% { transform: translate(-50%, 0) rotate(-2deg); }
          50% { transform: translate(-50%, -15px) rotate(2deg); }
        }
        @keyframes fishing {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(50deg) translateY(-8px); }
        }
        @keyframes swim {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(30px) translateY(-15px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes swim-reverse {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-30px) translateY(15px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes swim-slow {
          0% { transform: translateX(0) translateY(0) rotate(0deg); }
          25% { transform: translateX(20px) translateY(-10px) rotate(5deg); }
          50% { transform: translateX(40px) translateY(0) rotate(0deg); }
          75% { transform: translateX(20px) translateY(10px) rotate(-5deg); }
          100% { transform: translateX(0) translateY(0) rotate(0deg); }
        }
        @keyframes wave {
          0%, 100% { transform: translateX(0) scale(1); opacity: 0.15; }
          50% { transform: translateX(-20px) scale(1.2); opacity: 0.25; }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-bob {
          animation: bob 4s ease-in-out infinite;
        }
        .animate-fishing {
          animation: fishing 2s ease-in-out infinite;
        }
        .animate-swim {
          animation: swim 6s ease-in-out infinite;
        }
        .animate-swim-reverse {
          animation: swim-reverse 7s ease-in-out infinite;
        }
        .animate-swim-slow {
          animation: swim-slow 10s ease-in-out infinite;
        }
        .animate-wave {
          animation: wave 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
