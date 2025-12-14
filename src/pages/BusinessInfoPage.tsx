import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
// import { BusinessInfo, BusinessInfoForm } from "@/types/business"; // Comentado por si no tienes los tipos exactos
import { Button } from "@/components/ui/button";
import { Building2, Upload, Palette, Eye, Save } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import SubscriptionCard from "@/components/SubscriptionCard";

// Definimos la interfaz localmente para evitar conflictos
interface BusinessInfoForm {
  business_name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  primary_color: string;
  secondary_color: string;
}

const BusinessInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingInfo, setExistingInfo] = useState<any | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const [formData, setFormData] = useState<BusinessInfoForm>({
    business_name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    primary_color: "#3B82F6",
    secondary_color: "#1F2937",
  });

  useEffect(() => {
    loadExistingBusinessInfo();
  }, []);

  const loadExistingBusinessInfo = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any).from("business_info").select("*").eq("user_id", user.id).single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading business info:", error);
        return;
      }

      if (data) {
        setExistingInfo(data);

        // --- 🛡️ CORRECCIÓN AQUÍ: MANEJO HÍBRIDO DE DIRECCIÓN ---
        let addressString = "";
        if (data.address) {
          if (typeof data.address === "object") {
            // Si es JSON (Nuevo formato), lo convertimos a string legible para esta vista
            const addr = data.address;
            const parts = [
              addr.street,
              addr.colony,
              addr.city,
              addr.state,
              addr.zip_code ? `CP ${addr.zip_code}` : null,
            ];
            addressString = parts.filter(Boolean).join(", ");
          } else {
            // Si es String (Viejo formato), lo usamos directo
            addressString = data.address;
          }
        }
        // -------------------------------------------------------

        setFormData({
          business_name: data.business_name || "",
          description: data.description || "",
          address: addressString, // Usamos la variable sanitizada
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          instagram: data.social_media?.instagram || "",
          facebook: data.social_media?.facebook || "",
          whatsapp: data.social_media?.whatsapp || "",
          primary_color: data.primary_color || "#3B82F6",
          secondary_color: data.secondary_color || "#1F2937",
        });
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
      }
    } catch (error) {
      console.error("Error loading business info:", error);
      toast.error("Error al cargar información del negocio");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BusinessInfoForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El logo debe ser menor a 5MB");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Solo se permiten archivos JPG, PNG o WebP");
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
        const oldPath = existingInfo.logo_url.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("business-logos").remove([`${userId}/${oldPath}`]);
        }
      }

      const fileExt = logoFile.name.split(".").pop();
      const fileName = `logo.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("business-logos").getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!formData.business_name.trim()) {
      toast.error("El nombre del negocio es requerido");
      return;
    }

    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const logoUrl = await uploadLogo(user.id);

      // NOTA: Al guardar desde esta página "Legacy", guardamos la dirección como objeto simple
      // para no romper la estructura JSONB de la base de datos.
      // Lo ideal es que uses la página nueva (BusinessInfoSettings) para editar la dirección.
      const addressToSave =
        typeof existingInfo?.address === "object"
          ? { ...existingInfo.address, street: formData.address } // Intentamos preservar estructura si existe
          : { street: formData.address }; // Si no, creamos estructura básica

      const businessData = {
        user_id: user.id,
        business_name: formData.business_name.trim(),
        description: formData.description.trim() || null,
        address: addressToSave, // Guardamos como objeto compatible
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

      // Limpieza de objeto social_media
      const socialMedia: any = businessData.social_media;
      Object.keys(socialMedia).forEach((key) => {
        if (!socialMedia[key]) {
          delete socialMedia[key];
        }
      });

      const { error } = await (supabase as any).from("business_info").upsert(businessData, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Información del negocio guardada correctamente");

      await loadExistingBusinessInfo();
    } catch (error) {
      console.error("Error saving business info:", error);
      toast.error("Error al guardar la información");
    } finally {
      setSaving(false);
    }
  };

  const actions = (
    <div className="hidden lg:flex items-center gap-2 w-full md:w-auto">
      <Button variant="outline" onClick={() => setPreviewMode(!previewMode)} className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        {previewMode ? "Editar" : "Preview"}
      </Button>

      <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
        <Save className="h-4 w-4" />
        {saving ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Info del Negocio</h1>
          <p className="text-gray-500">Personaliza la apariencia de tus catálogos</p>
        </div>
        {actions}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 w-full overflow-x-hidden min-w-0">
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Información Básica
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Nombre del Negocio *</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange("business_name", e.target.value)}
                  className="w-full h-11 sm:h-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Mi Empresa S.A. de C.V."
                  disabled={previewMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Breve descripción de tu negocio..."
                  disabled={previewMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="w-full h-11 sm:h-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Calle 123, Col. Centro, Ciudad, CP 12345"
                  disabled={previewMode}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Información de Contacto</h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full h-11 sm:h-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="+52 555 123 4567"
                  disabled={previewMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full h-11 sm:h-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="contacto@miempresa.com"
                  disabled={previewMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Sitio Web</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="w-full h-11 sm:h-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="https://miempresa.com"
                  disabled={previewMode}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-8 space-y-4 sm:space-y-6 h-fit">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Palette className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Personalización
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Logo de la Empresa</label>

                {!previewMode && (
                  <div className="mb-2 sm:mb-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex flex-col sm:flex-row items-center justify-center w-full p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer"
                    >
                      <Upload className="h-5 w-5 text-gray-400 mb-2 sm:mb-0 sm:mr-2" />
                      <span className="text-gray-600 text-sm sm:text-base text-center">Subir logo (máx 5MB)</span>
                    </label>
                  </div>
                )}

                {logoPreview && (
                  <div className="flex justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-20 w-20 sm:h-24 sm:w-24 object-contain border rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Color Primario</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange("primary_color", e.target.value)}
                      className="h-11 w-16 sm:w-20 border border-gray-300 rounded cursor-pointer"
                      disabled={previewMode}
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange("primary_color", e.target.value)}
                      className="flex-1 h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      disabled={previewMode}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Color Secundario</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                      className="h-11 w-16 sm:w-20 border border-gray-300 rounded cursor-pointer"
                      disabled={previewMode}
                    />
                    <input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                      className="flex-1 h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      disabled={previewMode}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SubscriptionCard compact={false} showTitle={true} />

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Vista Previa del Catálogo</h2>

            <div
              className="p-4 sm:p-6 rounded-lg text-white mb-3 sm:mb-4"
              style={{ backgroundColor: formData.primary_color }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
                <div className="w-full">
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="h-10 w-10 sm:h-12 sm:w-12 object-contain bg-white rounded p-1 mb-2 sm:mb-3"
                    />
                  )}
                  <h3 className="text-lg sm:text-xl font-bold">{formData.business_name || "Nombre del Negocio"}</h3>
                  {formData.description && <p className="text-xs sm:text-sm opacity-90 mt-1">{formData.description}</p>}
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="bg-gray-100 h-28 sm:h-32 rounded-lg mb-2 sm:mb-3 flex items-center justify-center">
                <span className="text-gray-500 text-xs sm:text-sm">Imagen del Producto</span>
              </div>
              <h4 className="font-semibold text-sm sm:text-base" style={{ color: formData.secondary_color }}>
                Producto de Ejemplo
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm">Descripción del producto</p>
              <p className="font-bold mt-2 text-sm sm:text-base" style={{ color: formData.primary_color }}>
                $299.00 MXN
              </p>
            </div>

            <div
              className="p-3 sm:p-4 rounded-lg text-white text-xs sm:text-sm"
              style={{ backgroundColor: formData.secondary_color }}
            >
              <div className="space-y-1">
                {formData.phone && <p>📞 {formData.phone}</p>}
                {formData.email && <p>✉️ {formData.email}</p>}
                {/* 🛡️ CORRECCIÓN: Renderizamos la cadena sanitizada, no el objeto */}
                {formData.address && <p className="truncate">📍 {formData.address}</p>}
                {formData.instagram && <p>📱 {formData.instagram}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-40 safe-bottom">
        <div className="flex items-center gap-2 max-w-7xl mx-auto">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)} className="flex-1 h-11">
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Editar" : "Preview"}
          </Button>

          <Button onClick={handleSave} disabled={saving} className="flex-[2] h-11">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      <div className="lg:hidden h-20" />
    </div>
  );
};

export default BusinessInfoPage;
