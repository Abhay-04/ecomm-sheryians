import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  action,
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-lg border bg-card px-6 py-16 text-center"
    >
      <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" />
      </div>
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex gap-2">
        {onRetry && (
          <Button variant="outline" size="lg" onClick={onRetry}>
            <RotateCw />
            Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
