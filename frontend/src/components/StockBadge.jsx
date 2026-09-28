import { Badge } from '@/components/ui/badge';
import { LOW_STOCK_THRESHOLD } from '@/lib/constants';
import { cn } from '@/lib/utils';

function getStockStatus(stock) {
  if (stock === 0) {
    return { label: 'Out of stock', className: 'bg-destructive/8 text-destructive' };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { label: `Low stock · ${stock} left`, className: 'bg-warning-muted text-warning' };
  }
  return { label: `In stock · ${stock} units`, className: 'bg-success-muted text-success' };
}

export default function StockBadge({ stock }) {
  const { label, className } = getStockStatus(stock);

  return (
    <Badge variant="secondary" className={cn('rounded-md font-medium', className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </Badge>
  );
}
