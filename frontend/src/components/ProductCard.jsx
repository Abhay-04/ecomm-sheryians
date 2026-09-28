import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import ProductImage from '@/components/ProductImage';
import StockBadge from '@/components/StockBadge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

export default function ProductCard({ product, onDelete }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-input">
      <ProductImage src={product.image} alt={product.name} className="aspect-4/3" />

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {product.category}
        </p>
        <h3 className="mt-1.5 line-clamp-1 text-[15px] leading-snug font-medium" title={product.name}>
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
          <p className="text-base font-semibold tabular-nums">{formatPrice(product.price)}</p>
          <StockBadge stock={product.stock} />
        </div>
      </div>

      <div className="flex gap-2 border-t px-4 py-3">
        <Button variant="outline" size="lg" className="flex-1" asChild>
          <Link to={`/products/${product.id}/edit`} aria-label={`Edit ${product.name}`}>
            <Pencil />
            Edit
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="flex-1 text-destructive hover:bg-destructive/8 hover:text-destructive"
          onClick={() => onDelete(product)}
          aria-label={`Delete ${product.name}`}
        >
          <Trash2 />
          Delete
        </Button>
      </div>
    </article>
  );
}
