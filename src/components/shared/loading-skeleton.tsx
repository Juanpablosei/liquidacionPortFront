interface LoadingSkeletonProps {
  variant: 'table' | 'cards' | 'form' | 'detail';
  rows?:   number;
}

export function LoadingSkeleton({ variant, rows = 5 }: LoadingSkeletonProps) {
  if (variant === 'table') {
    return (
      <div className="flex flex-col gap-0">
        {/* Header row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.06]">
          {[40, 120, 80, 80, 60].map((w, i) => (
            <div key={i} className="h-3 bg-white/[0.05] rounded animate-pulse" style={{ width: w }} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-white/[0.04]">
            {[40, 120, 80, 80, 60].map((w, j) => (
              <div
                key={j}
                className="h-3.5 bg-white/[0.04] rounded animate-pulse"
                style={{ width: w, animationDelay: `${i * 60 + j * 15}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-3.5 bg-white/[0.06] rounded w-20" />
              <div className="w-9 h-9 bg-white/[0.05] rounded-xl" />
            </div>
            <div className="h-7 bg-white/[0.08] rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className="flex flex-col gap-5 max-w-lg">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-3 bg-white/[0.06] rounded w-24 animate-pulse" />
            <div className="h-11 bg-white/[0.04] rounded-xl border border-white/[0.06] animate-pulse" />
          </div>
        ))}
        <div className="h-11 bg-[#2563EB]/20 rounded-xl animate-pulse w-32 mt-2" />
      </div>
    );
  }

  // detail
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/[0.06] animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-5 bg-white/[0.08] rounded w-40 animate-pulse" />
          <div className="h-3.5 bg-white/[0.05] rounded w-56 animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
