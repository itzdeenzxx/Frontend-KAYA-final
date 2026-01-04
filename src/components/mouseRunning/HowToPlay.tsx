import { Button } from '@/components/ui/button';
import { MouseIcon } from './icons/MouseIcon';
import { CheeseIcon } from './icons/CheeseIcon';
import { RocketIcon } from './icons/RocketIcon';
import { RunningPersonIcon } from './icons/RunningPersonIcon';

interface HowToPlayProps {
  onClose: () => void;
  onStart: () => void;
}

export function HowToPlay({ onClose, onStart }: HowToPlayProps) {
  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="text-center p-6 rounded-2xl bg-card border-4 border-blue-500/30 max-w-lg mx-4">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-400 mb-6">
          How to Play
        </h2>
        
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex items-center gap-4 bg-muted/30 rounded-xl p-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="font-bold text-2xl text-green-500">1</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground mb-1">Stand in front of the camera</p>
              <p className="text-sm text-muted-foreground">Make sure your full body is visible</p>
            </div>
            <RunningPersonIcon className="w-10 h-12" />
          </div>
          
          {/* Step 2 - Green Light */}
          <div className="flex items-center gap-4 bg-green-500/10 rounded-xl p-4 border-2 border-green-500/30">
            <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="font-bold text-2xl text-white">2</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-green-500 mb-1">Green Light = RUN!</p>
              <p className="text-sm text-muted-foreground">Run in place to move the mouse up</p>
            </div>
            <div className="relative">
              <MouseIcon className="w-10 h-14" isRunning />
              <div className="absolute -top-2 -right-2">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Step 3 - Red Light */}
          <div className="flex items-center gap-4 bg-red-500/10 rounded-xl p-4 border-2 border-red-500/30">
            <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <span className="font-bold text-2xl text-white">3</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-red-500 mb-1">Red Light = FREEZE!</p>
              <p className="text-sm text-muted-foreground">Stop moving or get hit by a rocket!</p>
            </div>
            <div className="relative">
              <RocketIcon className="w-8 h-10" animated />
            </div>
          </div>
          
          {/* Step 4 - Goal */}
          <div className="flex items-center gap-4 bg-yellow-500/10 rounded-xl p-4 border-2 border-yellow-500/30">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="font-bold text-2xl text-black">4</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-yellow-500 mb-1">Reach the Cheese!</p>
              <p className="text-sm text-muted-foreground">Get to 100% to win the game</p>
            </div>
            <CheeseIcon className="w-12 h-9" />
          </div>
          
          {/* Tip */}
          <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
            <p className="text-sm text-blue-400">
              <span className="font-semibold">Tip:</span> Getting hit doesn't end the game - you just lose 50% progress!
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button 
            onClick={onClose}
            variant="outline"
            size="lg"
            className="flex-1 font-bold"
          >
            Back
          </Button>
          <Button 
            onClick={onStart}
            size="lg"
            className="flex-1 font-bold bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
          >
            Start Game
          </Button>
        </div>
      </div>
    </div>
  );
}
