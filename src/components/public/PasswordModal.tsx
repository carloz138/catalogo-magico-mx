import { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DigitalCatalogService } from '@/services/digital-catalog.service';
import { toast } from 'sonner';

interface PasswordModalProps {
  slug: string;
  isOpen: boolean;
  onSuccess: () => void;
}

export default function PasswordModal({ slug, isOpen, onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password.trim()) {
      setError('Por favor ingresa una contraseña');
      return;
    }

    try {
      setIsValidating(true);
      const valid = await DigitalCatalogService.verifyPrivateAccess(slug, password);
      
      if (valid) {
        toast.success('Acceso concedido');
        onSuccess();
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (err) {
      console.error('Error validating password:', err);
      setError('Error al validar contraseña. Intenta de nuevo.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={isOpen} modal>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Este catálogo es privado</DialogTitle>
          <DialogDescription className="text-center">
            Ingresa la contraseña para continuar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className={error ? 'border-destructive' : ''}
              disabled={isValidating}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isValidating}
          >
            {isValidating ? 'Validando...' : 'Acceder'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
