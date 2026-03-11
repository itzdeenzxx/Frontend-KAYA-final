import { useNavigate } from 'react-router-dom';
import { useFishingGameState } from '@/hooks/useFishingGameState';
import { FishingMenuScreen } from '@/components/fishing/FishingMenuScreen';
import { MainHubScreen } from '@/components/fishing/MainHubScreen';
import { MapSelectionScreen } from '@/components/fishing/MapSelectionScreen';
import { ShopScreen } from '@/components/fishing/ShopScreen';
import { GameplayScreen } from '@/components/fishing/GameplayScreen';
import { SellSummaryScreen } from '@/components/fishing/SellSummaryScreen';
import { Loader2 } from 'lucide-react';

export default function FishingGamePage() {
  const navigate = useNavigate();
  const {
    gameState,
    navigateToScreen,
    handleNewGame,
    handleContinue,
    handleUnlockMap,
    handleSelectMap,
    handleBuyRod,
    handleBuyBait,
    handleBuyBoat,
    handleEquipRod,
    handleEquipBait,
    handleEquipBoat,
    handleCatchFish,
    handleFinishFishing,
    handleBackToHub,
  } = useFishingGameState();

  // Loading state
  if (gameState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-white animate-spin mx-auto mb-4" />
          <p className="text-2xl text-white font-bold">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (gameState.error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-400 to-red-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <p className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</p>
          <p className="text-gray-700">{gameState.error}</p>
        </div>
      </div>
    );
  }

  // Screen routing
  switch (gameState.currentScreen) {
    case 'menu':
      return (
        <FishingMenuScreen
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onBack={() => navigate('/game-mode')}
        />
      );

    case 'main-hub':
      if (!gameState.playerProgress) return null;
      return (
        <MainHubScreen
          player={gameState.playerProgress}
          onStartFishing={() => navigateToScreen('map-selection')}
          onOpenShop={() => navigateToScreen('shop')}
          onBack={() => navigate('/game-mode')}
        />
      );

    case 'map-selection':
      if (!gameState.playerProgress) return null;
      return (
        <MapSelectionScreen
          player={gameState.playerProgress}
          onSelectMap={handleSelectMap}
          onUnlockMap={(biomeId) => {
            const biome = require('@/lib/biomeDatabase').BIOME_MAPS.find(
              (b: any) => b.id === biomeId
            );
            if (biome) {
              handleUnlockMap(biomeId, biome.unlockPrice);
            }
          }}
          onBack={() => navigateToScreen('main-hub')}
        />
      );

    case 'shop':
      if (!gameState.playerProgress) return null;
      return (
        <ShopScreen
          player={gameState.playerProgress}
          onBuyRod={handleBuyRod}
          onBuyBait={handleBuyBait}
          onBuyBoat={handleBuyBoat}
          onEquipRod={handleEquipRod}
          onEquipBait={handleEquipBait}
          onEquipBoat={handleEquipBoat}
          onBack={() => navigateToScreen('main-hub')}
        />
      );

    case 'gameplay':
      if (!gameState.playerProgress || !gameState.currentSession) return null;
      return (
        <GameplayScreen
          player={gameState.playerProgress}
          session={gameState.currentSession}
          onCatchFish={handleCatchFish}
          onFinish={handleFinishFishing}
        />
      );

    case 'sell-summary':
      if (!gameState.playerProgress || !gameState.currentSession) return null;
      return (
        <SellSummaryScreen
          session={gameState.currentSession}
          onBackToHub={handleBackToHub}
        />
      );

    default:
      return null;
  }
}
