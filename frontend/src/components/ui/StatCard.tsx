import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'brand' | 'emerald' | 'violet' | 'amber' | 'rose';
}

const colorMap = {
  brand: { bg: 'bg-brand-500', light: 'bg-brand-50 text-brand-600' },
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-600' },
  violet: { bg: 'bg-violet-500', light: 'bg-violet-50 text-violet-600' },
  amber: { bg: 'bg-amber-500', light: 'bg-amber-50 text-amber-600' },
  rose: { bg: 'bg-rose-500', light: 'bg-rose-50 text-rose-600' },
};

export default function StatCard({ label, value, icon: Icon, trend, color = 'brand' }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="card group hover:shadow-md hover:border-brand-200/60 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${c.light}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-4 font-display">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}
