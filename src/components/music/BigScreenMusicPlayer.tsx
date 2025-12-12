import { useEffect, useRef, useState } from 'react';
import { Music, Volume2, VolumeX, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MusicState, clearMusicAction } from '@/lib/session';

interface BigScreenMusicPlayerProps {
  pairingCode: string;
  musicState?: MusicState | null;
  className?: string;
}

export default function BigScreenMusicPlayer({
  pairingCode,
  musicState,
  className,
}: BigScreenMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState(0);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    audio.addEventListener('ended', () => {
      console.log('Track ended');
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Process music state changes from Remote
  useEffect(() => {
    if (!musicState || !audioRef.current) return;
    
    // Skip if we've already processed this action
    if (musicState.timestamp <= lastProcessedTimestamp) return;

    const audio = audioRef.current;
    const action = musicState.action;

    console.log('Processing music action:', action, musicState);

    switch (action) {
      case 'setTrack':
        if (musicState.currentTrack) {
          audio.src = musicState.currentTrack.audio;
          audio.volume = musicState.volume;
          audio.play().catch(console.error);
        }
        break;

      case 'play':
        audio.play().catch(console.error);
        break;

      case 'pause':
        audio.pause();
        break;

      case 'setVolume':
        audio.volume = musicState.volume;
        break;

      case 'toggleVisibility':
        // Just visual, audio keeps playing
        break;

      case 'next':
      case 'previous':
        // Track change is handled via setTrack
        break;
    }

    setLastProcessedTimestamp(musicState.timestamp);

    // Clear the action after processing
    if (action && pairingCode) {
      clearMusicAction(pairingCode);
    }
  }, [musicState, pairingCode, lastProcessedTimestamp]);

  // Sync play state
  useEffect(() => {
    if (!audioRef.current || !musicState) return;
    
    const audio = audioRef.current;
    
    if (musicState.isPlaying && audio.paused && audio.src) {
      audio.play().catch(console.error);
    } else if (!musicState.isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [musicState?.isPlaying]);

  // Update volume
  useEffect(() => {
    if (audioRef.current && musicState) {
      audioRef.current.volume = musicState.volume;
    }
  }, [musicState?.volume]);

  const currentTrack = musicState?.currentTrack;
  const isPlaying = musicState?.isPlaying || false;
  const showOnScreen = musicState?.showOnScreen ?? true;

  // Don't render visual if no track or hidden
  if (!currentTrack || !showOnScreen) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-6 right-6 bg-black/70 backdrop-blur-lg rounded-xl p-3 z-40 max-w-xs',
        'animate-in slide-in-from-right duration-300',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Album art */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={currentTrack.image}
            alt={currentTrack.name}
            className="w-full h-full object-cover"
          />
          {isPlaying ? (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex gap-0.5 items-end">
                <span className="w-1 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Pause className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Music className="w-3 h-3 text-primary" />
            <span className="text-primary text-xs font-medium">
              {isPlaying ? 'กำลังเล่น' : 'หยุดชั่วคราว'}
            </span>
          </div>
          <p className="text-white text-sm font-semibold truncate leading-tight">
            {currentTrack.name}
          </p>
          <p className="text-white/50 text-xs truncate">
            {currentTrack.artist_name}
          </p>
        </div>

        {/* Volume indicator */}
        <div className="text-white/40">
          {musicState?.volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </div>
      </div>
    </div>
  );
}