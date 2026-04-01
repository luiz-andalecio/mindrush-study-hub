import { cn } from '@/lib/utils';

interface XPBarProps {
  current: number;
  max: number;
  level: number;
  className?: string;
}

export function XPBar({ current, max, level, className }: XPBarProps) {
  const percentage = Math.min((current / max) * 100, 100);
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-display font-bold">Nível {level}</span>
        <span className="text-muted-foreground">{current} / {max} XP</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full gradient-primary transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
