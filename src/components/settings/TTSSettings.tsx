import { useState, useEffect, useCallback } from 'react';
import { Volume2, Play, Loader2, Settings2, Zap, Music, User } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, updateTTSSettings, DEFAULT_TTS_SETTINGS, VAJA_SPEAKERS } from '@/lib/firestore';

interface TTSSettingsProps {
  isDark: boolean;
}

export function TTSSettings({ isDark }: TTSSettingsProps) {
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // TTS Settings state
  const [settings, setSettings] = useState({
    enabled: DEFAULT_TTS_SETTINGS.enabled,
    speed: DEFAULT_TTS_SETTINGS.speed,
    speaker: DEFAULT_TTS_SETTINGS.speaker,
    nfeSteps: DEFAULT_TTS_SETTINGS.nfeSteps,
    useVajax: DEFAULT_TTS_SETTINGS.useVajax,
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
            speaker: userSettings.tts.speaker ?? DEFAULT_TTS_SETTINGS.speaker,
            nfeSteps: userSettings.tts.nfeSteps ?? DEFAULT_TTS_SETTINGS.nfeSteps,
            useVajax: userSettings.tts.useVajax ?? DEFAULT_TTS_SETTINGS.useVajax,
          });
        }
      } catch (err) {
        console.error('Error loading TTS settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [userProfile?.lineUserId]);

  // Save settings to Firebase
  const saveSettings = useCallback(async (newSettings: typeof settings) => {
    if (!userProfile?.lineUserId) return;
    
    setIsSaving(true);
    try {
      await updateTTSSettings(userProfile.lineUserId, newSettings);
      setError(null);
    } catch (err) {
      console.error('Error saving TTS settings:', err);
      setError('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setIsSaving(false);
    }
  }, [userProfile?.lineUserId]);

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

  // Fallback: Web Speech API
  const speakWithWebSpeech = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = settings.speed;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      window.speechSynthesis.speak(utterance);
    });
  }, [settings.speed]);

  // Play preview
  const playPreview = useCallback(async () => {
    if (!userProfile?.nickname && !userProfile?.displayName) return;
    
    setIsPlaying(true);
    setError(null);
    
    const userName = userProfile.nickname || userProfile.displayName || 'คุณ';
    const previewText = `เอาล่ะ พร้อมออกกำลังกายยัง ${userName}`;
    
    try {
      // Try TTS API first (VAJA)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch('/api/aift/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: previewText,
          speaker: settings.speaker,
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
      
      // Fallback: Web Speech API
      console.warn('TTS API failed, using Web Speech...');
      await speakWithWebSpeech(previewText);
      
    } catch (err: any) {
      console.error('Preview error:', err);
      // Try Web Speech as last resort
      await speakWithWebSpeech(previewText);
    } finally {
      setIsPlaying(false);
    }
  }, [userProfile, playAudioBase64, speakWithWebSpeech]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
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
          isDark ? "bg-blue-500/20" : "bg-blue-100"
        )}>
          <Volume2 className={cn("w-5 h-5", isDark ? "text-blue-400" : "text-blue-600")} />
        </div>
        <div>
          <h2 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
            ตั้งค่าเสียงโค้ช (TTS)
          </h2>
          <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
            ปรับแต่งเสียงของน้องกาย AI Coach
          </p>
        </div>
        {isSaving && (
          <Loader2 className="w-4 h-4 animate-spin ml-auto text-primary" />
        )}
      </div>

      {/* Settings */}
      <div className={cn("divide-y", isDark ? "divide-white/10" : "divide-gray-100")}>
        {/* Enable TTS */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
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

        {/* Speaker Selection */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <User className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
            <div>
              <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                เลือกเสียงโค้ช
              </p>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                {VAJA_SPEAKERS.find(s => s.id === settings.speaker)?.description || 'เลือกเสียงที่ต้องการ'}
              </p>
            </div>
          </div>
          <select
            value={settings.speaker}
            onChange={(e) => handleSettingChange('speaker', e.target.value)}
            disabled={!settings.enabled}
            className={cn(
              "w-full p-3 rounded-xl border text-sm transition-colors",
              isDark 
                ? "bg-white/5 border-white/20 text-white disabled:opacity-50" 
                : "bg-gray-50 border-gray-200 text-gray-900 disabled:opacity-50",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
          >
            {VAJA_SPEAKERS.map((speaker) => (
              <option key={speaker.id} value={speaker.id} className={isDark ? "bg-gray-900" : ""}>
                {speaker.name} - {speaker.description}
              </option>
            ))}
          </select>
        </div>

        {/* Use VAJAX (High Quality) - Hidden for now, requires reference audio */}
        {/* 
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className={cn("w-5 h-5", isDark ? "text-yellow-400" : "text-yellow-500")} />
            <div>
              <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                เสียงคุณภาพสูง (VAJAX)
              </p>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                เสียงสังเคราะห์เหมือนจริงมากขึ้น
              </p>
            </div>
          </div>
          <Switch
            checked={settings.useVajax}
            onCheckedChange={(checked) => handleSettingChange('useVajax', checked)}
            disabled={!settings.enabled}
          />
        </div>
        */}

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

        {/* Quality (NFE Steps) - Hidden, only for VAJAX */}
        {/* settings.useVajax && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Volume2 className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
                <div>
                  <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                    คุณภาพเสียง
                  </p>
                  <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                    {settings.nfeSteps <= 24 ? 'เร็ว' : settings.nfeSteps <= 40 ? 'สมดุล' : 'คุณภาพสูง'}
                  </p>
                </div>
              </div>
            </div>
            <Slider
              value={[settings.nfeSteps]}
              onValueChange={([value]) => handleSettingChange('nfeSteps', value)}
              min={16}
              max={64}
              step={8}
              disabled={!settings.enabled}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>เร็ว</span>
              <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>คุณภาพสูง</span>
            </div>
          </div>
        ) */}

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
                ทดสอบเสียง
              </>
            )}
          </Button>
          <p className={cn(
            "text-xs text-center mt-2",
            isDark ? "text-gray-500" : "text-gray-400"
          )}>
            "เอาล่ะ พร้อมออกกำลังกายยัง {userProfile?.nickname || userProfile?.displayName || 'คุณ'}"
          </p>
          
          {error && (
            <p className="text-xs text-center mt-2 text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TTSSettings;
