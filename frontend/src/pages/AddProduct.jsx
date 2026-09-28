import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import BackLink from '@/components/BackLink';
import PageHeader from '@/components/PageHeader';
import ProductForm from '@/components/ProductForm';
import { productApi } from '@/services/api';

export default function AddProduct() {
  const navigate = useNavigate();

  // Errors are thrown back to ProductForm, which displays them.
  async function handleCreate(values) {
    const response = await productApi.create(values);
    toast.success(`${response.data.product.name} was added to your catalog`);
    navigate('/products');
  }

  return (
    <div className="max-w-4xl">
      <BackLink to="/products">Products</BackLink>
      <PageHeader title="Add product" description="Create a new product in your catalog." />
      <ProductForm onSubmit={handleCreate} submitLabel="Create product" />
    </div>
  );
}
