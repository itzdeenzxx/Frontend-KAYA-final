import { GameCanvas } from '@/components/mouseRunning/GameCanvas';

export default function MouseRunningGame() {
  return (
    <div className="fixed inset-0 bg-background">
      <GameCanvas />
    </div>
  );
}
