Flujo Técnico Completo: Cotizaciones, Pagos y Logística (v2.0)🎯 Visión GeneralEl sistema ha evolucionado de un simple cotizador a un Sistema Operativo B2B (SaaS). Ahora gestiona el ciclo de vida completo:Solicitud: Cliente pide presupuesto.Negociación: Proveedor define fletes y fechas.Cierre Financiero: Cobro vía SPEI (Openpay) o Manual.Logística: Gestión de envíos y tracking.Expansión: Replicación de catálogos para revendedores.🏗️ Arquitectura del Sistema ActualizadaFragmento de códigograph TB
subgraph "Frontend - Cliente"
A[PublicCatalog] --> B[QuoteForm]
B --> C[TrackQuotePage]
C --> D{Acciones}
D -->|Aceptar| E[accept-quote-public]
D -->|Pagar SPEI| F[create-quote-payment]
D -->|Activar Negocio| G[ActivateCatalog]
end

    subgraph "Frontend - Dashboard Dueño"
        H[QuoteDetail] --> I[Negociar: Flete/Fecha]
        H --> J[Pago Manual]
        K[OrdersPage] --> L[Despachar: Tracking]
    end

    subgraph "Backend - Edge Functions"
        I --> M[send-quote-update]
        E --> N[send-quote-accepted-email]
        F --> O[Openpay API]
        P[openpay-webhook] --> Q[Confirmar Pago]
        Q --> R[send-payment-notification]
    end

    subgraph "Database"
        I & J & L --> S[(quotes)]
        F & P --> T[(payment_transactions)]
        G --> U[(replicated_catalogs)]
        Q --> V[Inventario (RPC)]
    end

    style O fill:#ff9900,stroke:#333,stroke-width:2px
    style P fill:#ff9900,stroke:#333,stroke-width:2px

📊 Modelo de Datos (Schema Update)1. Tabla: quotes (Actualizada)Se agregaron campos para negociación y logística.SQLCREATE TABLE quotes (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- ... (Campos originales: customer_info, catalog_id, etc.) ...

-- 💰 ESTADO COMERCIAL
status TEXT DEFAULT 'pending',
-- Valores: 'pending' | 'negotiation' | 'accepted' | 'rejected' | 'shipped'

-- 🚚 ESTADO LOGÍSTICO (Nuevo)
fulfillment_status TEXT DEFAULT 'unfulfilled',
-- Valores: 'unfulfilled' | 'processing' | 'ready_for_pickup' | 'shipped' | 'delivered'

-- 💵 NEGOCIACIÓN (Nuevo)
shipping_cost INTEGER DEFAULT 0, -- Costo de envío (Centavos)
total_amount INTEGER DEFAULT 0, -- Gran Total (Items + Envío)
estimated_delivery_date DATE, -- Fecha promesa de entrega

-- 📦 RASTREO (Nuevo)
tracking_code TEXT, -- Ej: "1Z999..."
carrier_name TEXT, -- Ej: "DHL"

updated_at TIMESTAMPTZ DEFAULT NOW()
); 2. Tabla: merchants (Nueva - Tesorería)Vincula al usuario de Supabase con su cuenta de Openpay.SQLCREATE TABLE merchants (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES auth.users(id) UNIQUE,
openpay_id TEXT, -- ID de cliente en Openpay (ej. m123...)
clabe_deposit TEXT, -- CLABE real del usuario (donde recibe el dinero)
business_name TEXT,
status TEXT DEFAULT 'active'
); 3. Tabla: payment_transactions (Nueva - Libro Mayor)Registra cada intento de cobro y su resultado.SQLCREATE TABLE payment_transactions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
quote_id UUID REFERENCES quotes(id),
merchant_id UUID REFERENCES merchants(id), -- Quién cobra (L1 o L2)

amount_total INTEGER, -- Total pagado (Centavos)
commission_saas INTEGER, -- Tu ganancia (1% min $15)
net_to_merchant INTEGER, -- Lo que recibe el usuario

payment_method TEXT, -- 'SPEI' | 'manual'
provider_transaction_id TEXT, -- ID de Openpay (tr...)
clabe_virtual_in TEXT, -- La CLABE única generada para cobrar

