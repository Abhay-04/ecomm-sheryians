import { Store } from 'lucide-react';

export default function BrandMark() {
  return (
    <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Store className="size-4" />
      </span>
      Store
    </span>
  );
}
