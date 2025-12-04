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
import { Loader2, Save, ArrowLeft, Building2, Upload, X, Globe, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BusinessInfoSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { businessInfo, loading: loadingInfo, loadBusinessInfo } = useBusinessInfo();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  const [formData, setFormData] = useState({
    business_name: businessInfo?.business_name || "",
    phone: businessInfo?.phone || "",
    email: businessInfo?.email || "",
    website: businessInfo?.website || "",
    address: businessInfo?.address || "",
    description: businessInfo?.description || "",
    logo_url: businessInfo?.logo_url || "",
    subdomain: (businessInfo as any)?.subdomain || "",
  });

  // Sync form when businessInfo loads
  useEffect(() => {
    if (businessInfo) {
      setFormData({
        business_name: businessInfo.business_name || "",
        phone: businessInfo.phone || "",
        email: businessInfo.email || "",
        website: businessInfo.website || "",
        address: businessInfo.address || "",
        description: businessInfo.description || "",
        logo_url: businessInfo.logo_url || "",
        subdomain: (businessInfo as any)?.subdomain || "",
      });
    }
  }, [businessInfo]);

  // Check subdomain availability
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 4) {
      setSubdomainStatus('idle');
      return;
    }

    // Validate format
    const validFormat = /^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$/.test(subdomain);
    if (!validFormat) {
      setSubdomainStatus('invalid');
      return;
    }

    setSubdomainStatus('checking');
    
    const { data, error } = await supabase
      .from('business_info')
      .select('user_id')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (error) {
      setSubdomainStatus('idle');
      return;
    }

    // Available if no result OR it's the current user's subdomain
    if (!data || data.user_id === user?.id) {
      setSubdomainStatus('available');
    } else {
      setSubdomainStatus('taken');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Special handling for subdomain
    if (field === 'subdomain') {
      const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
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

    try {
      setSaving(true);

      const { error } = await supabase.from("business_info").upsert(
        {
          user_id: user.id,
          business_name: formData.business_name,
          phone: formData.phone,
          email: formData.email || null,
          website: formData.website || null,
          address: formData.address || null,
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

      // Redirigir si venía desde onboarding o activation
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
    // 👇 CONTENEDOR LIMPIO
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="h-8 w-8 p-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Información del Negocio</h1>
          <p className="text-gray-500">Datos públicos de tu empresa</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Detalles</CardTitle>
                <CardDescription>Esta información se mostrará en tus catálogos públicos</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo */}
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
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Subir logo
                          </>
                        )}
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-2">Recomendado: 200x200px, máx 2MB</p>
                  </div>
                </div>
              </div>

              {/* Formulario Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name">
                    Nombre del Negocio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleChange("business_name", e.target.value)}
                    placeholder="Ej: Distribuidora ABC"
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
                    placeholder="Ej: +52 55 1234 5678"
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
                    placeholder="contacto@tunegocio.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://www.tunegocio.com"
                  />
                </div>
              </div>

              {/* Subdominio Personalizado */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subdomain" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Enlace Personalizado (Subdominio)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => handleChange("subdomain", e.target.value)}
                    placeholder="mi-tienda"
                    className="max-w-[200px]"
                  />
                  <span className="text-sm text-muted-foreground">.catifypro.com</span>
                  {subdomainStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  {subdomainStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {subdomainStatus === 'taken' && <AlertCircle className="w-4 h-4 text-destructive" />}
                </div>
                {subdomainStatus === 'invalid' && (
                  <p className="text-xs text-destructive">Usa solo letras minúsculas, números y guiones. Mínimo 4 caracteres.</p>
                )}
                {subdomainStatus === 'taken' && (
                  <p className="text-xs text-destructive">Este subdominio ya está en uso.</p>
                )}
                {subdomainStatus === 'available' && formData.subdomain && (
                  <p className="text-xs text-green-600">¡Disponible! Tu catálogo estará en: {formData.subdomain}.catifypro.com</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Ejemplo: Si escribes "mi-tienda", tu catálogo será accesible en <strong>mi-tienda.catifypro.com</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Calle, número, colonia, ciudad, estado, CP"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Negocio</Label>
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
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
