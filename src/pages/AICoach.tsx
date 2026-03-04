import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Mic, Send, Volume2, VolumeX, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import aiCoach from "@/assets/ai-coach.png";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: number;
  type: "user" | "coach";
  text: string;
  imageUrl?: string;
  meta?: {
    kind: "text" | "vision" | "voice";
    transcript?: string;
  };
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: 1,
    type: "coach",
    text: "สวัสดี! ฉันคือ AI Coach ของคุณ 🙂 อยากให้ช่วยเรื่องโปรแกรมออกกำลังกาย โภชนาการ หรือแรงบันดาลใจแบบไหนบอกได้เลย",
    timestamp: new Date(),
  },
];

const DEFAULT_CONTEXT =
  "คุณคือโค้ชฟิตเนสที่ช่วยผู้ใช้แบบสุภาพ กระชับ และปลอดภัย ให้คำแนะนำทั่วไป ไม่อ้างว่าแทนแพทย์ หากมีอาการเจ็บ/เวียนหัวให้แนะนำหยุดและพบแพทย์";

function formatTime(ts: Date) {
  return ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function aiftTextChat(params: { prompt: string; sessionId: string; context?: string }) {
  const res = await fetch("/api/aift/text-chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      prompt: params.prompt,
      sessionId: params.sessionId,
      context: params.context ?? "",
      temperature: 0.4,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "AIFT text chat failed");
  return String(json?.response || "");
}

async function aiftVqa(params: { file: File; query: string }) {
  const form = new FormData();
  form.append("file", params.file);
  form.append("query", params.query);
  const res = await fetch("/api/aift/vqa", { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "AIFT VQA failed");
  return json;
}

async function aiftAudioQa(params: { file: File; instruction: string }) {
  const form = new FormData();
  form.append("file", params.file);
  form.append("instruction", params.instruction);
  const res = await fetch("/api/aift/audioqa", { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "AIFT AudioQA failed");
  return json;
}

async function aiftTts(text: string) {
  const res = await fetch("/api/aift/tts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, speaker: "29" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Botnoi TTS failed");
  }
  const json = await res.json();
  if (json.audio_base64) {
    const audioData = atob(json.audio_base64);
    const audioArray = new Uint8Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      audioArray[i] = audioData.charCodeAt(i);
    }
    const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
    return URL.createObjectURL(audioBlob);
  }
  throw new Error("No audio data from TTS");
}

function encodeWavFromAudioBuffer(audioBuffer: AudioBuffer) {
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);

  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

async function webmBlobToWavFile(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const wavBuffer = encodeWavFromAudioBuffer(decoded);
  return new File([wavBuffer], "voice.wav", { type: "audio/wav" });
}

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [activeTab, setActiveTab] = useState<"text" | "vision" | "voice">("text");
  const [inputText, setInputText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string>("");

  // Vision state
  const [visionFile, setVisionFile] = useState<File | null>(null);
  const [visionPreviewUrl, setVisionPreviewUrl] = useState<string>("");
  const [visionQuery, setVisionQuery] = useState<string>("");

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "recording" | "transcribing" | "thinking" | "speaking">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();

  const sessionId = useMemo(() => {
    const existing = localStorage.getItem("kaya_ai_sessionid");
    if (existing) return existing;
    const next = (crypto as any)?.randomUUID ? crypto.randomUUID() : String(Date.now());
    localStorage.setItem("kaya_ai_sessionid", next);
    return next;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (visionPreviewUrl) URL.revokeObjectURL(visionPreviewUrl);
    };
  }, [visionPreviewUrl]);

  const pushMessage = (msg: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: prev.length ? prev[prev.length - 1].id + 1 : 1 }]);
  };

  const sendText = async (text: string, kind: Message["meta"]["kind"] = "text") => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setError("");
    pushMessage({
      type: "user",
      text: trimmed,
      meta: { kind },
      timestamp: new Date(),
    });

    setIsTyping(true);
    try {
      const reply = await aiftTextChat({ prompt: trimmed, sessionId, context: DEFAULT_CONTEXT });
      pushMessage({
        type: "coach",
        text: reply || "(ไม่มีข้อความตอบกลับ)",
        meta: { kind: "text" },
        timestamp: new Date(),
      });

      if (!isMuted) {
        try {
          const audioUrl = await aiftTts(reply);
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            await audioRef.current.play();
            setTimeout(() => URL.revokeObjectURL(audioUrl), 60_000);
          }
        } catch {
          // ignore TTS errors; chat should still work
        }
      }
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    void sendText(inputText, "text");
    setInputText("");
  };

  const handleVisionSend = async () => {
    if (!visionFile) {
      setError("กรุณาเลือกรูปก่อน");
      return;
    }
    if (!visionQuery.trim()) {
      setError("กรุณาพิมพ์คำถามเกี่ยวกับรูป");
      return;
    }

    setError("");

    const preview = visionPreviewUrl;
    pushMessage({
      type: "user",
      text: visionQuery.trim(),
      imageUrl: preview,
      meta: { kind: "vision" },
      timestamp: new Date(),
    });

    setIsTyping(true);
    try {
      const res = await aiftVqa({ file: visionFile, query: visionQuery.trim() });
      const answer = String(res?.content || res?.response || res?.result || "");
      pushMessage({
        type: "coach",
        text: answer || "(ไม่มีข้อความตอบกลับ)",
        meta: { kind: "vision" },
        timestamp: new Date(),
      });
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("อุปกรณ์นี้ไม่รองรับไมโครโฟน");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    mediaChunksRef.current = [];

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) mediaChunksRef.current.push(ev.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || "audio/webm" });

      try {
        setVoiceStatus("transcribing");
        const wavFile = await webmBlobToWavFile(blob);
        const sttRes = await aiftAudioQa({ file: wavFile, instruction: "ถอดเสียงข้อความ" });
        const content = sttRes?.content;
        const transcript = Array.isArray(content) ? content.join(" ") : String(content || "");
        const cleaned = transcript.trim();

        if (!cleaned) {
          setError("ถอดเสียงไม่สำเร็จ ลองพูดใหม่อีกครั้ง");
          setVoiceStatus("idle");
          return;
        }

        pushMessage({
          type: "user",
          text: cleaned,
          meta: { kind: "voice", transcript: cleaned },
          timestamp: new Date(),
        });

        setVoiceStatus("thinking");
        const reply = await aiftTextChat({ prompt: cleaned, sessionId, context: DEFAULT_CONTEXT });
        pushMessage({
          type: "coach",
          text: reply || "(ไม่มีข้อความตอบกลับ)",
          meta: { kind: "voice" },
          timestamp: new Date(),
        });

        if (!isMuted) {
          setVoiceStatus("speaking");
          const audioUrl = await aiftTts(reply);
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            await audioRef.current.play();
            setTimeout(() => URL.revokeObjectURL(audioUrl), 60_000);
          }
        }
      } catch (e: any) {
        setError(e?.message || "เกิดข้อผิดพลาด");
      } finally {
        setVoiceStatus("idle");
      }
    };

    recorder.start();
    setIsRecording(true);
    setVoiceStatus("recording");
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    try {
      recorder.stop();
    } catch {
      // ignore
    }
    setIsRecording(false);
  };

  return (
    <div className={cn(
      "h-screen flex flex-col overflow-hidden",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Header - Fixed */}
      <div className={cn(
        "fixed top-0 z-10 backdrop-blur-md border-b px-6 py-4 flex items-center gap-4",
        isMobile ? "left-0 right-0" : "left-72 right-0",
        isDark 
          ? "bg-black/95 border-white/10" 
          : "bg-white/95 border-gray-200"
      )}>
        {isMobile && (
          <Link
            to="/dashboard"
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isDark 
                ? "bg-white/10 hover:bg-white/20" 
                : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            <ArrowLeft className={cn("w-5 h-5", !isDark && "text-gray-700")} />
          </Link>
        )}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img src={aiCoach} alt="AI Coach" className="w-12 h-12 rounded-full object-cover" />
            <div className={cn(
              "absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2",
              isDark ? "border-black" : "border-white"
            )} />
          </div>
          <div>
            <h1 className="font-semibold">AI Coach</h1>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            isDark 
              ? "bg-white/10 hover:bg-white/20" 
              : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} />

      {/* Mode Tabs */}
      <div className={cn(
        "fixed top-20 right-0 z-10 px-6 py-3 border-b backdrop-blur-md",
        isMobile ? "left-0" : "left-72",
        isDark ? "bg-black/85 border-white/10" : "bg-white/85 border-gray-200"
      )}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className={cn("w-full", isDark ? "bg-white/10 text-gray-300" : "bg-gray-100")}> 
            <TabsTrigger value="text" className="flex-1">Text</TabsTrigger>
            <TabsTrigger value="vision" className="flex-1">Vision</TabsTrigger>
            <TabsTrigger value="voice" className="flex-1">Voice</TabsTrigger>
          </TabsList>
          <TabsContent value="text" />
          <TabsContent value="vision" />
          <TabsContent value="voice" />
        </Tabs>
      </div>

      {/* Messages - Scrollable area with padding for fixed header and input */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-32 mb-40">
        {error && (
          <div className={cn(
            "rounded-xl px-4 py-3 text-sm border",
            isDark ? "bg-red-500/10 border-red-500/20 text-red-200" : "bg-red-50 border-red-200 text-red-700"
          )}>
            {error}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-2 animate-fade-in",
              message.type === "user" ? "flex-row-reverse" : ""
            )}
          >
            {message.type === "coach" && (
              <img
                src={aiCoach}
                alt="AI Coach"
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3",
                message.type === "user"
                  ? "bg-gradient-to-r from-primary to-orange-500 text-white rounded-br-md"
                  : isDark 
                    ? "bg-white/10 text-white rounded-bl-md"
                    : "bg-white text-gray-900 rounded-bl-md shadow-sm"
              )}
            >
              {message.imageUrl && (
                <div className="mb-2">
                  <img
                    src={message.imageUrl}
                    alt="uploaded"
                    className="w-full max-w-[260px] rounded-xl border border-white/10"
                  />
                </div>
              )}
              <p className="text-sm">{message.text}</p>
              <p
                className={cn(
                  "text-xs mt-1",
                  message.type === "user" 
                    ? "text-white/70" 
                    : isDark ? "text-gray-400" : "text-gray-500"
                )}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-2 animate-fade-in">
            <img src={aiCoach} alt="AI Coach" className="w-8 h-8 rounded-full object-cover" />
            <div className={cn(
              "rounded-2xl rounded-bl-md px-4 py-3",
              isDark ? "bg-white/10" : "bg-white shadow-sm"
            )}>
              <div className="flex gap-1">
                <span className={cn(
                  "w-2 h-2 rounded-full animate-bounce",
                  isDark ? "bg-gray-400" : "bg-gray-400"
                )} style={{ animationDelay: "0ms" }} />
                <span className={cn(
                  "w-2 h-2 rounded-full animate-bounce",
                  isDark ? "bg-gray-400" : "bg-gray-400"
                )} style={{ animationDelay: "150ms" }} />
                <span className={cn(
                  "w-2 h-2 rounded-full animate-bounce",
                  isDark ? "bg-gray-400" : "bg-gray-400"
                )} style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed */}
      <div className={cn(
        "fixed z-10 border-t px-6 py-4 backdrop-blur-md safe-area-inset-bottom right-0",
        isMobile ? "bottom-16 left-0" : "bottom-0 left-72",
        isDark 
          ? "border-white/10 bg-black/95" 
          : "border-gray-200 bg-white/95"
      )}>
        {activeTab === "text" && (
          <div className="flex items-center gap-3">
            <Input
              placeholder="ถาม AI Coach ได้เลย..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className={cn(
                "flex-1",
                isDark ? "bg-white/5 border-white/10 text-white placeholder:text-gray-500" : ""
              )}
            />
            <Button
              variant="hero"
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        )}

        {activeTab === "vision" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label
                className={cn(
                  "h-12 px-4 rounded-xl inline-flex items-center gap-2 cursor-pointer border transition-colors",
                  isDark ? "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10" : "bg-gray-100 border-gray-200 hover:bg-gray-200"
                )}
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm font-semibold">เลือกรูป</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setVisionFile(f);
                    if (visionPreviewUrl) URL.revokeObjectURL(visionPreviewUrl);
                    setVisionPreviewUrl(f ? URL.createObjectURL(f) : "");
                  }}
                />
              </label>

              {visionFile && (
                <button
                  onClick={() => {
                    setVisionFile(null);
                    if (visionPreviewUrl) URL.revokeObjectURL(visionPreviewUrl);
                    setVisionPreviewUrl("");
                  }}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border",
                    isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-gray-100 border-gray-200 hover:bg-gray-200"
                  )}
                  aria-label="remove image"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <Button
                variant="hero"
                className="h-12 px-5"
                onClick={handleVisionSend}
                disabled={!visionFile || !visionQuery.trim() || isTyping}
              >
                <Send className="w-4 h-4" />
                ส่ง
              </Button>
            </div>

            {visionPreviewUrl && (
              <img
                src={visionPreviewUrl}
                alt="preview"
                className={cn(
                  "w-full max-h-40 object-cover rounded-xl border",
                  isDark ? "border-white/10" : "border-gray-200"
                )}
              />
            )}

            <Input
              placeholder="ถามอะไรเกี่ยวกับรูปนี้? (เช่น รูปนี้คืออะไร / มีท่าอะไรเหมาะกับคนในรูป)"
              value={visionQuery}
              onChange={(e) => setVisionQuery(e.target.value)}
              className={cn(
                "w-full",
                isDark ? "bg-white/5 border-white/10 text-white placeholder:text-gray-500" : ""
              )}
            />
          </div>
        )}

        {activeTab === "voice" && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => (isRecording ? stopRecording() : void startRecording())}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                isRecording
                  ? "bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30 animate-pulse"
                  : isDark
                    ? "bg-white/10 text-gray-200 hover:bg-white/20"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              aria-label={isRecording ? "stop recording" : "start recording"}
            >
              <Mic className="w-5 h-5" />
            </button>

            <div className="flex-1">
              <p className={cn("text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>
                {voiceStatus === "recording" && "กำลังอัดเสียง... กดอีกครั้งเพื่อส่ง"}
                {voiceStatus === "transcribing" && "กำลังถอดเสียง..."}
                {voiceStatus === "thinking" && "กำลังคิดคำตอบ..."}
                {voiceStatus === "speaking" && "กำลังพูดตอบ..."}
                {voiceStatus === "idle" && "กดไมค์เพื่อคุยกับ AI Coach"}
              </p>
              <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                Voice จะถอดเสียง → แชท → พูดตอบกลับ
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}