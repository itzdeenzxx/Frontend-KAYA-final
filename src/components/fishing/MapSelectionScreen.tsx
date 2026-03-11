import { useState } from 'react';
import { BiomeType, PlayerProgress } from '@/types/fishing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Lock, 
  Zap,
  Trophy,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  BIOME_MAPS, 
} from '@/lib/biomeDatabase';
import { BIOME_EMOJIS, BIOME_NAMES_TH } from '@/types/fishing';

export function MapSelectionScreen({
  player,
  onSelectMap,
  onUnlockMap,
  onBack,
}: {
  player: PlayerProgress;
  onSelectMap: (biomeId: BiomeType) => void;
  onUnlockMap: (biomeId: BiomeType) => void;
  onBack: () => void;
}) {
  const [selectedBiome, setSelectedBiome] = useState<BiomeType | null>(null);

  const handleSelectBiome = (biomeId: BiomeType) => {
    const isUnlocked = player.unlockedMaps.includes(biomeId);
    if (isUnlocked) {
      onSelectMap(biomeId);
    }
  };

  const getBiomeGradient = (biomeId: BiomeType) => {
    const gradients: Record<BiomeType, string> = {
      ocean: 'from-blue-600 via-cyan-500 to-blue-400',
      river: 'from-cyan-600 via-teal-500 to-cyan-400',
      lake: 'from-indigo-600 via-blue-500 to-indigo-400',
      ice: 'from-sky-500 via-blue-400 to-sky-300',
      pond: 'from-emerald-600 via-green-500 to-emerald-400',
      swamp: 'from-lime-700 via-green-600 to-lime-500',
    };
    return gradients[biomeId] || 'from-gray-600 to-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-cyan-200 to-blue-300 relative overflow-hidden">
      {/* Background Ocean Image */}
      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(56, 189, 248, 0.3), rgba(14, 165, 233, 0.5))',
      }}>
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-9xl opacity-10 animate-float">🌊</div>
        <div className="absolute bottom-20 right-20 text-8xl opacity-10 animate-float-slow">🐟</div>
      </div>

      <div className="relative z-10 p-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          {/* Title */}
          <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-xl px-6 py-3 border-2 border-yellow-500/50 shadow-2xl">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
              FISHERY
            </h1>
          </div>

          {/* Energy Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg border-2 border-gray-500 shadow-xl flex items-center justify-center transition-all hover:scale-110"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Fishery Cards */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BIOME_MAPS.map((biome) => {
              const isUnlocked = player.unlockedMaps.includes(biome.id);
              const fishCaught = Object.keys(player.fishCollection).filter(
                id => {
                  const fishId = id.split('_')[0];
                  return fishId.startsWith(biome.id);
                }
              ).length;
              const canUnlock = player.level >= biome.requiredLevel && player.coins >= biome.unlockPrice;

              return (
                <Card
                  key={biome.id}
                  className={cn(
                    'overflow-hidden shadow-2xl transition-all duration-300 cursor-pointer',
                    isUnlocked ? 'hover:scale-105 hover:shadow-3xl' : 'opacity-80'
                  )}
                  onClick={() => isUnlocked && handleSelectBiome(biome.id)}
                >
                  {/* Header with Biome Image */}
                  <div className={cn('relative h-48 bg-gradient-to-br', getBiomeGradient(biome.id))}>
                    {/* Rank Badge (Top Left) */}
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg px-3 py-1 border-2 border-yellow-400 shadow-lg flex items-center space-x-1">
                      <Trophy className="h-4 w-4 text-white" />
                      <span className="text-white font-black text-sm">
                        LV.{biome.requiredLevel}
                      </span>
                    </div>

                    {/* Lock Badge */}
                    {!isUnlocked && (
                      <div className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm rounded-full p-2 border-2 border-gray-700">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                    )}

                    {/* Biome Emoji/Logo */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-9xl animate-float drop-shadow-2xl">
                        {BIOME_EMOJIS[biome.id]}
                      </div>
                    </div>

                    {/* Biome Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-4 px-4">
                      <h3 className="text-2xl font-black text-white drop-shadow-lg text-center">
                        {BIOME_NAMES_TH[biome.id]}
                      </h3>
                    </div>
                  </div>

                  <CardContent className="p-4 bg-gradient-to-b from-gray-800 to-gray-900">
                    {isUnlocked ? (
                      <>
                        {/* Stats */}
                        <div className="flex items-center justify-between mb-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">🐟 Fish:</span>
                            <span className="text-white font-bold">{fishCaught}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">Mode:</span>
                            <span className="text-cyan-400 font-bold">UNLIMITED</span>
                          </div>
                        </div>

                        {/* Enter Button */}
                        <Button
                          className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-lg shadow-xl border-2 border-orange-400 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectBiome(biome.id);
                          }}
                        >
                          ENTER
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Unlock Requirements */}
                        <div className="space-y-2 mb-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Required Level:</span>
                            <span className={cn(
                              'font-bold',
                              player.level >= biome.requiredLevel ? 'text-green-400' : 'text-red-400'
                            )}>
                              {biome.requiredLevel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Price:</span>
                            <span className={cn(
                              'font-bold',
                              player.coins >= biome.unlockPrice ? 'text-green-400' : 'text-red-400'
                            )}>
                              💰 {biome.unlockPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Unlock Button */}
                        <Button
                          className={cn(
                            'w-full h-12 font-black text-lg shadow-xl border-2 rounded-lg',
                            canUnlock
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-green-400 text-white'
                              : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                          )}
                          disabled={!canUnlock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canUnlock) {
                              onUnlockMap(biome.id);
                            }
                          }}
                        >
                          {canUnlock ? 'UNLOCK' : 'LOCKED'}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
