# Sistema de Referidos (Afiliados) - Documentación Técnica Completa

> **Versión**: 1.0  
> **Última actualización**: 2025-01-01  
> **Estado**: Producción

---

## 📋 Resumen Ejecutivo

El sistema de referidos de CatifyPro permite que cualquier usuario gane comisiones por traer nuevos clientes pagados a la plataforma.

### Modelo de Comisiones

| Periodo | Comisión | Estado Inicial |
|---------|----------|----------------|
| **Mes 1** | 50% de la suscripción | `ready` (disponible inmediatamente) |
| **Mes 2** | 50% adicional si renueva | `locked` (bloqueado 30 días) |

### Ejemplo Práctico
Si refieres a alguien que compra el **Plan Elite ($499 MXN)**:
- **Mes 1**: Ganas $249.50 MXN (disponible al instante)
- **Mes 2**: Si renueva, ganas otros $249.50 MXN

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DEL SISTEMA DE REFERIDOS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1️⃣ REGISTRO CON CÓDIGO                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐   │
│  │ Usuario visita   │───>│ Se guarda en     │───>│ Al registrarse,     │   │
│  │ /?ref=ABC123     │    │ localStorage     │    │ se canjea el código │   │
│  └──────────────────┘    └──────────────────┘    └──────────────────────┘   │
│                                                              │               │
│                                          ┌───────────────────▼────────────┐  │
│                                          │ affiliate_relationships       │  │
│                                          │ (referrer_id → referred_user) │  │
│                                          └───────────────────┬────────────┘  │
│                                                              │               │
│  2️⃣ PAGO DE SUSCRIPCIÓN                                     ▼               │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐   │
│  │ Usuario paga     │───>│ Trigger detecta  │───>│ Se crean 2 payouts: │   │
│  │ suscripción      │    │ activación       │    │ • 1 ready (hoy)     │   │
│  └──────────────────┘    └──────────────────┘    │ • 1 locked (30 días)│   │
│                                                  └──────────────────────┘   │
│                                                                              │
│  3️⃣ COBRO DE COMISIONES                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐   │
│  │ Admin ve         │───>│ Transfiere vía   │───>│ Marca como          │   │
│  │ pendientes       │    │ SPEI/WhatsApp    │    │ 'processed'         │   │
│  └──────────────────┘    └──────────────────┘    └──────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Mapa de Archivos

### Frontend (React)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/hooks/useAffiliateTracker.ts` | Hook | Detecta `?ref=` en URL y guarda en localStorage |
| `src/components/auth/ReferralHandler.tsx` | Component | Canjea código guardado al hacer login |
| `src/components/dashboard/ReferralLinkCard.tsx` | Component | Muestra link de referido con botones copiar/WhatsApp |
| `src/components/dashboard/AffiliateStats.tsx` | Component | Panel con saldo disponible y link |
| `src/pages/dashboard/AffiliateStats.tsx` | Page | Versión página del panel de afiliados |
| `src/pages/dashboard/MoneyDashboard.tsx` | Page | Dashboard financiero con tab de referidos |
| `src/pages/AffiliateProgramPage.tsx` | Page | Landing page del programa de afiliados |
| `src/pages/AdminPayoutDashboard.tsx` | Page | Panel admin para procesar pagos |
| `src/components/landing/ReferralPromoSection.tsx` | Component | Sección promocional en landing |

### Base de Datos

| Tabla | Propósito |
|-------|-----------|
| `affiliates` | Perfil de afiliado (código, saldos) |
| `affiliate_relationships` | Relación referrer ↔ referido |
| `affiliate_payouts` | Comisiones individuales con estado |
| `payout_batches` | Lotes de pagos procesados |

### Funciones SQL

| Función | Trigger/RPC | Descripción |
|---------|-------------|-------------|
| `generate_affiliate_code()` | Utility | Genera código alfanumérico de 6 chars |
| `handle_new_user_affiliate()` | Trigger on auth.users | Crea perfil affiliates al registrarse |
| `redeem_referral_code()` | RPC | Vincula referido con su padrino |
| `handle_new_subscription_commission()` | Trigger on subscriptions | Crea payouts al activar suscripción |
| `add_referral_commission()` | RPC (legacy) | Agrega comisión manualmente |

