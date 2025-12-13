// Theme Selection Modal - First-time user theme selector with previews
import React from 'react';
import { Sun, Moon, Check, Sparkles } from 'lucide-react';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeOption {
  id: ThemeMode;
  name: string;
  nameTh: string;
  description: string;
  icon: React.ElementType;
  previewBg: string;
  previewCard: string;
  previewNav: string;
  previewText: string;
  previewAccent: string;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Dark Mode',
    nameTh: 'โหมดมืด',
    description: 'สวยงามลึกลับ เหมาะสำหรับการออกกำลังกายในที่มืด',
    icon: Moon,
    previewBg: 'bg-black',
    previewCard: 'bg-white/10',
    previewNav: 'bg-gray-900/95',
    previewText: 'text-white',
    previewAccent: 'bg-orange-500',
  },
  {
    id: 'light',
    name: 'Light Mode',
    nameTh: 'โหมดสว่าง',
    description: 'สดใส สะอาดตา เหมาะสำหรับการออกกำลังกายกลางแจ้ง',
    icon: Sun,
    previewBg: 'bg-gray-50',
    previewCard: 'bg-white',
    previewNav: 'bg-white/95',
    previewText: 'text-gray-900',
    previewAccent: 'bg-orange-500',
  },
];

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function ThemeSelectorModal({ isOpen, onClose, showCloseButton = false }: ThemeSelectorModalProps) {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = React.useState<ThemeMode>(theme);
  const [isApplying, setIsApplying] = React.useState(false);

  if (!isOpen) return null;

  const handleSelectTheme = (themeId: ThemeMode) => {
    setSelectedTheme(themeId);
  };

  const handleConfirm = async () => {
    setIsApplying(true);
    await setTheme(selectedTheme);
    setIsApplying(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            เลือกธีมที่ชอบ
          </h2>
          <p className="text-gray-400">
            คุณสามารถเปลี่ยนได้ภายหลังในหน้าตั้งค่า
          </p>
        </div>

        {/* Theme Options */}
        <div className="space-y-4 mb-8">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedTheme === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => handleSelectTheme(option.id)}
                className={cn(
                  "w-full rounded-2xl p-4 transition-all duration-300",
                  "border-2",
                  isSelected
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className={cn(
                    "w-24 h-32 rounded-lg overflow-hidden flex-shrink-0",
                    option.previewBg,
                    "shadow-xl border",
                    option.id === 'dark' ? 'border-white/10' : 'border-gray-200'
                  )}>
                    {/* Preview Header */}
                    <div className={cn(
                      "h-6 flex items-center px-2",
                      option.id === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
                    )}>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      </div>
                    </div>
                    
                    {/* Preview Content */}
                    <div className="p-2 space-y-1.5">
                      <div className={cn("h-8 rounded", option.previewCard)} />
                      <div className="flex gap-1">
                        <div className={cn("h-4 w-8 rounded", option.previewAccent)} />
                        <div className={cn("h-4 flex-1 rounded", option.previewCard)} />
                      </div>
                      <div className={cn("h-6 rounded", option.previewCard)} />
                    </div>
                    
                    {/* Preview Nav */}
                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-4 flex justify-around items-center",
                      option.previewNav
                    )}>
                      <div className={cn("w-2 h-2 rounded-full", option.previewAccent)} />
                      <div className={cn("w-2 h-2 rounded-full", option.id === 'dark' ? 'bg-gray-600' : 'bg-gray-300')} />
                      <div className={cn("w-2 h-2 rounded-full", option.id === 'dark' ? 'bg-gray-600' : 'bg-gray-300')} />
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn(
                        "w-5 h-5",
                        isSelected ? "text-orange-500" : "text-gray-400"
                      )} />
                      <h3 className="text-lg font-semibold text-white">
                        {option.nameTh}
                      </h3>
                      {isSelected && (
                        <div className="ml-auto w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={isApplying}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-white text-lg",
            "bg-gradient-to-r from-orange-500 to-pink-500",
            "hover:from-orange-600 hover:to-pink-600",
            "transition-all duration-300 transform hover:scale-[1.02]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-lg shadow-orange-500/30"
          )}
        >
          {isApplying ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              กำลังบันทึก...
            </span>
          ) : (
            'เริ่มต้นใช้งาน'
          )}
        </button>

        {showCloseButton && (
          <button
            onClick={onClose}
            className="w-full mt-3 py-3 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            ยกเลิก
          </button>
        )}
      </div>
    </div>
  );
}

export default ThemeSelectorModal;
