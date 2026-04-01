import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  gradient?: string;
  className?: string;
}

export function StatCard({ title, value, icon, subtitle, gradient = 'gradient-primary', className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl p-4 shadow-card border border-border/50 gradient-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-display font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', gradient)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
