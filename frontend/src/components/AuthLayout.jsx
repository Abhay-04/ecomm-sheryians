import BrandMark from '@/components/BrandMark';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Shared frame for the login and register pages.
export default function AuthLayout({ title, description, children, footer }) {
  return (
    <main className="flex min-h-svh flex-col items-center px-4 py-12 sm:justify-center sm:py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>

        <Card className="gap-6 rounded-lg py-6 shadow-xs ring-border sm:py-8">
          <CardHeader className="px-6 sm:px-8">
            <CardTitle className="text-xl font-semibold tracking-tight">
              <h1>{title}</h1>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-8">{children}</CardContent>
        </Card>

        {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </main>
  );
}
