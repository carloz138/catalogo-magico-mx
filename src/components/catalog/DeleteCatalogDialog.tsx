import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DigitalCatalog } from '@/types/digital-catalog';
import { AlertTriangle } from 'lucide-react';

interface DeleteCatalogDialogProps {
  catalog: DigitalCatalog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteCatalogDialog({
  catalog,
  open,
  onOpenChange,
  onConfirm,
}: DeleteCatalogDialogProps) {
  if (!catalog) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle>¿Eliminar catálogo?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2 pt-2">
            <p>
              Estás a punto de eliminar el catálogo <strong>"{catalog.name}"</strong>.
            </p>
            <p className="text-destructive font-medium">
              Esta acción no se puede deshacer. El enlace público dejará de funcionar.
            </p>
            {catalog.view_count && catalog.view_count > 0 && (
              <p className="text-sm text-muted-foreground">
                Este catálogo tiene {catalog.view_count} vistas registradas.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar catálogo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
