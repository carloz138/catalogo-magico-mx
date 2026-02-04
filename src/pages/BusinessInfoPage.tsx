import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Upload, Palette, Eye, Save, MapPin } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import SubscriptionCard from "@/components/SubscriptionCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Lista oficial de Estados de México (ISO 3166-2:MX) para Envia.com
const MEXICO_STATES = [
  { value: "AGU", label: "Aguascalientes" },
  { value: "BCN", label: "Baja California" },
  { value: "BCS", label: "Baja California Sur" },
  { value: "CAM", label: "Campeche" },
  { value: "CHP", label: "Chiapas" },
  { value: "CHH", label: "Chihuahua" },
  { value: "COA", label: "Coahuila" },
  { value: "COL", label: "Colima" },
  { value: "DIF", label: "Ciudad de México" },
  { value: "DUR", label: "Durango" },
  { value: "GUA", label: "Guanajuato" },
  { value: "GRO", label: "Guerrero" },
  { value: "HID", label: "Hidalgo" },
  { value: "JAL", label: "Jalisco" },
  { value: "MEX", label: "Estado de México" },
  { value: "MIC", label: "Michoacán" },
  { value: "MOR", label: "Morelos" },
  { value: "NAY", label: "Nayarit" },
  { value: "NLE", label: "Nuevo León" },
  { value: "OAX", label: "Oaxaca" },
  { value: "PUE", label: "Puebla" },
  { value: "QUE", label: "Querétaro" },
  { value: "ROO", label: "Quintana Roo" },
  { value: "SLP", label: "San Luis Potosí" },
  { value: "SIN", label: "Sinaloa" },
  { value: "SON", label: "Sonora" },
  { value: "TAB", label: "Tabasco" },
  { value: "TAM", label: "Tamaulipas" },
  { value: "TLA", label: "Tlaxcala" },
  { value: "VER", label: "Veracruz" },
  { value: "YUC", label: "Yucatán" },
  { value: "ZAC", label: "Zacatecas" },
];

interface BusinessInfoForm {
  business_name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  primary_color: string;
  secondary_color: string;
  // Dirección Estructurada
  address_street: string;
  address_colony: string;
  address_zip_code: string;
  address_city: string;
  address_state: string;
  // Coordenadas (Opcional - Plan de Respaldo)
  address_latitude: string;
  address_longitude: string;
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
    phone: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    primary_color: "#3B82F6",
    secondary_color: "#1F2937",
    address_street: "",
    address_colony: "",
    address_zip_code: "",
    address_city: "",
    address_state: "",
    address_latitude: "",
    address_longitude: "",
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

        // --- 🧠 LÓGICA DE CARGA INTELIGENTE ---
        let addr = {
          street: "",
          colony: "",
          zip_code: "",
          city: "",
          state: "",
          latitude: "",
          longitude: "",
        };

        if (data.address) {
          if (typeof data.address === "object") {
            // Formato JSON Nuevo
            addr = {
              street: data.address.street || "",
              colony: data.address.colony || "",
              zip_code: data.address.zip_code || "",
              city: data.address.city || "",
              state: data.address.state || "",
              latitude: data.address.latitude ? String(data.address.latitude) : "",
              longitude: data.address.longitude ? String(data.address.longitude) : "",
            };
          } else if (typeof data.address === "string") {
            // Formato Texto Viejo -> Todo a calle
            addr.street = data.address;
          }
        }

