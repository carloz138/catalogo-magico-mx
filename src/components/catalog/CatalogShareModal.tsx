import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DigitalCatalog } from '@/types/digital-catalog';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Mail, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface CatalogShareModalProps {
  catalog: DigitalCatalog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CatalogShareModal({ catalog, open, onOpenChange }: CatalogShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!catalog) return null;

  const catalogUrl = `${window.location.origin}/c/${catalog.slug}`;
  const shareMessage = `Mira mi catálogo de productos: ${catalog.name}\n${catalogUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(catalogUrl);
      setCopied(true);
      toast({
        title: 'Link copiado',
        description: 'El enlace se ha copiado al portapapeles',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar el enlace',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${catalog.slug}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const shareOnEmail = () => {
    const subject = encodeURIComponent(`Catálogo: ${catalog.name}`);
    const body = encodeURIComponent(shareMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir catálogo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Enlace del catálogo</label>
            <div className="flex gap-2">
              <Input
                value={catalogUrl}
                readOnly
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                size="icon"
                variant={copied ? 'default' : 'outline'}
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Código QR</label>
            <div className="flex flex-col items-center gap-3 p-4 bg-muted rounded-lg">
              <QRCodeSVG
                id="qr-code"
                value={catalogUrl}
                size={200}
                level="H"
                includeMargin
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQR}
              >
                Descargar QR
              </Button>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Compartir en</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="flex flex-col h-auto py-3 gap-1"
                onClick={shareOnWhatsApp}
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-auto py-3 gap-1"
                onClick={shareOnEmail}
              >
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Email</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col h-auto py-3 gap-1"
                onClick={shareOnTwitter}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="text-xs">Twitter</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
