import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessInfo } from "@/hooks/useBusinessInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, ArrowLeft, Building2, Upload, X, Globe, AlertCircle, CheckCircle2, MapPin } from "lucide-react";

// Estructura de dirección para TypeScript
interface AddressStructured {
  street: string;
  colony: string;
  zip_code: string;
  city: string;
  state: string;
}

export default function BusinessInfoSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { businessInfo, loading: loadingInfo, loadBusinessInfo } = useBusinessInfo();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">(
    "idle",
  );

  const [formData, setFormData] = useState({
    business_name: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    logo_url: "",
    subdomain: "",
    // Desglosamos la dirección
    address_street: "",
    address_colony: "",
    address_zip_code: "",
    address_city: "",
    address_state: "",
  });

  // Sync form when businessInfo loads
  useEffect(() => {
    if (businessInfo) {
      // Lógica para detectar si la dirección viene como JSON o Texto viejo
      let addr: AddressStructured = { street: "", colony: "", zip_code: "", city: "", state: "" };

      const rawAddress = businessInfo.address as any;

      if (rawAddress && typeof rawAddress === "object") {
        // Es JSON Nuevo
        addr = {
          street: rawAddress.street || "",
          colony: rawAddress.colony || "",
          zip_code: rawAddress.zip_code || "",
          city: rawAddress.city || "",
          state: rawAddress.state || "",
        };
      } else if (typeof rawAddress === "string") {
        // Es Texto Viejo (Lo ponemos todo en calle para que el usuario lo acomode)
        addr.street = rawAddress;
      }

      setFormData({
        business_name: businessInfo.business_name || "",
        phone: businessInfo.phone || "",
        email: businessInfo.email || "",
        website: businessInfo.website || "",
        description: businessInfo.description || "",
        logo_url: businessInfo.logo_url || "",
        subdomain: (businessInfo as any)?.subdomain || "",
        // Mapeamos la dirección
        address_street: addr.street,
        address_colony: addr.colony,
        address_zip_code: addr.zip_code,
        address_city: addr.city,
        address_state: addr.state,
      });
    }
  }, [businessInfo]);

  // Check subdomain availability
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 4) {
      setSubdomainStatus("idle");
      return;
    }

    const validFormat = /^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$/.test(subdomain);
    if (!validFormat) {
      setSubdomainStatus("invalid");
      return;
    }

    setSubdomainStatus("checking");

    const { data, error } = await supabase
      .from("business_info")
      .select("user_id")
      .eq("subdomain", subdomain)
      .maybeSingle();

    if (error) {
      setSubdomainStatus("idle");
      return;
    }

    if (!data || data.user_id === user?.id) {
      setSubdomainStatus("available");
    } else {
      setSubdomainStatus("taken");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "subdomain") {
      const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      setFormData((prev) => ({ ...prev, subdomain: normalized }));
      checkSubdomainAvailability(normalized);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("business-logos").getPublicUrl(filePath);
      handleChange("logo_url", data.publicUrl);
      toast.success("Logo subido correctamente");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Error al subir el logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    handleChange("logo_url", "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.business_name || !formData.phone) {
      toast.error("El nombre del negocio y teléfono son obligatorios");
      return;
    }

    // Validar Dirección para Envíos
    if (!formData.address_zip_code || !formData.address_city) {
      toast.warning("Para activar envíos, recuerda llenar Código Postal y Ciudad.");
      // No bloqueamos el guardado, solo avisamos
    }

    try {
      setSaving(true);

      // Reconstruimos el objeto Address
      const structuredAddress = {
        street: formData.address_street,
        colony: formData.address_colony,
        zip_code: formData.address_zip_code,
        city: formData.address_city,
        state: formData.address_state,
      };

      const { error } = await supabase.from("business_info").upsert(
        {
          user_id: user.id,
          business_name: formData.business_name,
          phone: formData.phone,
          email: formData.email || null,
          website: formData.website || null,
          // Guardamos el objeto JSON
          address: structuredAddress as any,
          description: formData.description || null,
          logo_url: formData.logo_url || null,
          subdomain: formData.subdomain || null,
        },
        {
          onConflict: "user_id",
        },
      );

      if (error) throw error;

      toast.success("Información guardada correctamente");
      await loadBusinessInfo();

      const params = new URLSearchParams(window.location.search);
      if (params.get("from") === "onboarding" || params.get("from") === "activation") {
        navigate("/catalogs");
      }
    } catch (error: any) {
      console.error("Error saving business info:", error);
      toast.error("Error al guardar la información");
    } finally {
      setSaving(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="h-8 w-8 p-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Información del Negocio</h1>
          <p className="text-gray-500">Datos públicos y dirección de recolección</p>
        </div>
      </div>

      <div className="max-w-4xl grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Perfil Público</CardTitle>
                <CardDescription>Esta información se mostrará en tus catálogos</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Upload Section - Igual que antes */}
              <div className="space-y-2">
                <Label>Logo del Negocio</Label>
                <div className="flex items-center gap-4">
                  {formData.logo_url ? (
                    <div className="relative group">
                      <img
                        src={formData.logo_url}
                        alt="Logo"
                        className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        onClick={handleRemoveLogo}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-muted/50 rounded-lg border-2 border-dashed flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <Building2 className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <Label htmlFor="logo">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => document.getElementById("logo")?.click()}
                        className="w-full sm:w-auto"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" /> Subir logo
                          </>
                        )}
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">Recomendado: 200x200px, máx 2MB</p>
                  </div>
                </div>
              </div>

              {/* Información Básica */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name">
                    Nombre del Negocio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleChange("business_name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Teléfono <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email de Contacto</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                  />
                </div>
              </div>

              {/* Subdominio */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <Label htmlFor="subdomain" className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  Enlace Personalizado
                </Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => handleChange("subdomain", e.target.value)}
                      placeholder="mi-tienda"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">.catifypro.com</span>
                  </div>
                  <div className="w-6">
                    {subdomainStatus === "checking" && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {subdomainStatus === "available" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {subdomainStatus === "taken" && <AlertCircle className="w-4 h-4 text-destructive" />}
                  </div>
                </div>
                {subdomainStatus === "invalid" && (
                  <p className="text-xs text-destructive">Mínimo 4 caracteres alfanuméricos.</p>
                )}
                {subdomainStatus === "taken" && <p className="text-xs text-destructive">No disponible.</p>}
              </div>

              {/* 👇 SECCIÓN DE DIRECCIÓN ESTRUCTURADA */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Dirección de Origen / Recolección</h3>
                    <p className="text-xs text-gray-500">Necesaria para calcular costos de envío.</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_street">
                      Calle y Número <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address_street"
                      value={formData.address_street}
                      onChange={(e) => handleChange("address_street", e.target.value)}
                      placeholder="Ej: Av. Reforma 123"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_colony">Colonia</Label>
                      <Input
                        id="address_colony"
                        value={formData.address_colony}
                        onChange={(e) => handleChange("address_colony", e.target.value)}
                        placeholder="Centro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_zip_code">
                        Código Postal <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="address_zip_code"
                        value={formData.address_zip_code}
                        onChange={(e) => handleChange("address_zip_code", e.target.value)}
                        placeholder="00000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_city">
                        Ciudad / Municipio <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="address_city"
                        value={formData.address_city}
                        onChange={(e) => handleChange("address_city", e.target.value)}
                        placeholder="Monterrey"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_state">Estado</Label>
                      <Input
                        id="address_state"
                        value={formData.address_state}
                        onChange={(e) => handleChange("address_state", e.target.value)}
                        placeholder="Nuevo León"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción Corta</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Breve descripción de tu negocio..."
                  rows={3}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 justify-end border-t">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="min-w-[120px]">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Guardar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
