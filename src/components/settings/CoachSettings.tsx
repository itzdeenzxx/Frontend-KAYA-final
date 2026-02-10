import { useState, useEffect, useCallback } from 'react';
import { Volume2, Play, Loader2, Settings2, Sparkles, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, updateTTSSettings, DEFAULT_TTS_SETTINGS, getCustomCoach } from '@/lib/firestore';
import { getCoachById, Coach, buildCoachFromCustom, CustomCoach, CustomAvatarId } from '@/lib/coachConfig';
import { getCoachAvatar } from '@/components/coach/CoachAvatars';
import { getCustomAvatar } from '@/components/coach/CustomAvatars';
import { CoachSelectionPopup } from '@/components/coach/CoachSelectionPopup';

interface CoachSettingsProps {
  isDark: boolean;
}

export function CoachSettings({ isDark }: CoachSettingsProps) {
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCoachSelector, setShowCoachSelector] = useState(false);
  
  // Selected coach
  const [selectedCoachId, setSelectedCoachId] = useState<string>('coach-nana');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [customCoachData, setCustomCoachData] = useState<CustomCoach | null>(null);
  
  // TTS Settings state
  const [settings, setSettings] = useState({
    enabled: DEFAULT_TTS_SETTINGS.enabled,
    speed: DEFAULT_TTS_SETTINGS.speed,
  });

  // Load settings from Firebase
  useEffect(() => {
    const loadSettings = async () => {
      if (!userProfile?.lineUserId) return;
      
      try {
        const userSettings = await getUserSettings(userProfile.lineUserId);
        if (userSettings?.tts) {
          setSettings({
            enabled: userSettings.tts.enabled ?? DEFAULT_TTS_SETTINGS.enabled,
            speed: userSettings.tts.speed ?? DEFAULT_TTS_SETTINGS.speed,
          });
        }
        if (userSettings?.selectedCoachId) {
          setSelectedCoachId(userSettings.selectedCoachId);
        }
        // Load custom coach data
        const custom = await getCustomCoach(userProfile.lineUserId);
        setCustomCoachData(custom);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [userProfile?.lineUserId]);

  // Update selected coach object when ID changes
  useEffect(() => {
    if (selectedCoachId === 'coach-custom' && customCoachData) {
      setSelectedCoach(buildCoachFromCustom(customCoachData));
    } else {
      const coach = getCoachById(selectedCoachId);
      setSelectedCoach(coach || null);
    }
  }, [selectedCoachId, customCoachData]);

  // Save TTS settings to Firebase
  const saveSettings = useCallback(async (newSettings: typeof settings) => {
    if (!userProfile?.lineUserId || !selectedCoach) return;
    
    setIsSaving(true);
    try {
      await updateTTSSettings(userProfile.lineUserId, {
        ...newSettings,
        speaker: selectedCoach.voiceId,
      });
      setError(null);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setIsSaving(false);
    }
  }, [userProfile?.lineUserId, selectedCoach]);

  // Handle settings change
  const handleSettingChange = useCallback(<K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  // Handle coach selection
  const handleCoachSelected = async (coachId: string) => {
    setSelectedCoachId(coachId);
    
    // Reload custom coach data if custom coach was selected/updated
    if (coachId === 'coach-custom' && userProfile?.lineUserId) {
      const custom = await getCustomCoach(userProfile.lineUserId);
      setCustomCoachData(custom);
    }
    
    // Update TTS settings with new coach voice
    if (userProfile?.lineUserId) {
      let voiceId = 'nana';
      if (coachId !== 'coach-custom') {
        const coach = getCoachById(coachId);
        if (coach) voiceId = coach.voiceId;
      }
      await updateTTSSettings(userProfile.lineUserId, {
        ...settings,
        speaker: voiceId,
      });
    }
  };

  // Play audio from base64
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
        
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.play().catch(() => resolve());
      } catch {
        resolve();
      }
    });
  }, []);

  // Play preview
  const playPreview = useCallback(async () => {
    if (!selectedCoach) return;
    
    setIsPlaying(true);
    setError(null);
    
    const previewText = selectedCoach.sampleGreeting;
    
    try {
      // If custom coach with voice refs → use VAJAX voice cloning
      const isCustomWithVoice = selectedCoachId === 'coach-custom' 
        && customCoachData?.voiceRefs?.length > 0;

      if (isCustomWithVoice) {
        const primaryRef = customCoachData!.voiceRefs[0];
        try {
          const vajaxController = new AbortController();
          const vajaxTimeout = setTimeout(() => vajaxController.abort(), 60000);

          const vajaxRes = await fetch('/api/aift/vajax-tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: previewText,
              referenceAudioUrl: primaryRef.audioUrl,
              referenceText: primaryRef.refText,
              speed: 1.0,
              nfeSteps: 32,
            }),
            signal: vajaxController.signal,
          });

          clearTimeout(vajaxTimeout);

          if (vajaxRes.ok) {
            const result = await vajaxRes.json();
            if (result.success && result.audio_base64) {
              console.log('✅ Preview: VAJAX custom voice success');
              await playAudioBase64(result.audio_base64);
              return;
            }
          }
          console.warn('VAJAX preview failed, falling back to Gemini');
        } catch (err: any) {
          console.warn('VAJAX preview error:', err.name === 'AbortError' ? 'timeout' : err.message);
        }
      }

      // Fallback: Gemini TTS (for preset coaches or custom without voice refs)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: previewText,
          voiceName: selectedCoach.geminiVoice || 'Kore',
          instruction: selectedCoach.ttsInstruction || '',
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
        
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.audio_base64) {
          await playAudioBase64(result.audio_base64);
          return;
        }
      }
      
      setError('ไม่สามารถเล่นเสียงได้');
    } catch (err: any) {
      console.error('Preview error:', err);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsPlaying(false);
    }
  }, [selectedCoach, selectedCoachId, customCoachData, playAudioBase64]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const AvatarComponent = selectedCoach
    ? selectedCoachId === 'coach-custom' && customCoachData
      ? getCustomAvatar(customCoachData.avatarId as CustomAvatarId)
      : getCoachAvatar(selectedCoach.id)
    : null;

  return (
    <>
      <div className={cn(
        "rounded-2xl overflow-hidden border",
        isDark 
          ? "bg-white/5 border-white/10" 
          : "bg-white border-gray-200 shadow-sm"
      )}>
        {/* Header */}
        <div className={cn(
          "p-4 border-b flex items-center gap-3",
          isDark ? "border-white/10" : "border-gray-100"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isDark ? "bg-purple-500/20" : "bg-purple-100"
          )}>
            <Sparkles className={cn("w-5 h-5", isDark ? "text-purple-400" : "text-purple-600")} />
          </div>
          <div>
            <h2 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
              ตั้งค่าโค้ช AI
            </h2>
            <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
              เลือกโค้ชและปรับแต่งเสียง
            </p>
          </div>
          {isSaving && (
            <Loader2 className="w-4 h-4 animate-spin ml-auto text-primary" />
          )}
        </div>

        {/* Settings */}
        <div className={cn("divide-y", isDark ? "divide-white/10" : "divide-gray-100")}>
          {/* Selected Coach Display */}
          <button
            onClick={() => setShowCoachSelector(true)}
            className={cn(
              "w-full p-4 flex items-center gap-4 transition-colors",
              isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
            )}
          >
            {/* Coach Avatar */}
            {AvatarComponent && (
              <div
                className="rounded-full p-1"
                style={{ backgroundColor: selectedCoach?.color + '20' }}
              >
                <AvatarComponent size={60} />
              </div>
            )}
            
            {/* Coach Info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className={cn("font-semibold text-lg", isDark ? "text-white" : "text-gray-900")}>
                  {selectedCoach?.nameTh}
                </p>
                <Badge
                  variant="outline"
                  style={{ 
                    borderColor: selectedCoach?.color,
                    color: selectedCoach?.color 
                  }}
                  className="text-xs"
                >
                  {selectedCoach?.personality}
                </Badge>
              </div>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                {selectedCoach?.descriptionTh}
              </p>
            </div>
            
            {/* Change button */}
            <div className="flex items-center gap-2">
              <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                เปลี่ยน
              </span>
              <ChevronRight className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
            </div>
          </button>

          {/* Enable TTS */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
              <div>
                <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                  เปิดใช้งานเสียงโค้ช
                </p>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                  ให้โค้ชพูดนำการออกกำลังกาย
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
            />
          </div>

          {/* Speed */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Settings2 className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
                <div>
                  <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                    ความเร็วเสียง
                  </p>
                  <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    {settings.speed === 1 ? 'ปกติ' : settings.speed < 1 ? 'ช้า' : 'เร็ว'} ({settings.speed}x)
                  </p>
                </div>
              </div>
            </div>
            <Slider
              value={[settings.speed]}
              onValueChange={([value]) => handleSettingChange('speed', value)}
              min={0.5}
              max={2.0}
              step={0.1}
              disabled={!settings.enabled}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>ช้า (0.5x)</span>
              <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>เร็ว (2.0x)</span>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4">
            <Button
              onClick={playPreview}
              disabled={!settings.enabled || isPlaying}
              className={cn(
                "w-full gap-2",
                isDark 
                  ? "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30" 
                  : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              {isPlaying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังเล่น...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  ฟังเสียงตัวอย่าง
                </>
              )}
            </Button>
            {selectedCoach && (
              <p className={cn(
                "text-xs text-center mt-2 italic",
                isDark ? "text-gray-500" : "text-gray-400"
              )}>
                "{selectedCoach.sampleGreeting}"
              </p>
            )}
            
            {error && (
              <p className="text-xs text-center mt-2 text-red-400">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Coach Selection Popup */}
      <CoachSelectionPopup
        open={showCoachSelector}
        onClose={() => setShowCoachSelector(false)}
        onCoachSelected={handleCoachSelected}
        canSkip={false}
      />
    </>
  );
}

export default CoachSettings;
