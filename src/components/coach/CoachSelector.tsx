import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Check, Volume2, Plus, Pencil, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COACHES, Coach, getCoachesByGender, getCoachById, CustomCoach, buildCoachFromCustom, CustomAvatarId } from '@/lib/coachConfig';
import { getCoachAvatar } from './CoachAvatars';
import { getCustomAvatar } from './CustomAvatars';
import { useTTS } from '@/hooks/useTTS';
import { getCustomCoach } from '@/lib/firestore';

interface CoachSelectorProps {
  userId?: string;
  selectedCoachId?: string;
  onSelect: (coachId: string) => void;
  onCreateCustom?: () => void;
  onEditCustom?: () => void;
  showPreview?: boolean;
  className?: string;
}

export const CoachSelector = ({
  userId,
  selectedCoachId,
  onSelect,
  onCreateCustom,
  onEditCustom,
  showPreview = true,
  className,
}: CoachSelectorProps) => {
  const [playingCoachId, setPlayingCoachId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'female' | 'male' | 'custom'>('female');
  const [customCoach, setCustomCoach] = useState<CustomCoach | null>(null);
  const { speak, stop, isSpeaking } = useTTS();

  const femaleCoaches = getCoachesByGender('female');
  const maleCoaches = getCoachesByGender('male');

  // Load custom coach if exists
  useEffect(() => {
    const loadCustom = async () => {
      if (!userId) return;
      try {
        const custom = await getCustomCoach(userId);
        setCustomCoach(custom);
        // If user selected custom coach, show that tab
        if (selectedCoachId === 'coach-custom' && custom) {
          setCurrentTab('custom');
        }
      } catch (e) {
        console.error('Error loading custom coach:', e);
      }
    };
    loadCustom();
  }, [userId, selectedCoachId]);

  useEffect(() => {
    return () => { stop(); };
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

    setPlayingCoachId(coach.id);
    try {
      // Call Botnoi TTS directly with the coach's voiceId
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

  // Preview custom coach voice using VAJAX if voice refs exist, else Gemini TTS
  const handlePreviewCustomVoice = async () => {
    if (!customCoach) return;
    const builtCoach = buildCoachFromCustom(customCoach);

    if (playingCoachId === 'coach-custom') {
      stop();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setPlayingCoachId(null);
      return;
    }

    setPlayingCoachId('coach-custom');
    try {
      // If custom coach has voice refs → VAJAX voice cloning
      if (customCoach.voiceRefs?.length > 0) {
        const primaryRef = customCoach.voiceRefs[0];
        try {
          const vajaxRes = await fetch('/api/aift/vajax-tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: builtCoach.sampleGreeting,
              referenceAudioUrl: primaryRef.audioUrl,
              referenceText: primaryRef.refText,
              speed: 1.0,
              nfeSteps: 32,
            }),
          });
          if (vajaxRes.ok) {
            const result = await vajaxRes.json();
            if (result.success && result.audio_base64) {
              await playAudioBase64(result.audio_base64);
              return;
            }
          }
        } catch (err) {
          console.warn('VAJAX custom preview failed:', err);
        }
      }

      // Fallback: Gemini TTS
      await speak(builtCoach.sampleGreeting);
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
          'cursor-pointer transition-all duration-200 hover:shadow-lg relative overflow-hidden',
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
        
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-3">
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

            {showPreview && (
              <Button
                size="sm"
                variant={isPlaying ? 'default' : 'outline'}
                className="w-full mt-2"
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
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render custom coach card or create button
  const renderCustomCoachSection = () => {
    if (customCoach) {
      const isSelected = selectedCoachId === 'coach-custom';
      const CustomAvatar = getCustomAvatar(customCoach.avatarId as CustomAvatarId);

      return (
        <div className="space-y-4">
          {/* Existing custom coach card */}
          <Card
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-lg relative overflow-hidden',
              isSelected
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-muted/50'
            )}
            onClick={() => onSelect('coach-custom')}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-primary text-white">
                  <Check className="w-3 h-3 mr-1" />
                  เลือกแล้ว
                </Badge>
              </div>
            )}
            
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="rounded-full p-1 flex-shrink-0"
                  style={{ 
                    backgroundColor: customCoach.color + '20',
                    boxShadow: isSelected ? `0 0 0 4px ${customCoach.color}40` : 'none'
                  }}
                >
                  <CustomAvatar size={80} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg">{customCoach.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {customCoach.personality || 'โค้ชที่คุณสร้างเอง'}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" style={{ borderColor: customCoach.color, color: customCoach.color }}>
                      กำหนดเอง
                    </Badge>
                    {customCoach.voiceRefs?.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        🎤 เสียงของฉัน
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview voice */}
          {showPreview && (
            <Button
              size="sm"
              variant={playingCoachId === 'coach-custom' ? 'default' : 'outline'}
              className="w-full gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handlePreviewCustomVoice();
              }}
            >
              {playingCoachId === 'coach-custom' ? (
                <><Pause className="w-4 h-4" /> หยุด</>
              ) : (
                <><Volume2 className="w-4 h-4" /> ฟังเสียงตัวอย่าง{customCoach?.voiceRefs?.length ? ' (เสียงของฉัน)' : ''}</>
              )}
            </Button>
          )}

          {/* Edit button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onEditCustom?.();
            }}
          >
            <Pencil className="w-4 h-4" />
            แก้ไขโค้ชของฉัน
          </Button>
        </div>
      );
    }

    // No custom coach yet - show create button
    return (
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-lg border-dashed border-2',
          'hover:border-primary/50'
        )}
        onClick={() => onCreateCustom?.()}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">สร้างโค้ชของฉัน</h3>
              <p className="text-sm text-muted-foreground mt-1">
                กำหนดชื่อ รูปร่าง บุคลิก และเสียงเอง
              </p>
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
              <Badge variant="secondary" className="text-xs">✏️ ตั้งชื่อ</Badge>
              <Badge variant="secondary" className="text-xs">🎨 เลือกรูป</Badge>
              <Badge variant="secondary" className="text-xs">💬 กำหนดบุคลิก</Badge>
              <Badge variant="secondary" className="text-xs">🎤 อัดเสียง</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('w-full', className)}>
      <Tabs
        value={currentTab}
        onValueChange={(v) => setCurrentTab(v as 'female' | 'male' | 'custom')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="female" className="flex items-center gap-2">
            <span>👩</span>
            โค้ชผู้หญิง
          </TabsTrigger>
          <TabsTrigger value="male" className="flex items-center gap-2">
            <span>👨</span>
            โค้ชผู้ชาย
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            โค้ชของฉัน
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

        <TabsContent value="custom">
          {renderCustomCoachSection()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoachSelector;
