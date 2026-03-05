import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Upload, Trash2, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateCustomVoiceSettings, getCustomVoiceSettings } from '@/lib/firestore';

interface VoiceRecorderProps {
  userId: string;
  isDark: boolean;
  onCustomVoiceChange?: (enabled: boolean) => void;
}

const RECORD_DURATION = 10; // seconds
const SAMPLE_SCRIPT = 'สวัสดีค่ะ วันนี้เราจะมาออกกำลังกายด้วยกันนะคะ ตั้งใจทำให้เต็มที่ สู้สู้ เราทำได้';

export function VoiceRecorder({ userId, isDark, onCustomVoiceChange }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customCoachName, setCustomCoachName] = useState('');
  const [hasExistingVoice, setHasExistingVoice] = useState(false);
  const [existingVoiceUrl, setExistingVoiceUrl] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load existing custom voice settings
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const existing = await getCustomVoiceSettings(userId);
        if (existing.customVoiceRefUrl) {
          setHasExistingVoice(true);
          setExistingVoiceUrl(existing.customVoiceRefUrl);
          setCustomCoachName(existing.customCoachName || '');
        }
      } catch (err) {
        console.error('Error loading custom voice:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadExisting();
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    setSuccess(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // Convert webm to wav using AudioContext
        try {
          const wavBlob = await convertToWav(blob);
          setAudioBlob(wavBlob);
          const url = URL.createObjectURL(wavBlob);
          setAudioUrl(url);
        } catch {
          // Fallback: use webm directly
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        }
      };

      mediaRecorder.start(100); // collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= RECORD_DURATION - 1) {
            // Auto-stop at 10 seconds
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return RECORD_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Mic error:', err);
      setError('ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาอนุญาตการใช้งานไมค์');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Convert webm blob to WAV (24kHz, mono, 16-bit)
  const convertToWav = async (webmBlob: Blob): Promise<Blob> => {
    const audioContext = new AudioContext({ sampleRate: 24000 });
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get mono channel data
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = 24000;

    // Resample if needed
    let samples: Float32Array;
    if (audioBuffer.sampleRate !== sampleRate) {
      const ratio = audioBuffer.sampleRate / sampleRate;
      const newLength = Math.round(channelData.length / ratio);
      samples = new Float32Array(newLength);
      for (let i = 0; i < newLength; i++) {
        const srcIndex = Math.min(Math.round(i * ratio), channelData.length - 1);
        samples[i] = channelData[srcIndex];
      }
    } else {
      samples = channelData;
    }

    // Convert to 16-bit PCM
    const pcmData = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Create WAV file
    const wavBuffer = new ArrayBuffer(44 + pcmData.byteLength);
    const view = new DataView(wavBuffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.byteLength, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.byteLength, true);

    // Write PCM data
    const pcmBytes = new Uint8Array(pcmData.buffer);
    new Uint8Array(wavBuffer).set(pcmBytes, 44);

    audioContext.close();
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const playRecording = useCallback(() => {
    const url = audioUrl || existingVoiceUrl;
    if (!url) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play().catch(() => setIsPlaying(false));
  }, [audioUrl, existingVoiceUrl]);

  const uploadVoice = useCallback(async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload to Firebase Storage: {userId}/sound-ref/voice-ref.wav
      const storageRef = ref(storage, `${userId}/sound-ref/voice-ref.wav`);
      await uploadBytes(storageRef, audioBlob, {
        contentType: 'audio/wav',
      });

      const downloadUrl = await getDownloadURL(storageRef);

      // Save to Firestore
      await updateCustomVoiceSettings(userId, {
        customVoiceEnabled: true,
        customVoiceRefUrl: downloadUrl,
        customVoiceRefText: SAMPLE_SCRIPT,
        customCoachName: customCoachName || 'โค้ชของฉัน',
      });

      setHasExistingVoice(true);
      setExistingVoiceUrl(downloadUrl);
      setSuccess('บันทึกเสียงสำเร็จ! ระบบจะใช้เสียงของคุณเป็นโค้ช');
      setAudioBlob(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      onCustomVoiceChange?.(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('ไม่สามารถอัปโหลดเสียงได้ กรุณาลองใหม่');
    } finally {
      setIsUploading(false);
    }
  }, [audioBlob, audioUrl, userId, customCoachName, onCustomVoiceChange]);

  const deleteVoice = useCallback(async () => {
    setError(null);
    setSuccess(null);

    try {
      // Delete from Firebase Storage
      const storageRef = ref(storage, `${userId}/sound-ref/voice-ref.wav`);
      try {
        await deleteObject(storageRef);
      } catch {
        // File might not exist, ignore
      }

      // Update Firestore
      await updateCustomVoiceSettings(userId, {
        customVoiceEnabled: false,
        customVoiceRefUrl: '',
        customVoiceRefText: '',
        customCoachName: '',
      });

      setHasExistingVoice(false);
      setExistingVoiceUrl('');
      setCustomCoachName('');
      setSuccess('ลบเสียงเรียบร้อยแล้ว');
      onCustomVoiceChange?.(false);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError('ไม่สามารถลบเสียงได้');
    }
  }, [userId, onCustomVoiceChange]);

  const discardRecording = useCallback(() => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
    setError(null);
    setSuccess(null);
  }, [audioUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Custom Coach Name */}
      <div>
        <label className={cn("text-sm font-medium mb-1 block", isDark ? "text-gray-300" : "text-gray-700")}>
          ตั้งชื่อโค้ชของคุณ
        </label>
        <Input
          value={customCoachName}
          onChange={(e) => setCustomCoachName(e.target.value)}
          placeholder="เช่น โค้ชเจ, โค้ชมาย"
          className={cn(
            "h-10",
            isDark ? "bg-white/5 border-white/10 text-white" : ""
          )}
          maxLength={20}
        />
      </div>

      {/* Script to read */}
      <div className={cn(
        "rounded-xl p-3 border",
        isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"
      )}>
        <p className={cn("text-xs font-medium mb-1", isDark ? "text-blue-400" : "text-blue-600")}>
          📝 อ่านข้อความนี้ขณะอัดเสียง:
        </p>
        <p className={cn("text-sm leading-relaxed", isDark ? "text-blue-200" : "text-blue-800")}>
          "{SAMPLE_SCRIPT}"
        </p>
      </div>

      {/* Existing voice status */}
      {hasExistingVoice && !audioBlob && (
        <div className={cn(
          "rounded-xl p-3 border flex items-center gap-3",
          isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"
        )}>
          <CheckCircle className={cn("w-5 h-5 flex-shrink-0", isDark ? "text-green-400" : "text-green-600")} />
          <div className="flex-1">
            <p className={cn("text-sm font-medium", isDark ? "text-green-300" : "text-green-700")}>
              มีเสียงอ้างอิงแล้ว
            </p>
            <p className={cn("text-xs", isDark ? "text-green-400/70" : "text-green-600/70")}>
              {customCoachName ? `โค้ช: ${customCoachName}` : 'ระบบจะใช้เสียงของคุณเป็นเสียงโค้ช'}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={playRecording}
              disabled={isPlaying}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={deleteVoice}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Recording controls */}
      {!audioBlob ? (
        <div className="flex flex-col items-center gap-3">
          {/* Record button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all",
              isRecording
                ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/30"
                : isDark
                  ? "bg-primary/20 hover:bg-primary/30 border-2 border-primary/50"
                  : "bg-primary/10 hover:bg-primary/20 border-2 border-primary/30"
            )}
          >
            {isRecording ? (
              <Square className="w-8 h-8 text-white" />
            ) : (
              <Mic className={cn("w-8 h-8", isDark ? "text-primary" : "text-primary")} />
            )}
          </button>

          {/* Recording time / instruction */}
          {isRecording ? (
            <div className="text-center">
              <p className={cn("text-2xl font-mono font-bold", "text-red-400")}>
                {recordingTime}s / {RECORD_DURATION}s
              </p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                กำลังอัดเสียง... อ่านข้อความด้านบน
              </p>
              {/* Progress bar */}
              <div className="w-48 h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(recordingTime / RECORD_DURATION) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
              กดเพื่อเริ่มอัดเสียง ({RECORD_DURATION} วินาที)
            </p>
          )}
        </div>
      ) : (
        /* Preview & Upload controls */
        <div className="space-y-3">
          <div className={cn(
            "rounded-xl p-3 border flex items-center gap-3",
            isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
          )}>
            <Button
              size="sm"
              variant="ghost"
              onClick={playRecording}
              disabled={isPlaying}
              className="h-10 w-10 p-0 rounded-full"
            >
              {isPlaying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            <div className="flex-1">
              <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                เสียงที่อัดเสร็จ
              </p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                {recordingTime} วินาที • WAV 24kHz
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={discardRecording}
              className="flex-1 gap-1"
              disabled={isUploading}
            >
              <Trash2 className="w-4 h-4" />
              อัดใหม่
            </Button>
            <Button
              onClick={uploadVoice}
              disabled={isUploading}
              className="flex-1 gap-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  บันทึกเสียง
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error / Success messages */}
      {error && (
        <div className={cn(
          "rounded-lg p-2 flex items-center gap-2 text-sm",
          "bg-red-500/10 text-red-400"
        )}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className={cn(
          "rounded-lg p-2 flex items-center gap-2 text-sm",
          "bg-green-500/10 text-green-400"
        )}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;
