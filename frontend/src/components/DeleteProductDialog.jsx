import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

// `product` is the product pending deletion; null means the dialog is closed.
export default function DeleteProductDialog({ product, isDeleting, onConfirm, onCancel }) {
  function handleOpenChange(isOpen) {
    if (!isOpen && !isDeleting) {
      onCancel();
    }
  }

  return (
    <AlertDialog open={Boolean(product)} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove{' '}
            <span className="font-medium text-foreground">{product?.name}</span> from your
            catalog.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          {/* A plain Button (not AlertDialogAction) so the dialog stays open while the request runs. */}
          <Button
            size="lg"
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="animate-spin" />}
            Delete product
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
