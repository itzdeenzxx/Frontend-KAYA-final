import { useState, useEffect } from 'react';
import { PlayerProgress, ShopCategory, Rarity } from '@/types/fishing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  X,
  Coins, 
  ShoppingCart, 
  CheckCircle2,
  Lock,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  FISHING_RODS, 
  BAITS, 
  BOATS,
  getRodById,
  getBaitById,
  getBoatById,
} from '@/lib/equipmentDatabase';
import { RARITY_COLORS, RARITY_NAMES_TH } from '@/types/fishing';
import {
  GearIcon, ToolsIcon, FishingRodIcon, BaitIcon, BoatIcon,
} from './FishingIcons';
import { ShopItemIcon } from './ShopItemIcons';

export function ShopScreen({
  player,
  onBuyRod,
  onBuyBait,
  onBuyBoat,
  onEquipRod,
  onEquipBait,
  onEquipBoat,
  onBack,
}: {
  player: PlayerProgress;
  onBuyRod: (rodId: string, price: number) => void;
  onBuyBait: (baitId: string, quantity: number, price: number) => void;
  onBuyBoat: (boatId: string, price: number) => void;
  onEquipRod: (rodId: string) => void;
  onEquipBait: (baitId: string) => void;
  onEquipBoat: (boatId: string) => void;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ShopCategory>('rods');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [baitQuantityToBuy, setBaitQuantityToBuy] = useState<number>(1);

  const isRodOwned = (rodId: string) => player.ownedRods.includes(rodId);
  const isBaitOwned = (baitId: string) => (player.ownedBaits[baitId] || 0) > 0;
  const isBoatOwned = (boatId: string) => player.ownedBoats.includes(boatId);

  // Get rarity stars
  const getRarityStars = (rarity: Rarity): number => {
    const stars: Record<Rarity, number> = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
    };
    return stars[rarity];
  };

  const getBorderColor = (rarity: Rarity) => {
    return RARITY_COLORS[rarity];
  };

  // Get current items based on tab
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'rods':
        return FISHING_RODS.map(rod => ({
          ...rod,
          type: 'rod',
          owned: isRodOwned(rod.id),
          equipped: player.equippedRod === rod.id,
        }));
      case 'baits':
        return BAITS.map(bait => ({
          ...bait,
          type: 'bait',
          owned: isBaitOwned(bait.id),
          equipped: player.equippedBait === bait.id,
          quantity: player.ownedBaits[bait.id] || 0,
        }));
      case 'boats':
        return BOATS.map(boat => ({
          ...boat,
          type: 'boat',
          owned: isBoatOwned(boat.id),
          equipped: player.equippedBoat === boat.id,
        }));
      default:
        return [];
    }
  };

  const handleBuyItem = () => {
    if (!selectedItem) return;

    if (selectedItem.type === 'rod') {
      onBuyRod(selectedItem.id, selectedItem.price);
    } else if (selectedItem.type === 'bait') {
      const totalPrice = selectedItem.price * baitQuantityToBuy;
      onBuyBait(selectedItem.id, baitQuantityToBuy, totalPrice);
      setBaitQuantityToBuy(1); // Reset after purchase
    } else if (selectedItem.type === 'boat') {
      onBuyBoat(selectedItem.id, selectedItem.price);
    }
  };

  const handleEquipItem = () => {
    if (!selectedItem) return;

    if (selectedItem.type === 'rod') {
      onEquipRod(selectedItem.id);
    } else if (selectedItem.type === 'bait') {
      onEquipBait(selectedItem.id);
    } else if (selectedItem.type === 'boat') {
      onEquipBoat(selectedItem.id);
    }
  };

  const getTotalPrice = () => {
    if (!selectedItem) return 0;
    if (selectedItem.type === 'bait') {
      return selectedItem.price * baitQuantityToBuy;
    }
    return selectedItem.price;
  };

  const canBuySelected = () => {
    if (!selectedItem) return false;
    
    // Allow baits to be purchased multiple times (consumable)
    if (selectedItem.type !== 'bait' && selectedItem.owned) return false;
    
    // Calculate total price (for baits, multiply by quantity)
    const totalPrice = getTotalPrice();
    
    // Check coins and level (if requiredLevel exists)
    const hasEnoughCoins = player.coins >= totalPrice;
    const meetsLevelRequirement = selectedItem.requiredLevel ? player.level >= selectedItem.requiredLevel : true;
    
    return hasEnoughCoins && meetsLevelRequirement;
  };

  const currentItems = getCurrentItems();

  // Reset bait quantity when changing selected item
  useEffect(() => {
    setBaitQuantityToBuy(1);
  }, [selectedItem?.id]);

  // Update selectedItem when player data changes (after buy/equip)
  useEffect(() => {
    if (!selectedItem) return;
    
    // Manually update selectedItem based on its type
    let updatedItem;
    if (selectedItem.type === 'rod') {
      const rod = FISHING_RODS.find(r => r.id === selectedItem.id);
      if (rod) {
        updatedItem = {
          ...rod,
          type: 'rod',
          owned: isRodOwned(rod.id),
          equipped: player.equippedRod === rod.id,
        };
      }
    } else if (selectedItem.type === 'bait') {
      const bait = BAITS.find(b => b.id === selectedItem.id);
      if (bait) {
        updatedItem = {
          ...bait,
          type: 'bait',
          owned: isBaitOwned(bait.id),
          equipped: player.equippedBait === bait.id,
          quantity: player.ownedBaits[bait.id] || 0,
        };
      }
    } else if (selectedItem.type === 'boat') {
      const boat = BOATS.find(b => b.id === selectedItem.id);
      if (boat) {
        updatedItem = {
          ...boat,
          type: 'boat',
          owned: isBoatOwned(boat.id),
          equipped: player.equippedBoat === boat.id,
        };
      }
    }
    
    if (updatedItem) {
      setSelectedItem(updatedItem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.ownedRods, player.ownedBaits, player.ownedBoats, player.equippedRod, player.equippedBait, player.equippedBoat]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20"><GearIcon className="w-36 h-36" /></div>
        <div className="absolute bottom-20 right-20"><ToolsIcon className="w-32 h-32" /></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Left Sidebar - Categories */}
        <div className="w-64 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-md border-r-2 border-gray-700 p-6 flex flex-col">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white mb-2">GEAR</h1>
            <div className="flex items-center space-x-2">
              <Coins className="h-6 w-6 text-yellow-500" />
              <span className="text-3xl font-black text-yellow-400">{player.coins.toLocaleString()}</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="space-y-2 flex-1">
            <button
              onClick={() => {
                setActiveTab('rods');
                setSelectedItem(null);
              }}
              className={cn(
                'w-full px-4 py-3 rounded-lg text-left font-bold transition-all',
                activeTab === 'rods'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><FishingRodIcon className="w-5 h-5" /> RODS</span>
                <span className="text-xs bg-purple-800 px-2 py-1 rounded">
                  {FISHING_RODS.length}
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('baits');
                setSelectedItem(null);
              }}
              className={cn(
                'w-full px-4 py-3 rounded-lg text-left font-bold transition-all',
                activeTab === 'baits'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><BaitIcon className="w-5 h-5" /> BAITS</span>
                <span className="text-xs bg-purple-800 px-2 py-1 rounded">
                  {BAITS.length}
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('boats');
                setSelectedItem(null);
              }}
              className={cn(
                'w-full px-4 py-3 rounded-lg text-left font-bold transition-all',
                activeTab === 'boats'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><BoatIcon className="w-5 h-5" /> BOATS</span>
                <span className="text-xs bg-purple-800 px-2 py-1 rounded">
                  {BOATS.length}
                </span>
              </div>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onBack}
            className="w-full mt-auto px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-white transition-all"
          >
            <X className="inline h-5 w-5 mr-2" />
            CLOSE
          </button>
        </div>

        {/* Center - Items Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentItems.map((item: any) => {
              const stars = getRarityStars(item.rarity);
              const borderColor = getBorderColor(item.rarity);
              const isSelected = selectedItem?.id === item.id;

              return (
                <Card
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    'cursor-pointer transition-all hover:scale-105 relative overflow-hidden',
                    isSelected && 'ring-4 ring-yellow-400'
                  )}
                  style={{
                    borderWidth: '4px',
                    borderColor: borderColor,
                    boxShadow: `0 0 20px ${borderColor}40`,
                  }}
                >
                  {/* Equipped Badge */}
                  {item.equipped && (
                    <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1 z-10">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Lock Badge */}
                  {!item.owned && player.level < item.requiredLevel && (
                    <div className="absolute top-2 left-2 bg-red-600 rounded-full p-1 z-10">
                      <Lock className="h-3 w-3 text-white" />
                    </div>
                  )}

                  <CardContent className="p-0">
                    {/* Item Display */}
                    <div
                      className="h-40 flex items-center justify-center relative"
                      style={{
                        background: `linear-gradient(135deg, ${borderColor}20, ${borderColor}40)`,
                      }}
                    >
                      <div className="text-7xl flex items-center justify-center">
                        <ShopItemIcon type={item.type} itemId={item.id} className="w-20 h-20" />
                      </div>
                    </div>

                    {/* Item Info */}
                    <div
                      className="p-3"
                      style={{ backgroundColor: `${borderColor}30` }}
                    >
                      {/* Level + Stars */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white bg-gray-900/70 px-2 py-1 rounded">
                          LEVEL {item.requiredLevel}
                        </span>
                        <div className="flex">
                          {Array.from({ length: stars }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3 w-3 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Name */}
                      <p
                        className="font-bold text-sm mb-1 truncate"
                        style={{ color: borderColor }}
                      >
                        {item.nameTh}
                      </p>

                      {/* Quantity (for baits) */}
                      {item.type === 'bait' && item.owned && (
                        <p className="text-xs text-white">x{item.quantity}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Item Detail */}
        {selectedItem ? (
          <div className="w-96 bg-gradient-to-b from-purple-900/95 to-purple-800/95 backdrop-blur-md border-l-4 border-purple-500 p-6 overflow-y-auto">
            {/* Item Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className="text-5xl animate-pulse"
                  style={{ filter: `drop-shadow(0 0 10px ${getBorderColor(selectedItem.rarity)})` }}
                >
                  <ShopItemIcon type={selectedItem.type} itemId={selectedItem.id} className="w-16 h-16" />
                </div>
                <div className="flex-1">
                  <div
                    className="text-xs font-bold px-2 py-1 rounded inline-block mb-1"
                    style={{
                      backgroundColor: getBorderColor(selectedItem.rarity),
                      color: 'white',
                    }}
                  >
                    {RARITY_NAMES_TH[selectedItem.rarity].toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-black text-white">
                    {selectedItem.nameTh}
                  </h2>
                </div>
              </div>

              <p className="text-sm text-purple-200">{selectedItem.description}</p>
            </div>

            {/* Stars */}
            <div className="mb-6">
              <div className="flex justify-center space-x-2 mb-4">
                {Array.from({ length: getRarityStars(selectedItem.rarity) }).map((_, i) => (
                  <Star key={i} className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-6 bg-gray-900/50 rounded-lg p-4 border-2 border-purple-600">
              {selectedItem.type === 'rod' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-purple-300 text-sm">Catch Bonus:</span>
                    <span className="text-white font-bold">+{selectedItem.catchBonus}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300 text-sm">Durability:</span>
                    <span className="text-white font-bold">{selectedItem.durability}</span>
                  </div>
                </>
              )}
              {selectedItem.type === 'bait' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-purple-300 text-sm">Rarity Bonus:</span>
                    <span className="text-white font-bold">+{selectedItem.rarityBonus}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300 text-sm">Attraction:</span>
                    <span className="text-white font-bold">{selectedItem.attractionRadius}x</span>
                  </div>
                </>
              )}
              {selectedItem.type === 'boat' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-purple-300 text-sm">Capacity:</span>
                    <span className="text-white font-bold">{selectedItem.capacity} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300 text-sm">Speed:</span>
                    <span className="text-white font-bold">{selectedItem.speed}x</span>
                  </div>
                </>
              )}
              
              {/* Bait Quantity Input */}
              {selectedItem.type === 'bait' && (
                <div className="mb-4 bg-gray-900/50 rounded-lg p-4 border-2 border-purple-600">
                  <label className="block text-purple-300 text-sm mb-2">จำนวนที่ต้องการซื้อ:</label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={baitQuantityToBuy}
                    onChange={(e) => setBaitQuantityToBuy(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-gray-800 border-2 border-purple-500 rounded-lg px-4 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-purple-400"
                  />
                  <p className="text-gray-400 text-xs text-center mt-2">
                    ราคาต่อชิ้น: {selectedItem.price.toLocaleString()} coins
                  </p>
                </div>
              )}
              
              {selectedItem.price > 0 && (
                <div className="flex justify-between border-t border-purple-500 pt-3">
                  <span className="text-purple-300 text-sm">
                    {selectedItem.type === 'bait' ? 'Total Price:' : 'Price:'}
                  </span>
                  <span className="text-yellow-400 font-bold flex items-center">
                    <Coins className="h-4 w-4 mr-1" />
                    {getTotalPrice().toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mb-6 bg-gray-900/50 rounded-lg p-4 border-2 border-purple-600">
              <p className="text-purple-300 text-xs text-center">
                {selectedItem.equipped
                  ? '✓ CURRENTLY EQUIPPED'
                  : selectedItem.owned
                  ? 'OWNED - READY TO EQUIP'
                  : 'NOT OWNED YET'}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {selectedItem.owned && selectedItem.type !== 'bait' ? (
                selectedItem.equipped ? (
                  <Button
                    className="w-full h-14 bg-yellow-600 hover:bg-yellow-500 text-white font-black text-lg"
                    disabled
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    EQUIPPED
                  </Button>
                ) : (
                  <Button
                    className="w-full h-14 bg-green-600 hover:bg-green-500 text-white font-black text-lg"
                    onClick={handleEquipItem}
                  >
                    EQUIP
                  </Button>
                )
              ) : player.level < selectedItem.requiredLevel ? (
                <Button
                  className="w-full h-14 bg-red-600 text-white font-black text-lg cursor-not-allowed"
                  disabled
                >
                  <Lock className="h-5 w-5 mr-2" />
                  REQUIRES LEVEL {selectedItem.requiredLevel}
                </Button>
              ) : canBuySelected() ? (
                <Button
                  className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-black text-lg"
                  onClick={handleBuyItem}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  BUY
                </Button>
              ) : (
                <Button
                  className="w-full h-14 bg-gray-700 text-white font-black text-lg cursor-not-allowed"
                  disabled
                >
                  <Coins className="h-5 w-5 mr-2" />
                  NOT ENOUGH COINS
                </Button>
              )}
              
              {/* For baits: show EQUIP button separately if owned */}
              {selectedItem.owned && selectedItem.type === 'bait' && (
                selectedItem.equipped ? (
                  <Button
                    className="w-full h-14 bg-yellow-600 text-white font-black text-lg"
                    disabled
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    EQUIPPED
                  </Button>
                ) : (
                  <Button
                    className="w-full h-14 bg-green-600 hover:bg-green-500 text-white font-black text-lg"
                    onClick={handleEquipItem}
                  >
                    EQUIP
                  </Button>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="w-96 bg-gradient-to-b from-purple-900/95 to-purple-800/95 backdrop-blur-md border-l-4 border-purple-500 p-6 flex items-center justify-center">
            <div className="text-center text-purple-300">
              <p className="text-lg font-bold">SELECT AN ITEM</p>
              <p className="text-sm mt-2">Click on any item to see details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
