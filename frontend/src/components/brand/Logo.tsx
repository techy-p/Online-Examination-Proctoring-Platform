import { BRAND } from '../../config/brand';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type LogoVariant = 'full' | 'icon' | 'wordmark';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  theme?: 'light' | 'dark';
  className?: string;
}

const iconSizes: Record<LogoSize, number> = { xs: 24, sm: 32, md: 40, lg: 48, xl: 56 };
const textSizes: Record<LogoSize, string> = {
  xs: 'text-base', sm: 'text-lg', md: 'text-xl', lg: 'text-2xl', xl: 'text-3xl',
};

function LogoMark({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M24 3.5 40 10v11.7c0 10.1-6.6 18.8-16 22.8-9.4-4-16-12.7-16-22.8V10l16-6.5Z" fill="#10231e" />
      <path d="M24 7.7 36.2 12.6v9.1c0 7.7-4.8 14.5-12.2 18-7.4-3.5-12.2-10.3-12.2-18v-9.1L24 7.7Z" stroke="#b69358" strokeWidth="1.25" />
      <path d="M14.8 22.7c2.6-4 5.6-6 9.2-6s6.6 2 9.2 6c-2.6 4-5.6 6-9.2 6s-6.6-2-9.2-6Z" fill="#f7f3e9" />
      <circle cx="24" cy="22.7" r="4.2" fill="#326455" />
      <circle cx="24" cy="22.7" r="1.5" fill="#f7f3e9" />
      <path d="m19.4 32 3 2.5 6.2-6" stroke="#b69358" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ size = 'md', variant = 'full', theme = 'dark', className = '' }: LogoProps) {
  const nameColor = theme === 'light' ? 'text-[#f7f3e9]' : 'text-brand-950';
  const tagColor = theme === 'light' ? 'text-[#b9c9c3]' : 'text-slate-500';

  if (variant === 'icon') return <LogoMark size={iconSizes[size]} className={className} />;

  const wordmark = (
    <div className="flex flex-col leading-none">
      <span className={`font-display font-semibold tracking-[-0.03em] ${textSizes[size]} ${nameColor}`}>{BRAND.name}</span>
      {size !== 'xs' && size !== 'sm' && (
        <span className={`text-[9px] font-medium tracking-[0.16em] uppercase mt-1.5 ${tagColor}`}>{BRAND.tagline}</span>
      )}
    </div>
  );

  if (variant === 'wordmark') return <div className={className}>{wordmark}</div>;

  return <div className={`flex items-center gap-3 ${className}`}><LogoMark size={iconSizes[size]} />{wordmark}</div>;
}

export { LogoMark };
