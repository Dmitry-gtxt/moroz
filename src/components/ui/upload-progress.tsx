import { Progress } from '@/components/ui/progress';

interface UploadProgressProps {
  progress: number;
  fileName?: string;
}

export function UploadProgress({ progress, fileName }: UploadProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground truncate max-w-[200px]">
          {fileName || 'Загрузка...'}
        </span>
        <span className="font-medium text-primary">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
