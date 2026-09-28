import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import AuthLayout from '@/components/AuthLayout';
import FormField from '@/components/FormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { fieldProps, focusFirstInvalidField } from '@/lib/form';
import { getErrorMessage, getFieldErrors } from '@/services/api';

const INITIAL_VALUES = { name: '', email: '', password: '', confirmPassword: '' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(INITIAL_VALUES);
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
      await register(values);
      toast.success('Account created. Please sign in.');
      navigate('/login', { state: { email: values.email.trim() } });
    } catch (error) {
      const errorsByField = getFieldErrors(error);
      // 409 (email taken) has no field list, but belongs under the email input.
      if (error.response?.status === 409) {
        errorsByField.email = getErrorMessage(error);
      }
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
      title="Create your account"
      description="Start managing your store's product catalog."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
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

        <FormField id="name" label="Name" error={fieldErrors.name}>
          <Input
            {...fieldProps('name', fieldErrors.name)}
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
          />
        </FormField>

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

        <FormField
          id="password"
          label="Password"
          description="At least 8 characters, with upper and lowercase letters, a number and a symbol."
          error={fieldErrors.password}
        >
          <Input
            {...fieldProps('password', fieldErrors.password, true)}
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
          />
        </FormField>

        <FormField id="confirmPassword" label="Confirm password" error={fieldErrors.confirmPassword}>
          <Input
            {...fieldProps('confirmPassword', fieldErrors.confirmPassword)}
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange}
          />
        </FormField>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
