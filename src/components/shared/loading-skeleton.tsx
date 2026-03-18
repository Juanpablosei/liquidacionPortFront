interface LoadingSkeletonProps {
  variant: 'table' | 'cards' | 'form' | 'detail';
  rows?:   number;
}

export function LoadingSkeleton({ variant, rows = 5 }: LoadingSkeletonProps) {
  if (variant === 'table') {
    return (
      <div className="flex flex-col gap-0">
        {/* Header row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
          {[40, 120, 80, 80, 60].map((w, i) => (
            <div key={i} className="h-3 bg-overlay rounded motion-safe:animate-pulse" style={{ width: w }} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border">
            {[40, 120, 80, 80, 60].map((w, j) => (
              <div
                key={j}
                className="h-3.5 bg-overlay-subtle rounded motion-safe:animate-pulse"
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
            className="bg-card border border-border rounded-xl p-6 motion-safe:animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-3.5 bg-overlay rounded w-20" />
              <div className="w-9 h-9 bg-overlay rounded-xl" />
            </div>
            <div className="h-7 bg-overlay-strong rounded w-16" />
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
            <div className="h-3 bg-overlay rounded w-24 motion-safe:animate-pulse" />
            <div className="h-11 bg-overlay-subtle rounded-xl border border-border motion-safe:animate-pulse" />
          </div>
        ))}
        <div className="h-11 bg-brand/20 rounded-xl motion-safe:animate-pulse w-32 mt-2" />
      </div>
    );
  }

  // detail
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-overlay motion-safe:animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-5 bg-overlay-strong rounded w-40 motion-safe:animate-pulse" />
          <div className="h-3.5 bg-overlay rounded w-56 motion-safe:animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-overlay-subtle border border-border rounded-xl motion-safe:animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
