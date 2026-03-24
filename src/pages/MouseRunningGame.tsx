import { GameCanvas } from '@/components/mouseRunning/GameCanvas';
import { useNavigate } from 'react-router-dom';

export default function MouseRunningGame() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-background">
      <GameCanvas onExit={() => navigate('/game-mode')} />
    </div>
  );
}
