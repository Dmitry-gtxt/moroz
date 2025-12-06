import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingSaveButtonProps {
  onClick: () => void;
  saving?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

export function FloatingSaveButton({ 
  onClick, 
  saving = false, 
  disabled = false,
  children,
  className,
}: FloatingSaveButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={saving || disabled}
      className={cn(
        'fixed bottom-6 right-6 z-50 shadow-lg',
        'bg-green-600 hover:bg-green-700 text-white',
        'px-6 py-3 h-auto rounded-full',
        'transition-all duration-300 ease-out',
        'hover:shadow-xl hover:scale-105',
        'active:scale-95',
        className
      )}
    >
      {saving ? (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      ) : (
        <Save className="h-5 w-5 mr-2" />
      )}
      {children || 'Сохранить'}
    </Button>
  );
}