### Vistas SQL

| Vista | Descripción |
|-------|-------------|
| `admin_pending_payouts_view` | Pagos pendientes agrupados por usuario |
| `admin_referrals_payout_view` | Resumen de payouts por usuario |

---

## 🗄️ PARTE 1: ESTRUCTURA DE BASE DE DATOS

### 1.1 Tabla: `affiliates`

Almacena el perfil de afiliado de cada usuario.

```sql
CREATE TABLE public.affiliates (
  user_id UUID PRIMARY KEY,                    -- FK a auth.users
  referral_code TEXT NOT NULL UNIQUE,          -- Ej: "ABC123"
  referred_by UUID,                            -- Quién lo refirió (legacy)
  balance_mxn NUMERIC DEFAULT 0,               -- Saldo disponible (legacy)
  total_earnings_mxn NUMERIC DEFAULT 0,        -- Total histórico (legacy)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Nota**: `balance_mxn` y `total_earnings_mxn` son **legacy**. El saldo real se calcula desde `affiliate_payouts`.

#### Ejemplo de datos:
```json
{
  "user_id": "a8524a92-06fd-4f5d-a4a6-143d5b5115bf",
  "referral_code": "OTRAPR-558D",
  "referred_by": null,
  "balance_mxn": 0,
  "total_earnings_mxn": 0,
  "created_at": "2025-12-26T21:24:45.77375+00"
}
```

### 1.2 Tabla: `affiliate_relationships`

Vincula quién refirió a quién.

```sql
CREATE TABLE public.affiliate_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,           -- El padrino
  referred_user_id UUID NOT NULL UNIQUE, -- El ahijado (solo puede tener 1 padrino)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Ejemplo:
```json
{
  "id": "aea9bfd6-af4a-4bd0-be9e-70cf569a7c44",
  "referrer_id": "a6a2be68-849f-4358-a799-2f8e7d1100c6",
  "referred_user_id": "c4e493f5-2534-4e77-a24d-b2a375aeb21d",
  "created_at": "2025-12-27T05:00:52.030957+00"
}
```

### 1.3 Tabla: `affiliate_payouts`

Registra cada comisión individual con su estado.

```sql
CREATE TABLE public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                -- Quién recibe el pago
  amount NUMERIC NOT NULL,              -- Monto en MXN
  status TEXT DEFAULT 'locked',         -- 'locked' | 'ready' | 'processed'
  release_date TIMESTAMPTZ NOT NULL,    -- Cuándo se libera
  origin_subscription_id UUID NOT NULL, -- Suscripción que generó la comisión
  batch_id UUID,                        -- Lote de pago (cuando se procesa)
  failure_reason TEXT,                  -- Si falló el pago
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Estados de Payout:

| Estado | Significado |
|--------|-------------|
| `locked` | Comisión bloqueada (esperando 30 días) |
| `ready` | Disponible para cobrar |
| `processed` | Ya fue pagado |

#### Ejemplo:
```json
{
  "id": "856411f7-d8c8-4352-8e2a-6fd381a1dd8c",
  "user_id": "a6a2be68-849f-4358-a799-2f8e7d1100c6",
  "amount": 250.00,
  "status": "locked",
  "release_date": "2026-01-26T05:00:52.030957+00",
  "origin_subscription_id": "bc72e41e-848b-4e27-9a65-fe027758a96b",
  "batch_id": null,
  "created_at": "2025-12-27T05:00:52.030957+00"
}
```

### 1.4 Tabla: `payout_batches`

Agrupa pagos procesados en lotes.

```sql
CREATE TABLE public.payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'completed',
  batch_type TEXT DEFAULT 'mixed',
  file_url TEXT,                    -- Archivo SPEI si aplica
  provider_response JSONB,          -- Respuesta del banco
  bank_response_json JSONB,
  processed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## ⚙️ PARTE 2: FUNCIONES Y TRIGGERS SQL

