import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Same layout and proportions as ProductCard, so nothing jumps when data arrives.
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card" aria-hidden="true">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2.5 h-4 w-3/4" />
        <Skeleton className="mt-2.5 h-3.5 w-full" />
        <Skeleton className="mt-1.5 h-3.5 w-2/3" />
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="flex gap-2 border-t px-4 py-3">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <span className="sr-only">Loading products…</span>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Only used once, while the app checks for an existing session on first load.
export function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
