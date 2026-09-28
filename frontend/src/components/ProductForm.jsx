import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import FormField from '@/components/FormField';
import ProductImage from '@/components/ProductImage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { fieldProps, focusFirstInvalidField } from '@/lib/form';
import { getErrorMessage, getFieldErrors } from '@/services/api';

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  image: '',
};

// Inputs hold strings; numbers from the API are converted so they can be edited.
function toFormValues(product) {
  if (!product) return EMPTY_PRODUCT;
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    stock: String(product.stock),
    category: product.category,
    image: product.image || '',
  };
}

function FormSection({ title, description, children }) {
  return (
    <section className="grid gap-4 border-t py-6 first:border-t-0 first:pt-0 md:grid-cols-[200px_1fr] md:gap-10 md:py-8">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

// Validation happens on the server; its field messages are shown under each input.
export default function ProductForm({ product, onSubmit, submitLabel }) {
  const [values, setValues] = useState(() => toFormValues(product));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleInputChange(event) {
    updateField(event.target.name, event.target.value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFieldErrors({});

    try {
      await onSubmit(values);
    } catch (error) {
      const errorsByField = getFieldErrors(error);
      setFieldErrors(errorsByField);
      focusFirstInvalidField(errorsByField);
      if (Object.keys(errorsByField).length === 0) {
        setFormError(getErrorMessage(error));
      }
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle />
          <AlertTitle>Could not save product</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FormSection title="Details" description="Shown on the product card in your catalog.">
        <FormField id="name" label="Product name" error={fieldErrors.name}>
          <Input
            {...fieldProps('name', fieldErrors.name)}
            value={values.name}
            onChange={handleInputChange}
            placeholder="e.g. Wireless Headphones"
            maxLength={100}
          />
        </FormField>

        <FormField
          id="description"
          label="Description"
          description="A short summary. The card shows the first two lines."
          error={fieldErrors.description}
        >
          <Textarea
            {...fieldProps('description', fieldErrors.description, true)}
            value={values.description}
            onChange={handleInputChange}
            rows={4}
            maxLength={1000}
            className="min-h-24"
          />
        </FormField>

        <FormField id="category" label="Category" error={fieldErrors.category}>
          <Select value={values.category} onValueChange={(value) => updateField('category', value)}>
            <SelectTrigger
              {...fieldProps('category', fieldErrors.category)}
              className="w-full sm:w-64"
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </FormSection>

      <FormSection title="Pricing & inventory" description="Price in Indian rupees (₹).">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="price" label="Price" error={fieldErrors.price}>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                {...fieldProps('price', fieldErrors.price)}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={values.price}
                onChange={handleInputChange}
                placeholder="0.00"
                className="pl-7 tabular-nums"
              />
            </div>
          </FormField>

          <FormField
            id="stock"
            label="Stock"
            description="Units available to sell."
            error={fieldErrors.stock}
          >
            <Input
              {...fieldProps('stock', fieldErrors.stock, true)}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={values.stock}
              onChange={handleInputChange}
              placeholder="0"
              className="tabular-nums"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Image" description="Link to a hosted product photo.">
        <FormField
          id="image"
          label="Image URL"
          description="Optional. Must start with http:// or https://"
          error={fieldErrors.image}
        >
          <Input
            {...fieldProps('image', fieldErrors.image, true)}
            type="url"
            inputMode="url"
            value={values.image}
            onChange={handleInputChange}
            placeholder="https://"
          />
        </FormField>

        <div className="flex items-center gap-4">
          <ProductImage
            src={values.image.trim()}
            alt="Image preview"
            className="aspect-4/3 w-32 shrink-0 rounded-md border"
          />
          <p className="text-[13px] text-muted-foreground">
            Preview. Images are cropped to a 4:3 frame on product cards.
          </p>
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" asChild>
          <Link to="/products">Cancel</Link>
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting} className="sm:min-w-32">
          {isSubmitting && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