### 2.1 Generación Automática de Código

```sql
CREATE FUNCTION generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 2.2 Creación Automática de Perfil Afiliado

**Trigger**: `on_auth_user_created_affiliate`  
**Evento**: `AFTER INSERT ON auth.users`

```sql
CREATE FUNCTION handle_new_user_affiliate()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.affiliates (user_id, referral_code, created_at)
  VALUES (
    new.id, 
    generate_affiliate_code(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Resultado**: Todo usuario nuevo tiene automáticamente un código de referido.

### 2.3 Canjeo de Código de Referido

**RPC**: `redeem_referral_code(code_input TEXT)`

```sql
CREATE FUNCTION redeem_referral_code(code_input TEXT)
RETURNS JSON AS $$
DECLARE
    referrer_uuid UUID;
    new_user_uuid UUID;
BEGIN
    new_user_uuid := auth.uid();
    
    IF new_user_uuid IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'No estás logueado');
    END IF;

    -- Buscar dueño del código
    SELECT user_id INTO referrer_uuid
    FROM public.affiliates
    WHERE referral_code = code_input;

    IF referrer_uuid IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Código inválido');
    END IF;

    -- Crear relación (si ya existe, no hace nada)
    INSERT INTO public.affiliate_relationships (referrer_id, referred_user_id)
    VALUES (referrer_uuid, new_user_uuid)
    ON CONFLICT (referred_user_id) DO NOTHING;

    RETURN json_build_object('success', true, 'referrer_id', referrer_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.4 Generación de Comisiones al Activar Suscripción

**Trigger**: `on_subscription_activated`  
**Evento**: `AFTER INSERT OR UPDATE ON subscriptions`

```sql
CREATE FUNCTION handle_new_subscription_commission()
RETURNS TRIGGER AS $$
DECLARE
    referrer_uuid UUID;
    commission_amount NUMERIC;
BEGIN
    -- Solo si la suscripción se activa
    IF (NEW.status = 'active') AND (OLD.status IS DISTINCT FROM 'active' OR OLD.status IS NULL) THEN
        
        -- Buscar si tiene padrino
        SELECT referrer_id INTO referrer_uuid
        FROM affiliate_relationships
        WHERE referred_user_id = NEW.user_id;

        IF referrer_uuid IS NOT NULL THEN
            
            -- Calcular 50% de la suscripción
            commission_amount := (COALESCE(NEW.unit_amount, 0) / 100.0) * 0.50;

            IF commission_amount > 0 THEN
                -- Pago Mes 1 (disponible hoy)
                INSERT INTO affiliate_payouts 
                  (user_id, amount, status, release_date, origin_subscription_id)
                VALUES 
                  (referrer_uuid, commission_amount, 'ready', NOW(), NEW.id);

                -- Pago Mes 2 (bloqueado 30 días)
                INSERT INTO affiliate_payouts 
                  (user_id, amount, status, release_date, origin_subscription_id)
                VALUES 
                  (referrer_uuid, commission_amount, 'locked', NOW() + INTERVAL '30 days', NEW.id);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🖥️ PARTE 3: COMPONENTES FRONTEND

### 3.1 useAffiliateTracker (Detección de Código)

```typescript
// src/hooks/useAffiliateTracker.ts

export const useAffiliateTracker = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    
    if (refCode) {
      console.log("🎁 Código de referido detectado:", refCode);
      localStorage.setItem("catify_ref_code", refCode);
    }
  }, [searchParams]);
};
```

**Uso**: Se llama en el componente raíz (App.tsx o Index.tsx) para detectar `?ref=ABC123` en la URL.

### 3.2 ReferralHandler (Canjeo Automático)

```typescript
// src/components/auth/ReferralHandler.tsx

export function ReferralHandler() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkAndRedeemReferral = async () => {
      const storedCode = localStorage.getItem("catify_ref_code");

      if (storedCode) {
        const { data, error } = await supabase.rpc("redeem_referral_code", {
          code_input: storedCode,
        });

        if (data?.success) {
          toast({
            title: "¡Referido Aplicado!",
            description: "Se ha vinculado tu cuenta con tu invitador.",
          });
        }
        
        // Limpiar para no intentar de nuevo
        localStorage.removeItem("catify_ref_code");
      }
    };

    checkAndRedeemReferral();
  }, [user]);

  return null; // No renderiza nada
}
```

**Uso**: Se monta después del login para canjear automáticamente códigos pendientes.

### 3.3 ReferralLinkCard (Compartir Link)

```typescript
// src/components/dashboard/ReferralLinkCard.tsx

export default function ReferralLinkCard() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Buscar código del usuario
    const { data } = await supabase
      .from("affiliates")
      .select("referral_code")
      .eq("user_id", user.id)
      .single();

    if (data) setReferralCode(data.referral_code);
  }, [user]);

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  // Botones para copiar y compartir por WhatsApp
  return (
    <Card>
      <Input readOnly value={referralLink} />
      <Button onClick={handleCopy}>Copiar</Button>
      <Button onClick={handleWhatsApp}>WhatsApp</Button>
    </Card>
  );
}
```

### 3.4 AffiliateStats (Panel de Ganancias)

```typescript
// src/components/dashboard/AffiliateStats.tsx

export function AffiliateStats() {
  const [realBalance, setRealBalance] = useState(0);
  const [totalHistorical, setTotalHistorical] = useState(0);

  useEffect(() => {
    // Calcular saldos desde affiliate_payouts
    const { data: payouts } = await supabase
      .from("affiliate_payouts")
      .select("amount, status")
      .eq("user_id", user.id);

    // Disponible = solo 'ready'
    const available = payouts
      .filter(p => p.status === "ready")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Histórico = todo
    const historical = payouts
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    setRealBalance(available);
    setTotalHistorical(historical);
  }, [user]);

  // Muestra saldo y botón de retiro via WhatsApp
  return <Card>...</Card>;
}
```

### 3.5 AdminPayoutDashboard (Panel Admin)

```typescript
// src/pages/AdminPayoutDashboard.tsx

export default function AdminPayoutDashboard() {
  const [payouts, setPayouts] = useState([]);

  // Cargar desde vista SQL
  const fetchPayouts = async () => {
    const { data } = await supabase
      .from("admin_pending_payouts_view")
      .select("*");
    setPayouts(data);
  };

  const markAsPaid = async (payout) => {
    // 1. Crear lote
    const { data: batch } = await supabase
      .from("payout_batches")
      .insert({ total_amount: payout.total_to_pay })
      .select().single();

    // 2. Actualizar payouts a 'processed'
    await supabase
      .from("affiliate_payouts")
      .update({ status: "processed", batch_id: batch.id })
      .eq("user_id", payout.user_id)
      .eq("status", "ready");
  };

  return <Table>...</Table>;
}
```

---

## 🔄 PARTE 4: FLUJO COMPLETO PASO A PASO

### Paso 1: Usuario A Comparte su Link

```
https://catifypro.com/?ref=ABC123
```

### Paso 2: Usuario B Visita el Link

```typescript
// useAffiliateTracker detecta ?ref=ABC123
localStorage.setItem("catify_ref_code", "ABC123");
```

### Paso 3: Usuario B Se Registra

```typescript
// Trigger on_auth_user_created_affiliate se ejecuta
INSERT INTO affiliates (user_id, referral_code) 
VALUES ('user-b-id', 'XYZ789');
```

### Paso 4: Usuario B Hace Login

```typescript
// ReferralHandler detecta código en localStorage
await supabase.rpc("redeem_referral_code", { code_input: "ABC123" });

// Se crea la relación
INSERT INTO affiliate_relationships (referrer_id, referred_user_id)
VALUES ('user-a-id', 'user-b-id');
```

### Paso 5: Usuario B Paga Suscripción

```typescript
// Trigger on_subscription_activated se ejecuta
// Detecta que user-b tiene padrino (user-a)
// Calcula 50% del pago

INSERT INTO affiliate_payouts 
  (user_id, amount, status, release_date)
VALUES 
  ('user-a-id', 249.50, 'ready', NOW()),      -- Mes 1
  ('user-a-id', 249.50, 'locked', NOW() + 30 days); -- Mes 2
```

### Paso 6: Usuario A Cobra

```typescript
// Usuario A ve $249.50 disponibles en su dashboard
// Solicita retiro vía WhatsApp
// Admin procesa y marca como 'processed'
```

---

## 📊 PARTE 5: VISTAS SQL PARA ADMIN

### admin_pending_payouts_view

```sql
SELECT 
  ap.user_id,
  u.email,
  SUM(ap.amount) as total_to_pay,
  COUNT(*) as pending_items_count
FROM affiliate_payouts ap
JOIN auth.users u ON u.id = ap.user_id
WHERE ap.status = 'ready'
GROUP BY ap.user_id, u.email;
```

### admin_referrals_payout_view

```sql
SELECT 
  ap.user_id,
  u.email,
  SUM(ap.amount) as total_to_pay,
  COUNT(*) as payouts_count
FROM affiliate_payouts ap
JOIN auth.users u ON u.id = ap.user_id
GROUP BY ap.user_id, u.email;
```

---

## 🚨 PARTE 6: ESTADO ACTUAL Y MEJORAS PENDIENTES

### ✅ Funcionando

| Feature | Estado |
|---------|--------|
| Generación automática de código | ✅ |
| Detección de `?ref=` en URL | ✅ |
| Canjeo automático al login | ✅ |
| Creación de payouts al pagar | ✅ |
| Panel de usuario (saldo/link) | ✅ |
| Panel admin para procesar pagos | ✅ |
| Retiro vía WhatsApp | ✅ |

### ⚠️ Mejoras Sugeridas

| Mejora | Prioridad | Descripción |
|--------|-----------|-------------|
| Job para desbloquear payouts | Alta | Cambiar `locked` → `ready` automáticamente después de 30 días |
| Notificación al ganar comisión | Media | Email/Push cuando se genera un payout |
| Historial de pagos en dashboard | Media | Mostrar todos los payouts con fechas |
| Tracking de clics en link | Baja | Contar cuántas veces se usa el link |
| Niveles de afiliado | Baja | Comisiones mayores para top performers |

### ⚠️ Datos Legacy

Las columnas `balance_mxn` y `total_earnings_mxn` en la tabla `affiliates` ya **no se usan** para mostrar saldos. El saldo real se calcula desde `affiliate_payouts`. Considerar eliminar estas columnas o mantenerlas como cache.

---

## 🔐 PARTE 7: SEGURIDAD

### RLS Policies

```sql
-- Los usuarios solo ven sus propios payouts
CREATE POLICY "Users can view own payouts"
ON affiliate_payouts FOR SELECT
USING (auth.uid() = user_id);

-- Solo el sistema puede insertar payouts (via trigger)
-- Los usuarios no pueden manipular sus comisiones
```

### SECURITY DEFINER

Las funciones críticas usan `SECURITY DEFINER`:
- `handle_new_user_affiliate()` - Para insertar en affiliates
- `redeem_referral_code()` - Para crear relaciones

---

## 📚 Referencias

- Stripe Webhook → Activa suscripción → Trigger genera comisiones
- Tabla `subscriptions` contiene `unit_amount` (precio en centavos)
- WhatsApp para retiros: `+52 818 374 5074`

---

## 📞 Flujo de Retiro Manual

1. Usuario va a Dashboard → Programa de Referidos
2. Ve saldo disponible (`status = 'ready'`)
3. Clic en "Solicitar Retiro"
4. Se abre WhatsApp con mensaje pre-llenado
5. Admin recibe solicitud
6. Admin transfiere vía SPEI
7. Admin entra a `/admin/payouts`
8. Admin marca como pagado
9. Sistema actualiza `status = 'processed'`
