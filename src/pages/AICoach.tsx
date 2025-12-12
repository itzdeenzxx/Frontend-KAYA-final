import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mic, Send, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import aiCoach from "@/assets/ai-coach.png";

interface Message {
  id: number;
  type: "user" | "coach";
  text: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: 1,
    type: "coach",
    text: "Hey there! I'm your AI fitness coach. I'm here to help you with workout tips, nutrition advice, and motivation. What would you like to work on today?",
    timestamp: new Date(),
  },
];

const coachResponses = [
  "That's a great goal! Let me help you create a plan to achieve it.",
  "Consistency is key! Try to workout at least 3-4 times per week.",
  "Remember, nutrition is 80% of the game. Are you tracking your meals?",
  "Great question! For weight loss, focus on a caloric deficit combined with strength training.",
  "I recommend starting with compound exercises like squats, deadlifts, and bench press.",
  "Don't forget to warm up before your workouts and stretch afterwards!",
  "Sleep is crucial for recovery. Aim for 7-9 hours per night.",
  "Hydration matters! Drink at least 8 glasses of water daily.",
];

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate coach response
    setTimeout(() => {
      const coachMessage: Message = {
        id: messages.length + 2,
        type: "coach",
        text: coachResponses[Math.floor(Math.random() * coachResponses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, coachMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Mock voice input
    if (!isListening) {
      setTimeout(() => {
        setInputText("How can I lose weight effectively?");
        setIsListening(false);
      }, 2000);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-6 py-4 flex items-center gap-4">
        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img src={aiCoach} alt="AI Coach" className="w-12 h-12 rounded-full object-cover" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-nature rounded-full border-2 border-background" />
          </div>
          <div>
            <h1 className="font-semibold">AI Coach</h1>
            <p className="text-xs text-nature">Online</p>
          </div>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Messages - Scrollable area with padding for fixed header and input */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-20 mb-32">
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
                  ? "gradient-coral text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              )}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={cn(
                  "text-xs mt-1",
                  message.type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-2 animate-fade-in">
            <img src={aiCoach} alt="AI Coach" className="w-8 h-8 rounded-full object-cover" />
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed */}
      <div className="fixed bottom-16 left-0 right-0 z-10 border-t border-border px-6 py-4 bg-background/95 backdrop-blur-md safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          <button
            onClick={handleVoiceInput}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
              isListening
                ? "gradient-coral text-primary-foreground shadow-coral animate-pulse"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Mic className="w-5 h-5" />
          </button>
          <Input
            placeholder="Ask your coach..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button
            variant="hero"
            size="icon"
            className="w-12 h-12 rounded-full"
            onClick={handleSend}
            disabled={!inputText.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}