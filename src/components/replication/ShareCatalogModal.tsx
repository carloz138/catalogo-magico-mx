import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Mail, MessageSquare, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCanvas } from "qrcode.react";

interface ShareCatalogModalProps {
  open: boolean;
  onClose: () => void;
  activationLink: string;
  customerName?: string;
  distributorName?: string;
}

export function ShareCatalogModal({
  open,
  onClose,
  activationLink,
  customerName = "Cliente",
  distributorName = "tu negocio",
}: ShareCatalogModalProps) {
  const { toast } = useToast();
  const qrRef = useRef<HTMLCanvasElement>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "✅ Copiado",
        description: "El texto se copió al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el texto",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const shareViaEmail = (subject: string, body: string) => {
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const downloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "catalogo-qr.png";
    link.href = url;
    link.click();
  };

  const whatsappMessage = `🎉 ¡Hola ${customerName}!

Gracias por tu interés en nuestros productos. He creado un catálogo digital especial para ti con todos los productos que cotizaste.

🔗 ${activationLink}

Puedes:
✅ Ver el catálogo completo (GRATIS)
✅ O activar cotizaciones automáticas por $29 MXN y empezar a vender estos productos a tus propios clientes

¡Es una excelente oportunidad para hacer crecer tu negocio! 🚀`;

  const emailSubject = `Tu catálogo digital de ${distributorName} está listo`;
  const emailBody = `Hola ${customerName},

Gracias por tu interés en nuestros productos.

He creado un catálogo digital especial para ti. Puedes verlo en el siguiente enlace:

${activationLink}

Con este catálogo puedes:
- Ver todos los productos (GRATIS)
- Activar cotizaciones automáticas por $29 MXN
- Empezar a vender estos productos a tus propios clientes

Es una excelente oportunidad para hacer crecer tu negocio.

Saludos,
${distributorName}`;

  const smsMessage = `${customerName}, tu catálogo digital está listo: ${activationLink} - Actívalo por $29 MXN y empieza a vender 🚀`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            ✅ Catálogo Replicado Creado
          </DialogTitle>
          <DialogDescription>
            Comparte este link con tu cliente para que active su catálogo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Link directo */}
          <div>
            <Label className="text-base font-semibold mb-2 block">
              Link de activación
            </Label>
            <div className="flex gap-2">
              <Input
                value={activationLink}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                onClick={() => copyToClipboard(activationLink)}
                variant="outline"
                size="icon"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Templates de mensaje */}
          <div>
            <Label className="text-base font-semibold mb-2 block">
              Plantillas de mensaje
            </Label>
            <Tabs defaultValue="whatsapp" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="whatsapp">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms">SMS</TabsTrigger>
              </TabsList>

              <TabsContent value="whatsapp" className="space-y-3">
                <Textarea
                  value={whatsappMessage}
                  readOnly
                  rows={12}
                  className="font-mono text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(whatsappMessage)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    onClick={() => shareViaWhatsApp(whatsappMessage)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Enviar por WhatsApp
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-3">
                <div>
                  <Label className="text-sm">Asunto:</Label>
                  <Input
                    value={emailSubject}
                    readOnly
                    className="font-mono text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Mensaje:</Label>
                  <Textarea
                    value={emailBody}
                    readOnly
                    rows={10}
                    className="font-mono text-sm mt-1 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(emailBody)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    onClick={() => shareViaEmail(emailSubject, emailBody)}
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Abrir Email
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="sms" className="space-y-3">
                <Textarea
                  value={smsMessage}
                  readOnly
                  rows={3}
                  className="font-mono text-sm resize-none"
                />
                <Button
                  onClick={() => copyToClipboard(smsMessage)}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar mensaje SMS
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* QR Code */}
          <div className="border rounded-lg p-6 text-center bg-gray-50">
            <Label className="text-base font-semibold mb-3 block">
              Código QR para imprimir
            </Label>
            <div className="flex flex-col items-center">
              <QRCodeCanvas
                value={activationLink}
                size={200}
                level="H"
                includeMargin={true}
                ref={qrRef}
              />
              <p className="text-sm text-muted-foreground my-3">
                Comparte este QR en flyers, tarjetas o stands
              </p>
              <Button onClick={downloadQR} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Descargar QR
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
