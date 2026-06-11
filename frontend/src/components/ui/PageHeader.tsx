interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export default function PageHeader({ title, description, action, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-300/70">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] text-brand-950">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-slate-600 mt-2 text-sm leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
