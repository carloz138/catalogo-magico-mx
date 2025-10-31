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
    let msg = `🎉
