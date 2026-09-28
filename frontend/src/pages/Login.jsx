import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import AuthLayout from '@/components/AuthLayout';
import FormField from '@/components/FormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { fieldProps, focusFirstInvalidField } from '@/lib/form';
import { getErrorMessage, getFieldErrors } from '@/services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Register passes the new email along so the user doesn't retype it.
  const [values, setValues] = useState({ email: location.state?.email || '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFieldErrors({});

    try {
      await login(values);
      navigate(location.state?.from || '/products', { replace: true });
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
    <AuthLayout
      title="Welcome back"
      description="Sign in to manage your products and catalog."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-5">
        {formError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <FormField id="email" label="Email" error={fieldErrors.email}>
          <Input
            {...fieldProps('email', fieldErrors.email)}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
        </FormField>

        <FormField id="password" label="Password" error={fieldErrors.password}>
          <Input
            {...fieldProps('password', fieldErrors.password)}
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
          />
        </FormField>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
