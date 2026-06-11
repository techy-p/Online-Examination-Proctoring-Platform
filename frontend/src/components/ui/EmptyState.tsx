import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-md border border-slate-200 bg-[#f4f3ef] flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-brand-700" />
      </div>
      <h3 className="font-display text-lg font-semibold text-brand-950">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