        setFormData({
          business_name: data.business_name || "",
          description: data.description || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          instagram: data.social_media?.instagram || "",
          facebook: data.social_media?.facebook || "",
          whatsapp: data.social_media?.whatsapp || "",
          primary_color: data.primary_color || "#3B82F6",
          secondary_color: data.secondary_color || "#1F2937",
          // Mapeo de Dirección
          address_street: addr.street,
          address_colony: addr.colony,
          address_zip_code: addr.zip_code,
          address_city: addr.city,
          address_state: addr.state,
          address_latitude: addr.latitude,
          address_longitude: addr.longitude,
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
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (userId: string): Promise<string | null> => {
    if (!logoFile) return existingInfo?.logo_url || null;
    const fileExt = logoFile.name.split(".").pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("business-logos")
      .upload(filePath, logoFile, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("business-logos").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!formData.business_name.trim()) {
      toast.error("El nombre del negocio es requerido");
      return;
    }

    // ✅ VALIDACIÓN ESTRICTA (NIVEL 2)
    const cpRegex = /^[0-9]{5}$/;
    if (formData.address_zip_code && !cpRegex.test(formData.address_zip_code)) {
      toast.error("El Código Postal debe ser de 5 dígitos numéricos.");
      return;
    }
    if (formData.address_street && !formData.address_state) {
      toast.error("Si llenas la dirección, debes seleccionar un Estado.");
      return;
    }

    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const logoUrl = await uploadLogo(user.id);

      // --- 📦 EMPAQUETADO ROBUSTO PARA ENVIA.COM ---
      const structuredAddress = {
        street: formData.address_street,
        colony: formData.address_colony,
        zip_code: formData.address_zip_code,
        city: formData.address_city,
        state: formData.address_state, // Ahora envía código ISO (ej: NLE)
        // ✅ Guardamos Coordenadas
        latitude: formData.address_latitude ? parseFloat(formData.address_latitude) : null,
        longitude: formData.address_longitude ? parseFloat(formData.address_longitude) : null,
      };

      const businessData = {
        user_id: user.id,
        business_name: formData.business_name.trim(),
        description: formData.description.trim() || null,
        address: structuredAddress,
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

      const socialMedia: any = businessData.social_media;
      Object.keys(socialMedia).forEach((key) => {
        if (!socialMedia[key]) delete socialMedia[key];
      });

      const { error } = await (supabase as any).from("business_info").upsert(businessData, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Información guardada correctamente");
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
          <p className="text-gray-500">Personaliza tu perfil y dirección de envíos.</p>
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
                <Label>Nombre del Negocio *</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => handleInputChange("business_name", e.target.value)}
                  disabled={previewMode}
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  disabled={previewMode}
                />
              </div>
            </div>
          </div>

          {/* ✅ DIRECCIÓN CON ESTANDARIZACIÓN Y COORDENADAS */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-l-indigo-500">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" /> Dirección de Origen (Envíos)
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Esta dirección se usará para calcular las tarifas de paquetería.
            </p>

            <div className="space-y-4">
              <div>
                <Label>Calle y Número</Label>
                <Input
                  value={formData.address_street}
                  onChange={(e) => handleInputChange("address_street", e.target.value)}
                  placeholder="Av. Reforma 123"
                  disabled={previewMode}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Colonia</Label>
                  <Input
                    value={formData.address_colony}
                    onChange={(e) => handleInputChange("address_colony", e.target.value)}
                    placeholder="Centro"
                    disabled={previewMode}
                  />
                </div>
                <div>
                  <Label>Código Postal *</Label>
                  <Input
                    value={formData.address_zip_code}
                    onChange={(e) => handleInputChange("address_zip_code", e.target.value)}
                    placeholder="00000"
                    maxLength={5}
                    disabled={previewMode}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ciudad *</Label>
                  <Input
                    value={formData.address_city}
                    onChange={(e) => handleInputChange("address_city", e.target.value)}
                    placeholder="Monterrey"
                    disabled={previewMode}
                  />
                </div>
                <div>
                  <Label>Estado *</Label>
                  {/* ✅ SELECT DE ESTADOS ESTANDARIZADO */}
                  <Select
                    disabled={previewMode}
                    value={formData.address_state}
                    onValueChange={(val) => handleInputChange("address_state", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MEXICO_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ✅ SECCIÓN DE COORDENADAS (OPCIONAL) */}
              <div className="pt-2 border-t border-slate-100 mt-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">
                  Ubicación Exacta (Opcional)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">Latitud</Label>
                    <Input
                      type="number"
                      value={formData.address_latitude}
                      onChange={(e) => handleInputChange("address_latitude", e.target.value)}
                      placeholder="25.6866"
                      className="h-8 text-xs"
                      disabled={previewMode}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Longitud</Label>
                    <Input
                      type="number"
                      value={formData.address_longitude}
                      onChange={(e) => handleInputChange("address_longitude", e.target.value)}
                      placeholder="-100.3161"
                      className="h-8 text-xs"
                      disabled={previewMode}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTACTO */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Información de Contacto</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label>Teléfono</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={previewMode}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={previewMode}
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  placeholder="5512345678"
                  disabled={previewMode}
                />
              </div>
              <div>
                <Label>Sitio Web</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  disabled={previewMode}
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:sticky lg:top-8 space-y-4 sm:space-y-6 h-fit">
          {/* ... (Sección Logo y Colores - Igual) ... */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Palette className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Personalización
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label>Logo de la Empresa</Label>
                {!previewMode && (
                  <div className="mb-2 sm:mb-3">
                    <input
                      type="file"
                      accept="image/*"
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
                      alt="Logo"
                      className="h-20 w-20 sm:h-24 sm:w-24 object-contain border rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Color Primario</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange("primary_color", e.target.value)}
                      className="h-11 w-16 border rounded cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange("primary_color", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Color Secundario</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                      className="h-11 w-16 border rounded cursor-pointer"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SubscriptionCard compact={false} showTitle={true} />

          {/* Preview del Catálogo */}
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
            <div
              className="p-3 sm:p-4 rounded-lg text-white text-xs sm:text-sm"
              style={{ backgroundColor: formData.secondary_color }}
            >
              <div className="space-y-1">
                {formData.phone && <p>📞 {formData.phone}</p>}
                {formData.email && <p>✉️ {formData.email}</p>}
                {(formData.address_street || formData.address_city) && (
                  <p className="truncate">
                    📍 {formData.address_street}, {formData.address_city}
                  </p>
                )}
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
