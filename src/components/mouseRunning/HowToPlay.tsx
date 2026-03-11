import { MouseIcon } from './icons/MouseIcon';
import { CheeseIcon } from './icons/CheeseIcon';
import { RocketIcon } from './icons/RocketIcon';
import { RunningPersonIcon } from './icons/RunningPersonIcon';

interface HowToPlayProps {
  onClose: () => void;
  onStart: () => void;
}

export function HowToPlay({ onClose, onStart }: HowToPlayProps) {
  const steps = [
    {
      num: 1,
      color: '#22c55e',
      title: 'Stand in front of the camera',
      desc: 'Make sure your full body is visible',
      icon: <RunningPersonIcon className="w-10 h-12" />,
    },
    {
      num: 2,
      color: '#22c55e',
      title: 'Green Light = RUN!',
      desc: 'Run in place to move the mouse up',
      icon: <MouseIcon className="w-10 h-14" isRunning />,
      border: true,
    },
    {
      num: 3,
      color: '#ef4444',
      title: 'Red Light = FREEZE!',
      desc: 'Stop moving or get hit by a rocket!',
      icon: <RocketIcon className="w-8 h-10" animated />,
      border: true,
    },
    {
      num: 4,
      color: '#eab308',
      title: 'Reach the Cheese!',
      desc: 'Get to 100% to win the game',
      icon: <CheeseIcon className="w-12 h-9" />,
      border: true,
    },
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto py-4"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2147 40%, #1a0a3e 100%)' }}>
      <div className="w-full max-w-lg mx-4 p-6 rounded-3xl relative"
        style={{
          background: 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)',
          border: '2px solid rgba(96,165,250,0.25)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>
        <h2 className="text-2xl md:text-3xl font-black text-center text-white uppercase tracking-wider mb-6"
          style={{ textShadow: '0 0 20px rgba(96,165,250,0.4)' }}>
          How to Play
        </h2>
        
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.num} className="flex items-center gap-4 p-3.5 rounded-xl"
              style={{
                background: `${step.color}10`,
                border: step.border ? `1.5px solid ${step.color}33` : '1.5px solid rgba(255,255,255,0.06)',
              }}>
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-xl text-white"
                style={{ background: step.color, boxShadow: `0 3px 0 ${step.color}88, 0 0 12px ${step.color}44` }}>
                {step.num}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{step.title}</p>
                <p className="text-white/40 text-xs">{step.desc}</p>
              </div>
              <div className="flex-shrink-0 opacity-80">{step.icon}</div>
            </div>
          ))}

          <div className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
            <p className="text-blue-300/80 text-xs font-medium">
              Getting hit doesn't end the game -- you just lose progress!
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl font-bold text-base text-white uppercase transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #6b7280 0%, #4b5563 100%)',
              boxShadow: '0 4px 0 #374151, inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
            Back
          </button>
          <button onClick={onStart}
            className="flex-1 py-3.5 rounded-2xl font-bold text-base text-white uppercase transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
              boxShadow: '0 4px 0 #14532d, 0 0 16px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}>
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
