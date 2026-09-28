import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

export default function BackLink({ to, children }) {
  return (
    <Link
      to={to}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  );
}
