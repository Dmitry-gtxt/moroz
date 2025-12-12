import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface SwipeHintProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function SwipeHint({ className = '', variant = 'light' }: SwipeHintProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hide after 3 blinks (each blink is ~600ms, so ~1.8s total + small buffer)
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const colorClass = variant === 'light' 
    ? 'text-gold-dark drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]' 
    : 'text-magic-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]';

  return (
    <div 
      className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none ${className}`}
      style={{
        animation: 'swipe-hint-blink 0.6s ease-in-out 3'
      }}
    >
      <div className={`flex items-center gap-0.5 ${colorClass}`}>
        <ChevronRight className="w-8 h-8 animate-bounce-x" strokeWidth={3} />
        <ChevronRight className="w-8 h-8 animate-bounce-x -ml-4" strokeWidth={3} style={{ animationDelay: '0.1s' }} />
      </div>
    </div>
  );
}
