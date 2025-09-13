// /src/components/products/BusinessInfoBanner.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

interface BusinessInfoBannerProps {
  onDismiss: () => void;
}

export const BusinessInfoBanner: React.FC<BusinessInfoBannerProps> = ({ onDismiss }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 mb-2">
              ¡Personaliza tus catálogos con tu marca!
            </h4>
            <p className="text-sm text-amber-800 mb-4 leading-relaxed">
              Completa la información de tu negocio para crear catálogos profesionales con tu logo, colores y datos de contacto.
            </p>
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                onClick={() => navigate('/business-info')}
                className="bg-amber-600 hover:bg-amber-700 text-white border-0"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Completar Información
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onDismiss}
                className="text-amber-700 hover:bg-amber-100"
              >
                Recordar después
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Función helper para validar información del negocio
export const isBusinessInfoCompleteForCatalog = (businessInfo: any) => {
  if (!businessInfo) return false;
  
  const hasName = businessInfo.business_name?.trim();
  const hasContact = businessInfo.phone?.trim() || 
                    businessInfo.email?.trim() || 
                    businessInfo.social_media?.whatsapp?.trim();
  
  return !!(hasName && hasContact);
};