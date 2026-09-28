import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Label + control + optional hint + error message. The control itself is passed
// as children so any input type (Input, Textarea, Select) can be used.
export default function FormField({ id, label, description, error, className, children }) {
  return (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-destructive">
          {error}
        </p>
      ) : (
        description && (
          <p id={`${id}-description`} className="text-[13px] text-muted-foreground">
            {description}
          </p>
        )
      )}
    </div>
  );
}
