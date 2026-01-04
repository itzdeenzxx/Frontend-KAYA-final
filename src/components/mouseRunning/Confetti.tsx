import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: 'rect' | 'circle' | 'triangle';
}

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const colors = [
      'hsl(45 100% 60%)',   // Gold
      'hsl(340 75% 70%)',   // Pink
      'hsl(200 90% 55%)',   // Blue
      'hsl(142 76% 50%)',   // Green
      'hsl(280 80% 60%)',   // Purple
      'hsl(35 95% 55%)',    // Orange
      'hsl(0 85% 55%)',     // Red
    ];
    
    const shapes: ConfettiPiece['shape'][] = ['rect', 'circle', 'triangle'];
    
    const newPieces: ConfettiPiece[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 12,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      shape: shapes[Math.floor(Math.random() * shapes.length)]
    }));
    
    setPieces(newPieces);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-bounce"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        >
          {piece.shape === 'rect' && (
            <div
              style={{
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotation}deg)`,
                borderRadius: '2px',
              }}
            />
          )}
          {piece.shape === 'circle' && (
            <div
              style={{
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: '50%',
              }}
            />
          )}
          {piece.shape === 'triangle' && (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${piece.size / 2}px solid transparent`,
                borderRight: `${piece.size / 2}px solid transparent`,
                borderBottom: `${piece.size}px solid ${piece.color}`,
                transform: `rotate(${piece.rotation}deg)`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
