import { BRAND } from '../../config/brand';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type LogoVariant = 'full' | 'icon' | 'wordmark';

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  theme?: 'light' | 'dark';
  className?: string;
}

const iconSizes: Record<LogoSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
};

const textSizes: Record<LogoSize, string> = {
  xs: 'text-base',
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

function LogoMark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="invigilo-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="invigilo-shine" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="invigilo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shield base */}
      <path
        d="M24 3L8 10v12c0 10.2 6.8 19.7 16 22 9.2-2.3 16-11.8 16-22V10L24 3z"
        fill="url(#invigilo-grad)"
        filter="url(#invigilo-glow)"
      />
      <path
        d="M24 3L8 10v12c0 10.2 6.8 19.7 16 22 9.2-2.3 16-11.8 16-22V10L24 3z"
        fill="url(#invigilo-shine)"
      />

      {/* Lens ring — proctoring eye */}
      <circle cx="24" cy="22" r="9" stroke="white" strokeWidth="2" strokeOpacity="0.9" fill="none" />
      <circle cx="24" cy="22" r="4.5" fill="white" fillOpacity="0.95" />

      {/* Scan arc */}
      <path
        d="M17 22a7 7 0 0 1 14 0"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.5"
        fill="none"
      />

      {/* Integrity check */}
      <path
        d="M20 22l2.5 2.5L28 19"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({
  size = 'md',
  variant = 'full',
  theme = 'dark',
  className = '',
}: LogoProps) {
  const iconSize = iconSizes[size];
  const nameColor = theme === 'light' ? 'text-white' : 'text-slate-900';
  const tagColor = theme === 'light' ? 'text-indigo-200' : 'text-slate-500';

  if (variant === 'icon') {
    return <LogoMark size={iconSize} className={className} />;
  }

  if (variant === 'wordmark') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={`font-display font-bold tracking-tight ${textSizes[size]} ${nameColor}`}>
          {BRAND.name}
        </span>
        {size !== 'xs' && size !== 'sm' && (
          <span className={`text-[0.65em] font-medium tracking-widest uppercase ${tagColor}`}>
            {BRAND.tagline}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={iconSize} />
      <div className="flex flex-col leading-none">
        <span className={`font-display font-bold tracking-tight ${textSizes[size]} ${nameColor}`}>
          {BRAND.name}
        </span>
        {(size === 'md' || size === 'lg' || size === 'xl') && (
          <span className={`text-[10px] font-medium tracking-[0.2em] uppercase mt-1 ${tagColor}`}>
            {BRAND.tagline}
          </span>
        )}
      </div>
    </div>
  );
}

export { LogoMark };
