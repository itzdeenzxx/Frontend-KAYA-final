import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Check, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Coach, getCoachesByGender, getCoachById } from '@/lib/coachConfig';
import { getCoachAvatar } from './CoachAvatars';
import { useTTS } from '@/hooks/useTTS';
import { getLocalAudioUrl } from '@/lib/coachAudio';

interface CoachSelectorProps {
  selectedCoachId?: string;
  onSelect: (coachId: string) => void;
  showPreview?: boolean;
  className?: string;
}

export const CoachSelector = ({
  selectedCoachId,
  onSelect,
  showPreview = true,
  className,
}: CoachSelectorProps) => {
  const [playingCoachId, setPlayingCoachId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'female' | 'male'>('female');
  const { speak, stop, isSpeaking } = useTTS();

  const femaleCoaches = getCoachesByGender('female');
  const maleCoaches = getCoachesByGender('male');

  useEffect(() => {
    const selectedCoach = selectedCoachId ? getCoachById(selectedCoachId) : undefined;
    if (selectedCoach?.gender === 'male') {
      setCurrentTab('male');
    } else {
      setCurrentTab('female');
    }
  }, [selectedCoachId]);

  useEffect(() => {
    return () => {
      stop();
      // Stop any local audio element on unmount to prevent memory leaks
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, [stop]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudioBase64 = useCallback((base64: string): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const audioData = atob(base64);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(audioUrl); audioRef.current = null; resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(audioUrl); audioRef.current = null; resolve(); };
        audio.play().catch(() => resolve());
      } catch { resolve(); }
    });
  }, []);

  const handlePreviewVoice = async (coach: Coach) => {
    if (playingCoachId === coach.id) {
      stop();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setPlayingCoachId(null);
      return;
    }

    // Stop any currently playing audio before starting a new one
    stop();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingCoachId(coach.id);
    try {
      // Try local pre-recorded greeting first (instant, no network needed)
      const localUrl = getLocalAudioUrl(coach.id, 'greeting');
      if (localUrl) {
        const played = await new Promise<boolean>((resolve) => {
          if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
          const audio = new Audio(localUrl);
          audioRef.current = audio;
          audio.onended = () => { audioRef.current = null; resolve(true); };
          audio.onerror = () => { audioRef.current = null; resolve(false); };
          audio.play().catch(() => { audioRef.current = null; resolve(false); });
        });
        if (played) return;
        // Local file failed — fall through to TTS API below
      }
      // Fallback: Call Botnoi TTS API with the coach's voiceId
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch('/api/aift/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: coach.sampleGreeting,
          speaker: coach.voiceId,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.audio_base64) {
          console.log('🔊 Preview voice:', coach.name, 'speaker:', coach.voiceId);
          await playAudioBase64(result.audio_base64);
          return;
        }
      }
      console.warn('Preview TTS failed for', coach.name);
    } catch (err: any) {
      console.warn('Preview error:', err.name === 'AbortError' ? 'timeout' : err.message);
    } finally {
      setPlayingCoachId(null);
    }
  };

  const renderCoachCard = (coach: Coach) => {
    const AvatarComponent = getCoachAvatar(coach.id);
    const isSelected = selectedCoachId === coach.id;
    const isPlaying = playingCoachId === coach.id;

    return (
      <Card
        key={coach.id}
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-lg relative overflow-hidden h-full flex flex-col',
          isSelected
            ? 'ring-2 ring-primary bg-primary/5'
            : 'hover:bg-muted/50'
        )}
        onClick={() => onSelect(coach.id)}
      >
        {isSelected && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-primary text-white">
              <Check className="w-3 h-3 mr-1" />
              เลือกแล้ว
            </Badge>
          </div>
        )}
        
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex flex-col items-center text-center space-y-3 flex-1">
            <div
              className={cn(
                'rounded-full p-1 transition-transform duration-200',
                isSelected && 'scale-110'
              )}
              style={{ 
                backgroundColor: coach.color + '20',
                boxShadow: isSelected ? `0 0 0 4px ${coach.color}40` : 'none'
              }}
            >
              <AvatarComponent size={80} />
            </div>

            <div>
              <h3 className="font-bold text-lg">{coach.nameTh}</h3>
              <p className="text-sm text-muted-foreground">({coach.name})</p>
            </div>

            <Badge
              variant="outline"
              style={{ borderColor: coach.color, color: coach.color }}
            >
              {coach.personality}
            </Badge>

            <p className="text-xs text-muted-foreground line-clamp-2">
              {coach.descriptionTh}
            </p>

            <div className="flex flex-wrap gap-1 justify-center">
              {coach.traitsTh.slice(0, 3).map((trait, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>

          {showPreview && (
            <Button
              size="sm"
              variant={isPlaying ? 'default' : 'outline'}
              className="w-full mt-3"
              onClick={(e) => {
                e.stopPropagation();
                handlePreviewVoice(coach);
              }}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  หยุด
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  ฟังเสียงตัวอย่าง
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('w-full', className)}>
      <Tabs
        value={currentTab}
        onValueChange={(v) => {
          // Stop any playing audio when switching tabs
          stop();
          if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
          setPlayingCoachId(null);
          setCurrentTab(v as 'female' | 'male');
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="female" className="flex items-center gap-2">
            <span>👩</span>
            โค้ชผู้หญิง
          </TabsTrigger>
          <TabsTrigger value="male" className="flex items-center gap-2">
            <span>👨</span>
            โค้ชผู้ชาย
          </TabsTrigger>
        </TabsList>

        <TabsContent value="female">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {femaleCoaches.map(renderCoachCard)}
          </div>
        </TabsContent>

        <TabsContent value="male">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {maleCoaches.map(renderCoachCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoachSelector;