status TEXT DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
paid_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW()
);
🔄 Flujo 1: Negociación (Quote to Order)El flujo ya no es directo. Ahora existe una etapa intermedia de aprobación.Solicitud (pending): El cliente envía
el carrito. shipping_cost es NULL o 0.Negociación (negotiation):El dueño revisa stock en Dashboard.Ingresa Costo de Envío y Fecha
Estimada.Acción: QuoteService.updateShippingAndNegotiate.Efecto: Se envía email send-quote-update al cliente con el nuevo total.Aceptación (accepted):El cliente
revisa el link de tracking.Da clic en "Aceptar y Confirmar".Efecto: Se envía email send-quote-accepted-email (con links de pago y activación).💸 Flujo 2: Cobranza (Payment)Soporta dos modalidades: Automática (Openpay) y Manual.A. Pago SPEI (Openpay)Generación: El cliente da clic en "Pagar con Transferencia".Edge Function: create-quote-payment.Calcula comisiones (Regla: 1% con mínimo de $15 MXN).Solicita a Openpay una CLABE única.Crea registro pending en payment_transactions.Confirmación: El cliente transfiere desde su banco.Webhook: Openpay notifica a openpay-webhook.Valida montos (Seguridad anti-fraude).Actualiza payment_transactions a paid.Descuenta Inventario (RPC process_inventory_deduction).Notifica al vendedor (send-payment-notification).B. Pago ManualEl dueño recibe efectivo o transferencia directa.Da clic en "Registrar Pago Manual" en el Dashboard.Acción: QuoteService.markAsPaidManually.Crea transacción paid tipo manual.Descuenta inventario inmediatamente.📦 Flujo 3: Logística (Fulfillment)Una vez pagado, el pedido aparece en la nueva vista /orders.Por Empacar (unfulfilled): Estado inicial post-pago.Despacho: El dueño da clic en "Despachar".Si es envío: Ingresa carrier_name y tracking_code.Si es pickup: Confirma disponibilidad.Actualización: QuoteService.updateFulfillmentStatus.Cliente: Al entrar a su link de tracking, ve la tarjeta de "¡Tu pedido está en camino!" con la guía para copiar.🚀 Flujo 4: Activación de Revendedor (Replicación)Este flujo permite el crecimiento viral (L2/L3).Invitación: En el correo de "Pedido Confirmado", el cliente recibe un link: Activar mi Negocio Gratis.Landing: Llega a /track?token=....Registro Directo:El cliente llena el formulario (Nombre, Email, Password).Se ejecuta signUp (Supabase Auth).Vinculación:El frontend llama a activate-replicated-catalog.La función detecta el usuario logueado y le asigna el catálogo huérfano.Resultado: El cliente es redirigido a /dashboard con su catálogo ya cargado y listo para vender.🛠️ Resumen de Edge Functions (Backend)FunciónPropósitoTriggercreate-quoteCrea la cotización inicial.Formulario Público.get-quote-by-tokenObtiene datos seguros para el cliente (Dual: Tracking + Activación).Carga de TrackQuotePage.send-quote-updateAvisa al cliente de nuevos costos/fechas.Botón "Enviar con Flete".accept-quote-publicCliente acepta los términos finales.Botón "Aceptar".create-quote-paymentGenera ficha SPEI en Openpay.Botón "Pagar".openpay-webhookEscucha pagos reales, valida y cierra venta.Automático (Openpay).send-payment-notificationAvisa al dueño que cayó dinero.Webhook.register-merchantDa de alta la CLABE del usuario en Openpay.Configuración Bancaria.activate-replicated-catalogVincula un catálogo a un usuario nuevo.Pantalla de Activación.✅ Checklist de Funcionalidad Actual (v2.0)[x] Cotizador: Soporte para productos con/sin variantes.[x] Negociación: Input de Flete y Fecha de Entrega.[x] Envío Gratis: Detección automática de reglas de catálogo.[x] Pagos: Integración Openpay SPEI (Sandbox/Prod).[x] Pagos Manuales: Registro de efectivo/transferencia directa.[x] Inventario: Descuento automático al confirmar pago.[x] Logística: Dashboard de Pedidos (/orders) y Tracking para cliente.[x] Replicación: Activación con Login/Registro directo.[x] Notificaciones: Correos transaccionales (Resend). 6. Arquitectura de Replicación y Revendedores (L2)El sistema permite que cualquier cotización aceptada se convierta en un nuevo punto de venta (Catálogo Replicado).A. Modelo de Datos (Relación L1-L2)La magia reside en la tabla replicated_catalogs, que actúa como un "puente" entre el inventario del Proveedor y el negocio del Revendedor.SQLCREATE TABLE replicated_catalogs (
id UUID PRIMARY KEY,
original_catalog_id UUID REFERENCES digital_catalogs(id), -- La fuente de los productos (L1)
distributor_id UUID, -- El ID del Proveedor Original (L1)
reseller_id UUID, -- El ID del Revendedor (L2) - NULL hasta que se activa
quote_id UUID, -- La cotización origen que detonó esto

activation_token TEXT, -- Token único para el link de invitación
is_active BOOLEAN DEFAULT false,

-- Configuración propia del L2
custom_name TEXT, -- Si el L2 quiere renombrar su catálogo
product_limit INTEGER -- Control de cuántos productos puede vender
);
B. Flujo de Activación (Onboarding L2)Este proceso convierte a un cliente final en un revendedor.Invitación (Email):Al aceptar una cotización de un catálogo con enable_distribution = true, el sistema genera un registro en replicated_catalogs con is_active = false.El correo de confirmación incluye el link: /track?token={activation_token}.Frontend (ActivateCatalog):El usuario llega a la landing page.Se le presenta el formulario de Login / Registro.Clave: La activación ocurre después de la autenticación exitosa.Vinculación (activate-replicated-catalog):El frontend envía { token, user_id } a la Edge Function.La función valida que el token exista y no esté activo.Actualiza la tabla: reseller_id = user_id y is_active = true.Resultado:El usuario es redirigido a /dashboard.Ahora ve una nueva tarjeta en "Mis Catálogos" que es una réplica del original.C. Gestión de Cotizaciones L2 (¿Cómo vende el Revendedor?)El sistema reutiliza la infraestructura de quotes, pero cambia la propiedad.Generación:El Revendedor comparte su link público: catifypro.com/c/{replica_slug}.Cuando un cliente final cotiza ahí, el sistema busca el reseller_id de esa réplica.Propiedad (quotes.user_id):Al insertar la cotización en la base de datos, el campo user_id se llena con el ID del Revendedor (L2), NO del Proveedor (L1).Efecto: La cotización aparece exclusivamente en el Dashboard del Revendedor (/quotes). El Proveedor Original (L1) NO ve esta cotización en su lista de ventas directas.Inventario y Precios:Precios: Se usan los precios definidos en reseller_product_prices (si el L2 los personalizó) o los del L1 base.Stock: El sistema consulta el stock físico del L1, pero la venta se registra a nombre del L2.D. Gestión de Pagos y Cobranza (Regla: "Seller Collects")Para simplificar la operación fiscal y técnica, el usuario que genera la venta es quien recibe el dinero.Configuración Bancaria:El Revendedor (L2) debe entrar a /dashboard/banking y configurar SU PROPIA cuenta CLABE y RFC.Se crea un registro merchants para el L2.Flujo de Dinero:Cliente Final paga $X a la CLABE generada para el L2.Openpay detecta el pago.Openpay dispersa:Comisión SaaS -> Plataforma.Resto -> Cuenta Bancaria del Revendedor (L2).Deuda con Proveedor (Backlog):El Revendedor recibe el monto total (Costo + Su Ganancia).Nota Operativa: El sistema registra la venta, pero actualmente el pago del "Costo Base" del L2 al L1 se maneja fuera de la plataforma o mediante saldo prepago (según reglas del negocio L1).🔄 Diagrama de Flujo: Ciclo de Vida RevendedorFragmento de códigosequenceDiagram
participant L1 as Proveedor (L1)
participant L2 as Revendedor (L2)
participant C as Cliente Final
participant DB as Sistema

    Note over L1, L2: Fase 1: Reclutamiento
    L1->>L2: Envía Cotización Inicial
    L2->>DB: Paga/Acepta Cotización
    DB-->>L2: Email con Link "Activar Negocio"
    L2->>DB: Crea Cuenta & Activa Catálogo
    DB->>DB: replicated_catalogs.reseller_id = L2

    Note over L2, C: Fase 2: Venta L2
    L2->>C: Comparte Link Catálogo Replicado
    C->>DB: Crea Cotización (user_id = L2)
    L2->>DB: Negocia Flete & Fecha
    C->>DB: Acepta & Paga (SPEI a L2)

    Note over DB, L1: Fase 3: Logística
    DB->>L2: Marca Pedido PAGADO
    DB->>L1: (Opcional) Notifica Despacho Dropshipping
    L2->>DB: Actualiza Tracking para Cliente Final

🛠️ Resumen de Actualizaciones en Edge FunctionsFunciónActualización v2.1Propósitoactivate-replicated-catalogSoporte Directo: Ahora acepta user_id directo para vincular cuentas recién creadas sin esperar email.Onboarding sin fricción.get-quote-by-tokenDual Mode: Busca tanto en quote_tracking_tokens (Tracking) como en replicated_catalogs (Activación).Unificar punto de entrada /track.send-quote-accepted-emailDoble Botón: Envía tanto el link de "Ver Pedido" como el de "Activar Negocio" (si aplica).Fomentar la viralidad.✅ Estado Final del ProyectoEl sistema ahora soporta Multi-Tenancy Jerárquico:Usuarios independientes (Vendedores L1).Usuarios dependientes de inventario (Revendedores L2).Clientes finales (Públicos).Todos utilizan las mismas interfaces (QuotesPage, QuoteDetail, OrdersPage), pero los datos que ven están filtrados estrictamente por su user_id gracias a las políticas RLS (Row Level Security) de Supabase.
