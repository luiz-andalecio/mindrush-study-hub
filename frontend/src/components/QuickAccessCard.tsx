import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  to: string;
  gradient?: string;
}

export function QuickAccessCard({ title, description, icon, to, gradient = 'gradient-primary' }: QuickAccessCardProps) {
  return (
    <Link
      to={to}
      className="group rounded-xl p-5 gradient-card border border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:border-primary/30 block"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform', gradient)}>
        {icon}
      </div>
      <h3 className="font-display font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </Link>
  );
}
