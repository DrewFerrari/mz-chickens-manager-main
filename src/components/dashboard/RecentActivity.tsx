import { ShoppingCart, Skull, Axe, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OwnerBadge } from '@/components/ui/owner-badge';
import { OwnerType } from '@/lib/types';

interface Activity {
  id: string;
  type: 'sale' | 'death' | 'slaughter' | 'feed';
  description: string;
  owner: OwnerType;
  amount?: string;
  time: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons = {
  sale: ShoppingCart,
  death: Skull,
  slaughter: Axe,
  feed: Package,
};

const activityColors = {
  sale: 'bg-success/10 text-success',
  death: 'bg-destructive/10 text-destructive',
  slaughter: 'bg-warning/10 text-warning',
  feed: 'bg-info/10 text-info',
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-display font-semibold mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No recent activity
          </p>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className={cn('p-2.5 rounded-xl', activityColors[activity.type])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <OwnerBadge owner={activity.owner} size="sm" />
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
                {activity.amount && (
                  <span className={cn(
                    'text-sm font-semibold',
                    activity.type === 'sale' ? 'text-success' : 'text-destructive'
                  )}>
                    {activity.amount}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
