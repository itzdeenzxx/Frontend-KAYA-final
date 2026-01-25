import { useState, useRef, useEffect, useCallback } from 'react';
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

interface MusicPlayerProps {
  className?: string;
  compact?: boolean;
  autoPlay?: boolean;
}

export default function MusicPlayer({ className, compact = false, autoPlay = false }: MusicPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<JamendoTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playlist, setPlaylist] = useState<JamendoTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { tracks, isLoading, error, searchTracks, getTracksByGenre, getWorkoutTracks, clearTracks } =
    useJamendo();

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      handleNext();
    });

    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    // Load workout tracks on mount
    getWorkoutTracks();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Auto-play first track when autoPlay is true and tracks are loaded
  useEffect(() => {
    if (autoPlay && tracks.length > 0 && !currentTrack) {
      // Pick a random track
      const randomIndex = Math.floor(Math.random() * tracks.length);
      const track = tracks[randomIndex];
      setCurrentTrack(track);
      setCurrentIndex(randomIndex);
      setPlaylist(tracks);
      
      // Start playing
      if (audioRef.current) {
        audioRef.current.src = track.audio;
        audioRef.current.play().catch(console.error);
      }
    }
  }, [autoPlay, tracks, currentTrack]);

  // Update playlist when tracks change
  useEffect(() => {
    if (tracks.length > 0) {
      setPlaylist(tracks);
    }
  }, [tracks]);

  // Update audio source when current track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.audio;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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

  const handlePlayTrack = useCallback((track: JamendoTrack, index: number) => {
    setCurrentTrack(track);
    setCurrentIndex(index);
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.src = track.audio;
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (!currentTrack && playlist.length > 0) {
        handlePlayTrack(playlist[0], 0);
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    handlePlayTrack(playlist[nextIndex], nextIndex);
  }, [currentIndex, playlist, handlePlayTrack]);

  const handlePrevious = useCallback(() => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    handlePlayTrack(playlist[prevIndex], prevIndex);
  }, [currentIndex, playlist, handlePlayTrack]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
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
                <p className="text-sm text-background/60 truncate">{currentTrack.artist_name}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-background/60 w-10">
                {formatDuration(Math.floor(currentTime))}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-background/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <span className="text-xs text-background/60 w-10 text-right">
                {formatDuration(Math.floor(duration))}
              </span>
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
            <p className="text-sm">เลือกเพลงจากรายการด้านบน</p>
          </div>
        )}
      </div>
    </div>
  );
}
