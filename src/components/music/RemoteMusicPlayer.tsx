import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Search,
  Music,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Tv,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useJamendo,
  WORKOUT_GENRES,
  formatDuration,
  JamendoTrack,
} from '@/hooks/useJamendo';
import { updateMusicState, MusicState } from '@/lib/session';

interface RemoteMusicPlayerProps {
  pairingCode: string;
  musicState?: MusicState | null;
  className?: string;
  compact?: boolean;
}

export default function RemoteMusicPlayer({
  pairingCode,
  musicState,
  className,
  compact = false,
}: RemoteMusicPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [volume, setVolume] = useState(musicState?.volume ?? 0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playlist, setPlaylist] = useState<JamendoTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const searchTimeoutRef = { current: null as NodeJS.Timeout | null };

  const { tracks, isLoading, error, searchTracks, getTracksByGenre, getWorkoutTracks, clearTracks } =
    useJamendo();

  // Current track from BigScreen state
  const currentTrack = musicState?.currentTrack || null;
  const isPlaying = musicState?.isPlaying || false;
  const showOnScreen = musicState?.showOnScreen ?? true;

  // Load workout tracks on mount
  useEffect(() => {
    getWorkoutTracks();
  }, []);

  // Update playlist when tracks change
  useEffect(() => {
    if (tracks.length > 0) {
      setPlaylist(tracks);
    }
  }, [tracks]);

  // Send music command to BigScreen
  const sendMusicCommand = useCallback(
    async (
      action: MusicState['action'],
      track?: JamendoTrack | null,
      newVolume?: number,
      newShowOnScreen?: boolean
    ) => {
      if (!pairingCode) return;

      const newState: MusicState = {
        currentTrack: track
          ? {
              id: track.id,
              name: track.name,
              artist_name: track.artist_name,
              image: track.image,
              audio: track.audio,
              duration: track.duration,
            }
          : currentTrack,
        isPlaying: action === 'play' || action === 'setTrack' ? true : action === 'pause' ? false : isPlaying,
        volume: newVolume ?? volume,
        showOnScreen: newShowOnScreen ?? showOnScreen,
        action,
        timestamp: Date.now(),
      };

      await updateMusicState(pairingCode, newState);
    },
    [pairingCode, currentTrack, isPlaying, volume, showOnScreen]
  );

  // Toggle visibility on BigScreen
  const handleToggleVisibility = () => {
    sendMusicCommand('toggleVisibility', null, undefined, !showOnScreen);
  };

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedGenre(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchTracks(value);
      }, 500);
    } else {
      clearTracks();
      getWorkoutTracks();
    }
  };

  const handleGenreSelect = (genreId: string) => {
    setSelectedGenre(genreId === selectedGenre ? null : genreId);
    setSearchQuery('');

    if (genreId === selectedGenre) {
      getWorkoutTracks();
    } else {
      getTracksByGenre(genreId);
    }
  };

  const handlePlayTrack = useCallback(
    (track: JamendoTrack, index: number) => {
      setCurrentIndex(index);
      sendMusicCommand('setTrack', track);
    },
    [sendMusicCommand]
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      sendMusicCommand('pause');
    } else {
      if (!currentTrack && playlist.length > 0) {
        handlePlayTrack(playlist[0], 0);
      } else {
        sendMusicCommand('play');
      }
    }
  };

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    sendMusicCommand('setTrack', playlist[nextIndex]);
  }, [currentIndex, playlist, sendMusicCommand]);

  const handlePrevious = useCallback(() => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    sendMusicCommand('setTrack', playlist[prevIndex]);
  }, [currentIndex, playlist, sendMusicCommand]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    sendMusicCommand('setVolume', null, newVolume);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    sendMusicCommand('setVolume', null, newMuted ? 0 : volume);
  };

  // Compact mini player
  if (compact && !isExpanded) {
    return (
      <div
        className={cn(
          'bg-background/10 backdrop-blur-lg rounded-xl p-3 flex items-center gap-3',
          className
        )}
      >
        {currentTrack ? (
          <>
            <img
              src={currentTrack.image}
              alt={currentTrack.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentTrack.name}</p>
              <p className="text-xs text-background/60 truncate">{currentTrack.artist_name}</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <Music className="w-5 h-5 text-background/60" />
            <span className="text-sm text-background/60">เลือกเพลง</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-background hover:bg-background/20"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-background hover:bg-background/20"
          onClick={() => setIsExpanded(true)}
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-background/10 backdrop-blur-lg rounded-2xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-background/10">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">เพลงออกกำลังกาย</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle visibility on BigScreen */}
          <button
            onClick={handleToggleVisibility}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors',
              showOnScreen 
                ? 'bg-primary/20 text-primary' 
                : 'bg-background/10 text-background/60'
            )}
          >
            {showOnScreen ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showOnScreen ? 'แสดงบนจอ' : 'ซ่อนบนจอ'}</span>
          </button>
          {compact && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-background hover:bg-background/20"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-background/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-background/40" />
          <Input
            type="text"
            placeholder="ค้นหาเพลง..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-background/10 border-background/20 text-background placeholder:text-background/40"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-background/40" />
            </button>
          )}
        </div>

        {/* Genre tags */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {WORKOUT_GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreSelect(genre.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                selectedGenre === genre.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/10 text-background/80 hover:bg-background/20'
              )}
            >
              {genre.icon} {genre.name}
            </button>
          ))}
        </div>
      </div>

      {/* Track list */}
      <div className="max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-background/60">
            <p>{error}</p>
          </div>
        ) : playlist.length === 0 ? (
          <div className="text-center py-8 text-background/60">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>ไม่พบเพลง</p>
          </div>
        ) : (
          <div className="divide-y divide-background/10">
            {playlist.map((track, index) => (
              <button
                key={track.id}
                onClick={() => handlePlayTrack(track, index)}
                className={cn(
                  'w-full p-3 flex items-center gap-3 hover:bg-background/10 transition-colors text-left',
                  currentTrack?.id === track.id && 'bg-primary/20'
                )}
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={track.image}
                    alt={track.name}
                    className="w-full h-full object-cover"
                  />
                  {currentTrack?.id === track.id && isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="flex gap-0.5">
                        <span className="w-1 h-3 bg-primary animate-pulse" />
                        <span className="w-1 h-4 bg-primary animate-pulse delay-75" />
                        <span className="w-1 h-2 bg-primary animate-pulse delay-150" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.name}</p>
                  <p className="text-xs text-background/60 truncate">{track.artist_name}</p>
                </div>
                <span className="text-xs text-background/40">
                  {formatDuration(track.duration)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Now playing & controls */}
      <div className="p-4 bg-background/5 border-t border-background/10">
        {currentTrack ? (
          <>
            {/* Track info */}
            <div className="flex items-center gap-3 mb-3">
              <img
                src={currentTrack.image}
                alt={currentTrack.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{currentTrack.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-background/60 truncate">{currentTrack.artist_name}</p>
                  {showOnScreen ? (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <Tv className="w-3 h-3" />
                      กำลังเล่น
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-background/40">
                      <EyeOff className="w-3 h-3" />
                      ซ่อนบนจอ
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Volume */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-background/60 hover:text-background">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-background/20 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background"
                />
              </div>

              {/* Play controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 text-background hover:bg-background/20"
                  onClick={handlePrevious}
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button
                  variant="hero"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 text-background hover:bg-background/20"
                  onClick={handleNext}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              {/* Spacer for alignment */}
              <div className="w-20" />
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-background/60">
            <Tv className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">เลือกเพลงเพื่อเล่นบน Big Screen</p>
          </div>
        )}
      </div>
    </div>
  );
}
