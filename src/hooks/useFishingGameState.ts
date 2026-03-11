import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  FishingGameScreen,
  FishingGameState,
  PlayerProgress,
  CaughtFish,
  BiomeType,
  FishingSession,
} from '@/types/fishing';
import {
  createNewFishingPlayer,
  loadFishingPlayer,
  saveFishingPlayer,
  addCoins,
  spendCoins,
  addExp,
  buyRod,
  buyBait,
  buyBoat,
  equipItem,
  unlockMap,
  saveCaughtFish,
  useBait,
} from '@/lib/fishingFirestore';
import { getBoatById, calculateFishingExp } from '@/lib/equipmentDatabase';
import { getFishById } from '@/lib/fishingDatabase';
import { toast } from '@/hooks/use-toast';

export function useFishingGameState() {
  const { lineProfile } = useAuth();
  const [gameState, setGameState] = useState<FishingGameState>({
    currentScreen: 'menu',
    playerProgress: null,
    currentSession: null,
    isLoading: true,
    error: null,
  });

  // ========================================
  // INITIALIZATION
  // ========================================

  // โหลดข้อมูลผู้เล่นเมื่อเริ่มต้น
  useEffect(() => {
    if (lineProfile) {
      checkAndLoadPlayer();
    }
  }, [lineProfile]);

  const checkAndLoadPlayer = async () => {
    if (!lineProfile) return;

    try {
      setGameState((prev) => ({ ...prev, isLoading: true }));
      const player = await loadFishingPlayer(lineProfile.userId);
      setGameState((prev) => ({
        ...prev,
        playerProgress: player,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading player:', error);
      setGameState((prev) => ({
        ...prev,
        error: 'ไม่สามารถโหลดข้อมูลผู้เล่นได้',
        isLoading: false,
      }));
    }
  };

  // ========================================
  // SCREEN NAVIGATION
  // ========================================

  const navigateToScreen = useCallback((screen: FishingGameScreen) => {
    setGameState((prev) => ({ ...prev, currentScreen: screen }));
  }, []);

  const handleNewGame = useCallback(async () => {
    if (!lineProfile) return;

    try {
      const newPlayer = await createNewFishingPlayer(
        lineProfile.userId,
        lineProfile.displayName || 'Player',
        lineProfile.pictureUrl || undefined
      );

      setGameState((prev) => ({
        ...prev,
        playerProgress: newPlayer,
        currentScreen: 'main-hub',
      }));

      toast({
        title: 'ยินดีต้อนรับ!',
        description: 'เริ่มต้นการผจญภัยตกปลาของคุณ',
      });
    } catch (error) {
      console.error('Error creating new player:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างผู้เล่นใหม่ได้',
        variant: 'destructive',
      });
    }
  }, [lineProfile]);

  const handleContinue = useCallback(async () => {
    await checkAndLoadPlayer();
    if (gameState.playerProgress) {
      navigateToScreen('main-hub');
    }
  }, [gameState.playerProgress]);

  // ========================================
  // MAP & BIOME
  // ========================================

  const handleUnlockMap = useCallback(
    async (biomeId: BiomeType, price: number) => {
      if (!lineProfile || !gameState.playerProgress) return;

      try {
        // ตรวจสอบเงิน
        if (gameState.playerProgress.coins < price) {
          toast({
            title: 'เงินไม่พอ',
            description: `ต้องการ ${price.toLocaleString()} เหรียญ`,
            variant: 'destructive',
          });
          return;
        }

        // หักเงิน
        const success = await spendCoins(lineProfile.userId, price);
        if (!success) {
          throw new Error('ไม่สามารถหักเงินได้');
        }

        // ปลดล็อค map
        await unlockMap(lineProfile.userId, biomeId);

        // โหลดข้อมูลใหม่
        const updatedPlayer = await loadFishingPlayer(lineProfile.userId);
        setGameState((prev) => ({
          ...prev,
          playerProgress: updatedPlayer,
        }));

        toast({
          title: 'ปลดล็อคสำเร็จ!',
          description: 'คุณสามารถเข้าถึงพื้นที่ใหม่แล้ว',
        });
      } catch (error) {
        console.error('Error unlocking map:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถปลดล็อคพื้นที่ได้',
          variant: 'destructive',
        });
      }
    },
    [lineProfile, gameState.playerProgress]
  );

  const handleSelectMap = useCallback(
    (biomeId: BiomeType) => {
      if (!gameState.playerProgress) return;

      // สร้าง fishing session
      const boat = gameState.playerProgress.equippedBoat
        ? getBoatById(gameState.playerProgress.equippedBoat)
        : null;

      const session: FishingSession = {
        biome: biomeId,
        startTime: new Date(),
        caughtFish: [],
        currentWeight: 0,
        maxWeight: boat?.capacity || 50,
        isActive: true,
      };

      setGameState((prev) => ({
        ...prev,
        currentSession: session,
        currentScreen: 'gameplay',
      }));

      toast({
        title: 'เริ่มตกปลา!',
        description: 'ขว้างเบ็ดแล้วรอปลาติด',
      });
    },
    [gameState.playerProgress]
  );

  // ========================================
  // SHOP & EQUIPMENT
  // ========================================

  const handleBuyRod = useCallback(
    async (rodId: string, price: number) => {
      if (!lineProfile || !gameState.playerProgress) return;

      try {
        const success = await spendCoins(lineProfile.userId, price);
        if (!success) {
          toast({
            title: 'เงินไม่พอ',
            variant: 'destructive',
          });
          return;
        }

        await buyRod(lineProfile.userId, rodId);
        const updatedPlayer = await loadFishingPlayer(lineProfile.userId);
        setGameState((prev) => ({ ...prev, playerProgress: updatedPlayer }));

        toast({
          title: 'ซื้อสำเร็จ!',
          description: 'คุณได้คันเบ็ดใหม่แล้ว',
        });
      } catch (error) {
        console.error('Error buying rod:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          variant: 'destructive',
        });
      }
    },
    [lineProfile, gameState.playerProgress]
  );

  const handleBuyBait = useCallback(
    async (baitId: string, quantity: number, price: number) => {
      if (!lineProfile || !gameState.playerProgress) return;

      try {
        const success = await spendCoins(lineProfile.userId, price);
        if (!success) {
          toast({
            title: 'เงินไม่พอ',
            variant: 'destructive',
          });
          return;
        }

        await buyBait(lineProfile.userId, baitId, quantity);
        const updatedPlayer = await loadFishingPlayer(lineProfile.userId);
        setGameState((prev) => ({ ...prev, playerProgress: updatedPlayer }));

        toast({
          title: 'ซื้อสำเร็จ!',
          description: `ได้เหยื่อ ${quantity} ชิ้น`,
        });
      } catch (error) {
        console.error('Error buying bait:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          variant: 'destructive',
        });
      }
    },
    [lineProfile, gameState.playerProgress]
  );

  const handleBuyBoat = useCallback(
    async (boatId: string, price: number) => {
      if (!lineProfile || !gameState.playerProgress) return;

      try {
        const success = await spendCoins(lineProfile.userId, price);
        if (!success) {
          toast({
            title: 'เงินไม่พอ',
            variant: 'destructive',
          });
          return;
        }

        await buyBoat(lineProfile.userId, boatId);
        const updatedPlayer = await loadFishingPlayer(lineProfile.userId);
        setGameState((prev) => ({ ...prev, playerProgress: updatedPlayer }));

        toast({
          title: 'ซื้อสำเร็จ!',
          description: 'คุณได้เรือใหม่แล้ว',
        });
      } catch (error) {
        console.error('Error buying boat:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          variant: 'destructive',
        });
      }
    },
    [lineProfile, gameState.playerProgress]
  );

  const handleEquipRod = useCallback(
    async (rodId: string) => {
      if (!lineProfile) return;

      try {
        await equipItem(lineProfile.userId, 'rod', rodId);
        const updatedPlayer = await loadFishingPlayer(lineProfile.userId);
        setGameState((prev) => ({ ...prev, playerProgress: updatedPlayer }));

        toast({
          title: 'สวมใส่แล้ว!',
          description: 'คันเบ็ดถูกสวมใส่แล้ว',
        });
      } catch (error) {
        console.error('Error equipping rod:', error);
      }
    },
    [lineProfile]
  );

  const handleEquipBait = useCallback(
    async (baitId: string) => {
      if (!lineProfile) return;

      try {
        await equipItem(lineProfile.userId, 'bait', baitId);
        const updatedPlayer = await loadFishingPlayer(lineProfile.userId);
        setGameState((prev) => ({ ...prev, playerProgress: updatedPlayer }));

        toast({
          title: 'สวมใส่แล้ว!',
          description: 'เหยื่อถูกสวมใส่แล้ว',
        });
      } catch (error) {
        console.error('Error equipping bait:', error);
      }
    },
    [lineProfile]
  );

  const handleEquipBoat = useCallback(
    async (boatId: string) => {
      if (!lineProfile) return;

      try {
        await equipItem(lineProfile.userId, 'boat', boatId);
        const updatedPlayer = await loadFishingPlayer(lineProfile.userId);
        setGameState((prev) => ({ ...prev, playerProgress: updatedPlayer }));

        toast({
          title: 'สวมใส่แล้ว!',
          description: 'เรือถูกสวมใส่แล้ว',
        });
      } catch (error) {
        console.error('Error equipping boat:', error);
      }
    },
    [lineProfile]
  );

  // ========================================
  // GAMEPLAY
  // ========================================

  const handleCatchFish = useCallback(
    async (fish: CaughtFish) => {
      if (!lineProfile || !gameState.currentSession) return;

      try {
        // ใช้เหยื่อ 1 ชิ้น
        if (gameState.playerProgress?.equippedBait) {
          await useBait(lineProfile.userId, gameState.playerProgress.equippedBait);
        }

        // บันทึกปลาที่จับได้
        await saveCaughtFish(lineProfile.userId, fish);

        // คำนวณและเพิ่ม EXP (ใช้ calculateFishingExp แทน sellPrice)
        const fishData = getFishById(fish.fishId);
        const expGain = fishData ? calculateFishingExp(fishData.rarity, fish.weight) : 0;
        const { leveledUp, newLevel } = await addExp(lineProfile.userId, expGain);

        if (leveledUp) {
          toast({
            title: 'Level Up!',
            description: `คุณเลื่อนเป็น Level ${newLevel}`,
          });
        }

        // อัพเดท session
        setGameState((prev) => {
          if (!prev.currentSession) return prev;

          return {
            ...prev,
            currentSession: {
              ...prev.currentSession,
              caughtFish: [...prev.currentSession.caughtFish, fish],
              currentWeight: prev.currentSession.currentWeight + fish.weight,
            },
          };
        });

        toast({
          title: 'จับปลาได้!',
          description: `${fish.weight.toFixed(2)} kg`,
        });
      } catch (error) {
        console.error('Error catching fish:', error);
      }
    },
    [lineProfile, gameState.currentSession, gameState.playerProgress]
  );

  const handleFinishFishing = useCallback(async () => {
    if (!lineProfile || !gameState.currentSession) return;

    try {
      // คำนวณเงินรวม
      const totalEarnings = gameState.currentSession.caughtFish.reduce(
        (sum, fish) => sum + fish.sellPrice,
        0
      );

      // เพิ่มเงิน
      await addCoins(lineProfile.userId, totalEarnings);

      // โหลดข้อมูลใหม่
      const updatedPlayer = await loadFishingPlayer(lineProfile.userId);
      setGameState((prev) => ({
        ...prev,
        playerProgress: updatedPlayer,
        currentScreen: 'sell-summary',
      }));

      toast({
        title: 'ขายปลาสำเร็จ!',
        description: `ได้เงิน ${totalEarnings.toLocaleString()} เหรียญ`,
      });
    } catch (error) {
      console.error('Error finishing fishing:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      });
    }
  }, [lineProfile, gameState.currentSession]);

  const handleBackToHub = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      currentSession: null,
      currentScreen: 'main-hub',
    }));
  }, []);

  // ========================================
  // RETURN
  // ========================================

  return {
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
  };
}



