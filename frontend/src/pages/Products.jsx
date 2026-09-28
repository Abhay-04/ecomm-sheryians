import { useEffect, useState } from 'react';
import axios from 'axios';
import { PackageOpen, Plus, Search, SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import DeleteProductDialog from '@/components/DeleteProductDialog';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { ProductGridSkeleton } from '@/components/LoadingState';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getErrorMessage, productApi } from '@/services/api';

const ALL_CATEGORIES = 'all';

// Waits until the user stops typing before the value changes, so we don't
// send a request on every keystroke.
function useDebouncedValue(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}

function AddProductButton() {
  return (
    <Button size="lg" asChild>
      <Link to="/products/new">
        <Plus />
        Add Product
      </Link>
    </Button>
  );
}

export default function Products() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const hasFilters = debouncedSearch !== '' || category !== ALL_CATEGORIES;
  const [reloadCount, setReloadCount] = useState(0);

  // Each distinct request gets a key. Loading/error state is derived by
  // comparing it to the key of the last request that finished.
  const requestKey = `${debouncedSearch}|${category}|${reloadCount}`;
  const [products, setProducts] = useState([]);
  const [loadedKey, setLoadedKey] = useState(null);
  const [failedKey, setFailedKey] = useState(null);

  const hasLoadedOnce = loadedKey !== null;
  const loadError = failedKey === requestKey;
  const isLoading = loadedKey !== requestKey && !loadError;

  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Cancels the request if filters change before it finishes, so an old
    // response can never overwrite newer results.
    const controller = new AbortController();
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (category !== ALL_CATEGORIES) params.category = category;

    productApi
      .getAll(params, { signal: controller.signal })
      .then((response) => {
        setProducts(response.data.products);
        setLoadedKey(requestKey);
      })
      .catch((error) => {
        if (!axios.isCancel(error)) setFailedKey(requestKey);
      });

    return () => controller.abort();
  }, [debouncedSearch, category, requestKey]);

  function clearFilters() {
    setSearch('');
    setCategory(ALL_CATEGORIES);
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await productApi.remove(productToDelete.id);
      setProducts((current) => current.filter((product) => product.id !== productToDelete.id));
      toast.success(`${productToDelete.name} was deleted`);
      setProductToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
      if (error.response?.status === 404) {
        setProducts((current) => current.filter((product) => product.id !== productToDelete.id));
        setProductToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  function renderContent() {
    if (loadError) {
      return (
        <ErrorState
          description="We couldn't load the products. Please try again."
          onRetry={() => setReloadCount((count) => count + 1)}
        />
      );
    }

    if (!hasLoadedOnce) {
      return <ProductGridSkeleton />;
    }

    if (products.length === 0 && !hasFilters) {
      return (
        <EmptyState
          icon={PackageOpen}
          title="No products yet"
          description="Add your first product to start building your catalog."
          action={<AddProductButton />}
        />
      );
    }

    if (products.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No matching products"
          description="Try a different search term or category."
          action={
            <Button variant="outline" size="lg" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      );
    }

    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          isLoading && 'opacity-60'
        )}
        aria-busy={isLoading}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onDelete={setProductToDelete} />
        ))}
      </div>
    );
  }

  const showFilters = hasLoadedOnce && !loadError && (products.length > 0 || hasFilters);

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your product inventory and catalog."
        action={<AddProductButton />}
      />

      {showFilters && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="pl-8"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {PRODUCT_CATEGORIES.map((categoryName) => (
                <SelectItem key={categoryName} value={categoryName}>
                  {categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground sm:ml-auto" aria-live="polite">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>
      )}

      {renderContent()}

      <DeleteProductDialog
        product={productToDelete}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </>
  );
}
