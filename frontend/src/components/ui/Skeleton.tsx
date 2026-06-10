export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="card">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="w-16 h-8 mt-4" />
      <Skeleton className="w-24 h-4 mt-2" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <Skeleton className="w-48 h-4" />
        <Skeleton className="w-32 h-3 mt-2" />
      </div>
      <Skeleton className="w-20 h-8 rounded-xl" />
    </div>
  );
}
