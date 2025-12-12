import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PairingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CodePairingProps {
  onSubmit: (code: string) => void;
  status: PairingStatus;
  error?: string;
}

export function CodePairing({ onSubmit, status, error }: CodePairingProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [focusIndex, setFocusIndex] = useState(0);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    
    if (value && index < 5) {
      setFocusIndex(index + 1);
    }
    
    // Auto-submit when all digits entered
    if (newCode.every(d => d) && newCode.join('').length === 6) {
      onSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      setFocusIndex(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = paste.split('').concat(Array(6 - paste.length).fill(''));
    setCode(newCode);
    if (paste.length === 6) {
      onSubmit(paste);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-muted-foreground">
        {t('workout.pairCode')}
      </p>
      
      {/* Code Input */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <input
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusIndex(index)}
              autoFocus={index === focusIndex}
              className={cn(
                'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all',
                'focus:outline-none focus:ring-0',
                focusIndex === index
                  ? 'border-primary bg-primary/5'
                  : digit
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border bg-background',
                status === 'connecting' && 'opacity-50 cursor-not-allowed',
                error && 'border-destructive bg-destructive/5'
              )}
              disabled={status === 'connecting' || status === 'connected'}
            />
          </motion.div>
        ))}
      </div>

      {/* Status */}
      {status === 'connecting' && (
        <motion.div
          className="flex items-center justify-center gap-2 text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">{t('workout.connecting')}</span>
        </motion.div>
      )}

      {status === 'connected' && (
        <motion.div
          className="flex items-center justify-center gap-2 text-success"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">{t('workout.paired')}</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          className="flex items-center justify-center gap-2 text-destructive"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <X className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}
    </div>
  );
}
