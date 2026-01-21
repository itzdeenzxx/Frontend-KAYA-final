import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MoleProps {
  isVisible: boolean;
  customImage: string | null;
  onHit: () => void;
  wasHit: boolean;
  isBomb?: boolean;
}

export function Mole({ isVisible, customImage, onHit, wasHit, isBomb = false }: MoleProps) {
  const [showStars, setShowStars] = useState(false);

  useEffect(() => {
    if (wasHit) {
      setShowStars(true);
      const timer = setTimeout(() => setShowStars(false), 300);
      return () => clearTimeout(timer);
    }
  }, [wasHit]);

  return (
    <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
      {/* Mole or Bomb */}
      <div
        className={cn(
          "absolute bottom-0 transition-all duration-200 ease-out",
          isVisible && !wasHit ? "translate-y-0" : "translate-y-full",
          wasHit && "scale-75 opacity-50"
        )}
        style={{
          width: '80%',
          height: '100%',
        }}
      >
        {isBomb ? (
          // Bomb design
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-full aspect-square">
              {/* Bomb body */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900 rounded-full shadow-lg flex items-center justify-center">
                <span className="text-3xl sm:text-4xl md:text-5xl">💣</span>
              </div>
              {/* Warning glow */}
              <div className="absolute inset-0 rounded-full animate-pulse bg-red-500/30" />
            </div>
          </div>
        ) : customImage ? (
          <img
            src={customImage}
            alt="Mole"
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          // Default mole design
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-full aspect-square">
              {/* Mole body */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-full shadow-lg">
                {/* Face */}
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] aspect-square">
                  {/* Eyes */}
                  <div className="absolute top-[25%] left-[20%] w-[20%] aspect-square bg-white rounded-full">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square bg-black rounded-full" />
                  </div>
                  <div className="absolute top-[25%] right-[20%] w-[20%] aspect-square bg-white rounded-full">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square bg-black rounded-full" />
                  </div>
                  {/* Nose */}
                  <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-[25%] aspect-square bg-pink-400 rounded-full" />
                  {/* Whiskers */}
                  <div className="absolute top-[55%] left-[10%] w-[25%] h-[2px] bg-amber-900 -rotate-12" />
                  <div className="absolute top-[60%] left-[10%] w-[25%] h-[2px] bg-amber-900" />
                  <div className="absolute top-[55%] right-[10%] w-[25%] h-[2px] bg-amber-900 rotate-12" />
                  <div className="absolute top-[60%] right-[10%] w-[25%] h-[2px] bg-amber-900" />
                  {/* Cheeks */}
                  <div className="absolute top-[45%] left-[5%] w-[15%] aspect-square bg-pink-300/50 rounded-full" />
                  <div className="absolute top-[45%] right-[5%] w-[15%] aspect-square bg-pink-300/50 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
