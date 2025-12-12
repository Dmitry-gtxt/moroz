import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface SwipeHintProps {
  className?: string;
}

export function SwipeHint({ className = '' }: SwipeHintProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hide after 3 blinks (each blink is ~600ms, so ~1.8s total + small buffer)
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div 
      className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none ${className}`}
      style={{
        animation: 'swipe-hint-blink 0.6s ease-in-out 3'
      }}
    >
      <div className="flex items-center gap-0.5 text-magic-gold/80">
        <ChevronRight className="w-6 h-6 animate-bounce-x" />
        <ChevronRight className="w-6 h-6 animate-bounce-x -ml-3" style={{ animationDelay: '0.1s' }} />
      </div>
    </div>
  );
}
