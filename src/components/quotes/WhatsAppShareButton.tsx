import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppShareButtonProps {
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  trackingUrl: string;
  activationLink?: string;
}

export function WhatsAppShareButton({
  customerName,
  customerPhone,
  orderNumber,
  trackingUrl,
  activationLink,
}: WhatsAppShareButtonProps) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  // Generar mensaje por defecto
  const generateDefaultMessage = () => {
    let msg = `🎉 ¡Hola ${customerName}!

Tu cotización *#${orderNumber}* ha sido *ACEPTADA*.

✅ Puedes ver el estado de tu pedido aquí:
${trackingUrl}`;

    if (activationLink) {
      msg += `\n\n🔗 Activa tu catálogo de revendedor:
${activationLink}

Con tu catálogo podrás:
- Revender estos productos
- Establecer tus propios precios
- Compartirlo con tus clientes`;
    }

    msg += `\n\n¿Tienes alguna duda? ¡Escríbeme!`;

    return msg;
  };

  // Abrir modal y generar mensaje
  const handleOpenModal = () => {
    setMessage(generateDefaultMessage());
    setShowModal(true);
  };

  // Copiar mensaje al portapapeles
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    toast({
      title: "✅ Mensaje copiado",
      description: "El mensaje ha sido copiado al portapapeles",
    });
  };

  // Enviar por WhatsApp
  const handleSendWhatsApp = () => {
    // Limpiar y formatear el número de teléfono
    const cleanPhone = customerPhone.replace(/[\s\-\(\)\+]/g, "");
    
    // Asegurar que tenga código de país (asume México +52 si no lo tiene)
    const finalPhone = cleanPhone.startsWith("52") ? cleanPhone : `52${cleanPhone}`;
    
    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Generar link de WhatsApp
    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, "_blank");
    
    setShowModal(false);
    
    toast({
      title: "✅ WhatsApp abierto",
      description: "Puedes editar el mensaje antes de enviarlo",
    });
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        className="bg-green-600 hover:bg-green-700"
        size="sm"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Notificar por WhatsApp
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Compartir por WhatsApp
            </DialogTitle>
            <DialogDescription>
              Personaliza el mensaje antes de enviarlo a {customerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Mensaje para: {customerPhone}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder="Escribe tu mensaje..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              <p className="font-medium mb-1">💡 Tip:</p>
              <p>
                Puedes editar este mensaje antes de enviarlo. WhatsApp se abrirá
                con el mensaje pre-llenado para que lo revises.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCopyMessage}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Mensaje
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              className="bg-green-600 hover:bg-green-700"
              disabled={!message.trim()}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
