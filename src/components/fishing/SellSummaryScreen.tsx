import { FishingSession } from '@/types/fishing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Coins, 
  TrendingUp, 
  Weight,
  X,
} from 'lucide-react';
import { getFishById } from '@/lib/fishingDatabase';
import { calculateFishingExp } from '@/lib/equipmentDatabase';
import { RARITY_COLORS, RARITY_NAMES_TH } from '@/types/fishing';

export function SellSummaryScreen({
  session,
  onBackToHub,
}: {
  session: FishingSession;
  onBackToHub: () => void;
}) {
  const totalEarnings = session.caughtFish.reduce(
    (sum, fish) => sum + fish.sellPrice,
    0
  );

  const totalWeight = session.caughtFish.reduce(
    (sum, fish) => sum + fish.weight,
    0
  );

  const totalExp = session.caughtFish.reduce((sum, caught) => {
    const fish = getFishById(caught.fishId);
    return sum + (fish ? calculateFishingExp(fish.rarity, caught.weight) : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-800 via-teal-700 to-cyan-900 relative overflow-hidden">
      {/* Close Button */}
      <button
        onClick={onBackToHub}
        className="absolute top-6 right-6 z-50 w-12 h-12 bg-cyan-500 hover:bg-cyan-400 rounded-full border-4 border-cyan-300 shadow-xl flex items-center justify-center transition-all hover:scale-110"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-9xl">📦</div>
        <div className="absolute bottom-10 right-10 text-8xl">🎁</div>
      </div>

      <div className="relative z-10 py-12 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-7xl mb-4 animate-bounce-slow">📦</div>
          <h1 className="text-5xl sm:text-6xl font-black text-white drop-shadow-2xl mb-2 tracking-wide">
            สรุปการตกปลา
          </h1>
          <p className="text-2xl text-cyan-200 font-bold">SUMMARY:</p>
        </div>

        {/* Reward Section */}
        <div className="mb-10">
          <h2 className="text-4xl sm:text-5xl font-black text-center text-white mb-8 drop-shadow-lg">
            REWARD
          </h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            {/* COINS */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-4 border-gray-700 p-6 shadow-2xl hover:scale-105 transition-transform">
              <div className="text-center">
                <p className="text-white font-bold text-lg mb-4">COINS</p>
                <div className="text-7xl mb-4">💰</div>
                <p className="text-white font-black text-2xl">x {totalEarnings}</p>
              </div>
            </div>

            {/* WEIGHT */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-4 border-gray-700 p-6 shadow-2xl hover:scale-105 transition-transform">
              <div className="text-center">
                <p className="text-white font-bold text-lg mb-4">WEIGHT</p>
                <div className="mb-4">
                  <Weight className="h-16 w-16 text-blue-400 mx-auto" />
                </div>
                <p className="text-white font-black text-2xl">{totalWeight.toFixed(1)} kg</p>
              </div>
            </div>

            {/* EXP */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-4 border-gray-700 p-6 shadow-2xl hover:scale-105 transition-transform">
              <div className="text-center">
                <p className="text-white font-bold text-lg mb-4">EXP</p>
                <div className="text-7xl mb-4">⚡</div>
                <p className="text-white font-black text-2xl">+{totalExp}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fish Cards */}
        {session.caughtFish.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {session.caughtFish.map((caught, index) => {
                const fish = getFishById(caught.fishId);
                if (!fish) return null;

                const borderColor = RARITY_COLORS[fish.rarity];
                const rarityName = RARITY_NAMES_TH[fish.rarity].toUpperCase();

                return (
                  <div
                    key={index}
                    className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl hover:scale-105 transition-transform"
                    style={{
                      border: `4px solid ${borderColor}`,
                      boxShadow: `0 0 20px ${borderColor}40`,
                    }}
                  >
                    {/* NEW Badge */}
                    {index < 2 && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-md z-10">
                        NEW
                      </div>
                    )}

                    {/* Location Badge */}
                    <div 
                      className="text-white text-xs font-bold px-3 py-2 text-center"
                      style={{ backgroundColor: borderColor }}
                    >
                      {fish.biome.toUpperCase()}
                    </div>

                    {/* Fish Image */}
                    <div className="py-6 px-4 bg-gradient-to-b from-gray-700 to-gray-800">
                      <div className="text-7xl text-center mb-2">{fish.emoji}</div>
                      <p className="text-white font-bold text-center text-sm mb-1">
                        {fish.nameTh}
                      </p>
                    </div>

                    {/* Rarity + Count */}
                    <div 
                      className="px-3 py-2 flex items-center justify-between text-xs"
                      style={{ backgroundColor: borderColor + '30' }}
                    >
                      <span 
                        className="font-black"
                        style={{ color: borderColor }}
                      >
                        {rarityName}
                      </span>
                      <span className="text-white font-bold">
                        {caught.weight.toFixed(1)}kg
                      </span>
                    </div>

                    {/* Level */}
                    <div className="bg-gray-900 px-3 py-2 text-center">
                      <span className="text-gray-400 text-xs font-bold">
                        LEVEL 1
                      </span>
                    </div>

                    {/* Bottom - Coins */}
                    <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-3 py-2 flex items-center justify-center space-x-2">
                      <Coins className="h-4 w-4 text-yellow-900" />
                      <span className="text-yellow-900 font-black text-sm">
                        {caught.sellPrice}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {session.caughtFish.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white text-2xl">ไม่มีปลา</p>
          </div>
        )}
      </div>

      <style>{`
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
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
