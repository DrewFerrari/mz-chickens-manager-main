import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'munyanyi' | 'zindove' | 'accent';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    munyanyi: 'bg-owner-munyanyi-light border-owner-munyanyi/20',
    zindove: 'bg-owner-zindove-light border-owner-zindove/20',
    accent: 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-transparent',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    munyanyi: 'bg-owner-munyanyi/20 text-owner-munyanyi',
    zindove: 'bg-owner-zindove/20 text-owner-zindove',
    accent: 'bg-primary-foreground/20 text-primary-foreground',
  };

  const textStyles = {
    default: '',
    munyanyi: 'text-owner-munyanyi',
    zindove: 'text-owner-zindove',
    accent: 'text-primary-foreground',
  };

  return (
    <div
      className={cn(
        'stat-card border rounded-xl p-6 transition-all duration-300 hover:shadow-lg animate-fade-in',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            'text-sm font-medium mb-1',
            variant === 'accent' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-display font-bold tracking-tight',
            textStyles[variant]
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs mt-1',
              variant === 'accent' ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.positive ? 'text-success' : 'text-destructive'
            )}>
              <span>{trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground text-xs">vs yesterday</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
