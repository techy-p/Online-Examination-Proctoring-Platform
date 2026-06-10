type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  brand: 'bg-brand-100 text-brand-700',
};

export default function Badge({
  children,
  variant = 'default',
  dot,
  className = '',
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-emerald-500' : variant === 'danger' ? 'bg-red-500 animate-pulse' : 'bg-current'}`} />}
      {children}
    </span>
  );
}
