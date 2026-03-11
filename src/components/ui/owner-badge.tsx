import { cn } from '@/lib/utils';
import { OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';

interface OwnerBadgeProps {
  owner: OwnerType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OwnerBadge({ owner, size = 'md', className }: OwnerBadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-colors',
        owner === 'miss_munyanyi' ? 'owner-badge-munyanyi' : 'owner-badge-zindove',
        sizeStyles[size],
        className
      )}
    >
      {OWNER_DISPLAY_NAMES[owner]}
    </span>
  );
}
