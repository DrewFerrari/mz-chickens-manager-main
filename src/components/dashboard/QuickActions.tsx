import { Link } from 'react-router-dom';
import { ShoppingCart, Skull, Axe, Package, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  {
    icon: ShoppingCart,
    label: 'Record Sale',
    path: '/sales?action=new',
    color: 'bg-success/10 text-success hover:bg-success hover:text-white',
  },
  {
    icon: Skull,
    label: 'Record Death',
    path: '/deaths?action=new',
    color: 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white',
  },
  {
    icon: Axe,
    label: 'Slaughter',
    path: '/slaughter?action=new',
    color: 'bg-warning/10 text-warning hover:bg-warning hover:text-white',
  },
  {
    icon: Package,
    label: 'Buy Feed',
    path: '/feed?action=new',
    color: 'bg-info/10 text-info hover:bg-info hover:text-white',
  },
  {
    icon: Plus,
    label: 'New Batch',
    path: '/batches?action=new',
    color: 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground',
  },
];

export function QuickActions() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-display font-semibold mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300',
              action.color
            )}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
