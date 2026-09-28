import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import BackLink from '@/components/BackLink';
import ErrorState from '@/components/ErrorState';
import PageHeader from '@/components/PageHeader';
import ProductForm from '@/components/ProductForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage, productApi } from '@/services/api';

function ProductFormSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-[200px_1fr] md:gap-10" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3.5 w-40" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-9 w-64" />
      </div>
    </div>
  );
}

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    productApi
      .getById(id)
      .then((response) => {
        if (isCurrent) setProduct(response.data.product);
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error);
      });

    return () => {
      isCurrent = false;
    };
  }, [id, reloadCount]);

  function handleRetry() {
    setLoadError(null);
    setReloadCount((count) => count + 1);
  }

  async function handleUpdate(values) {
    const response = await productApi.update(id, values);
    toast.success(`${response.data.product.name} was updated`);
    navigate('/products');
  }

  function renderContent() {
    if (loadError) {
      const status = loadError.response?.status;
      const isMissing = status === 404 || status === 400;

      return (
        <ErrorState
          title={isMissing ? 'Product not found' : 'Something went wrong'}
          description={
            isMissing
              ? 'This product may have been deleted, or the link is incorrect.'
              : getErrorMessage(loadError)
          }
          onRetry={isMissing ? undefined : handleRetry}
          action={
            <Button variant={isMissing ? 'default' : 'ghost'} size="lg" asChild>
              <Link to="/products">Back to products</Link>
            </Button>
          }
        />
      );
    }

    if (!product) {
      return <ProductFormSkeleton />;
    }

    // key resets the form's internal state if a different product is loaded.
    return (
      <ProductForm key={product.id} product={product} onSubmit={handleUpdate} submitLabel="Save changes" />
    );
  }

  return (
    <div className="max-w-4xl">
      <BackLink to="/products">Products</BackLink>
      <PageHeader
        title="Edit product"
        description={product ? `Update the details for ${product.name}.` : 'Update product details.'}
      />
      {renderContent()}
    </div>
  );
}
