import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BusinessInfo, BusinessInfoForm } from '@/types/business';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Building2, Upload, Palette, Eye, Save } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const BusinessInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingInfo, setExistingInfo] = useState<BusinessInfo | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [formData, setFormData] = useState<BusinessInfoForm>({
    business_name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    whatsapp: '',
    primary_color: '#3B82F6',
    secondary_color: '#1F2937'
  });

  useEffect(() => {
    loadExistingBusinessInfo();
  }, []);

  const loadExistingBusinessInfo = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('business_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading business info:', error);
        return;
      }

      if (data) {
        setExistingInfo(data);
        setFormData({
          business_name: data.business_name || '',
          description: data.description || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          instagram: data.social_media?.instagram || '',
          facebook: data.social_media?.facebook || '',
          whatsapp: data.social_media?.whatsapp || '',
          primary_color: data.primary_color || '#3B82F6',
          secondary_color: data.secondary_color || '#1F2937'
        });
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
      }
    } catch (error) {
      console.error('Error loading business info:', error);
      toast.error('Error al cargar información del negocio');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BusinessInfoForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El logo debe ser menor a 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo se permiten archivos JPG, PNG o WebP');
      return;
    }

    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (userId: string): Promise<string | null> => {
    if (!logoFile) return existingInfo?.logo_url || null;

    try {
      if (existingInfo?.logo_url) {
        const oldPath = existingInfo.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('business-logos')
            .remove([`${userId}/${oldPath}`]);
        }
      }

      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('business-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!formData.business_name.trim()) {
      toast.error('El nombre del negocio es requerido');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const logoUrl = await uploadLogo(user.id);

      const businessData = {
        user_id: user.id,
        business_name: formData.business_name.trim(),
        description: formData.description.trim() || null,
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        website: formData.website.trim() || null,
        social_media: {
          instagram: formData.instagram.trim() || undefined,
          facebook: formData.facebook.trim() || undefined,
          whatsapp: formData.whatsapp.trim() || undefined,
        },
        logo_url: logoUrl,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
      };

      Object.keys(businessData.social_media).forEach(key => {
        if (!businessData.social_media[key as keyof typeof businessData.social_media]) {
          delete businessData.social_media[key as keyof typeof businessData.social_media];
        }
      });

      const { error } = await (supabase as any)
        .from('business_info')
        .upsert(businessData, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('Información del negocio guardada correctamente');
      
      await loadExistingBusinessInfo();
      
    } catch (error) {
      console.error('Error saving business info:', error);
      toast.error('Error al guardar la información');
    } finally {
      setSaving(false);
    }
  };

  const actions = (
    <>
      <Button
        variant="outline"
        onClick={() => setPreviewMode(!previewMode)}
        className="flex items-center gap-2"
      >
        <Eye className="h-4 w-4" />
        {previewMode ? 'Editar' : 'Preview'}
      </Button>
      
      <Button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Guardando...' : 'Guardar'}
      </Button>
    </>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando información...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Información Básica
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mi Empresa S.A. de C.V."
                    disabled={previewMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Breve descripción de tu negocio..."
                    disabled={previewMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calle 123, Col. Centro, Ciudad, CP 12345"
                    disabled={previewMode}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Información de Contacto
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+52 555 123 4567"
                    disabled={previewMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contacto@miempresa.com"
                    disabled={previewMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://miempresa.com"
                    disabled={previewMode}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Redes Sociales
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@miempresa"
                    disabled={previewMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mi Empresa"
                    disabled={previewMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+52 555 123 4567"
                    disabled={previewMode}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Personalización
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo de la Empresa
                  </label>
                  
                  {!previewMode && (
                    <div className="mb-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer"
                      >
                        <Upload className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          Subir logo (JPG, PNG, WebP - máx 5MB)
                        </span>
                      </label>
                    </div>
                  )}
                  
                  {logoPreview && (
                    <div className="flex justify-center">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-24 w-24 object-contain border rounded-lg"
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Primario
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                        disabled={previewMode}
                      />
                      <input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={previewMode}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Secundario
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                        disabled={previewMode}
                      />
                      <input
                        type="text"
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={previewMode}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Vista Previa del Catálogo
              </h2>
              
              <div 
                className="p-6 rounded-lg text-white mb-4"
                style={{ backgroundColor: formData.primary_color }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    {logoPreview && (
                      <img 
                        src={logoPreview} 
                        alt="Logo" 
                        className="h-12 w-12 object-contain bg-white rounded p-1 mb-3"
                      />
                    )}
                    <h3 className="text-xl font-bold">
                      {formData.business_name || 'Nombre del Negocio'}
                    </h3>
                    {formData.description && (
                      <p className="text-sm opacity-90 mt-1">
                        {formData.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 mb-4">
                <div className="bg-gray-100 h-32 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-gray-500">Imagen del Producto</span>
                </div>
                <h4 className="font-semibold" style={{ color: formData.secondary_color }}>
                  Producto de Ejemplo
                </h4>
                <p className="text-gray-600 text-sm">Descripción del producto</p>
                <p className="font-bold mt-2" style={{ color: formData.primary_color }}>
                  $299.00 MXN
                </p>
              </div>
              
              <div 
                className="p-4 rounded-lg text-white text-sm"
                style={{ backgroundColor: formData.secondary_color }}
              >
                <div className="space-y-1">
                  {formData.phone && <p>📞 {formData.phone}</p>}
                  {formData.email && <p>✉️ {formData.email}</p>}
                  {formData.address && <p>📍 {formData.address}</p>}
                  {formData.instagram && <p>📱 {formData.instagram}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default BusinessInfoPage;
