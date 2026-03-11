import { Bird, Snowflake, DollarSign, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';

interface OwnerCardProps {
  owner: OwnerType;
  liveChickens: number;
  fridgeStock: number;
  todaySales: number;
  deaths: number;
}

export function OwnerCard({ owner, liveChickens, fridgeStock, todaySales, deaths }: OwnerCardProps) {
  const isMunyanyi = owner === 'miss_munyanyi';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-xl animate-slide-up',
        isMunyanyi
          ? 'bg-gradient-to-br from-owner-munyanyi to-owner-munyanyi/80'
          : 'bg-gradient-to-br from-owner-zindove to-owner-zindove/90'
      )}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Bird className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white">
              {OWNER_DISPLAY_NAMES[owner]}
            </h3>
            <p className="text-white/70 text-sm">Owner</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bird className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-xs font-medium">Live</span>
            </div>
            <p className="text-2xl font-bold text-white">{liveChickens}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Snowflake className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-xs font-medium">Fridge</span>
            </div>
            <p className="text-2xl font-bold text-white">{fridgeStock}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-xs font-medium">Sales</span>
            </div>
            <p className="text-2xl font-bold text-white">${todaySales}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Skull className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-xs font-medium">Deaths</span>
            </div>
            <p className="text-2xl font-bold text-white">{deaths}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
