# Documentación Técnica: Sistema de Carga de Productos

## Índice
1. [Visión General](#1-visión-general)
2. [Carga Normal (Individual)](#2-carga-normal-individual)
3. [Carga Masiva (Bulk Upload)](#3-carga-masiva-bulk-upload)
4. [Procesamiento de Imágenes](#4-procesamiento-de-imágenes)
5. [Sistema de Límites y Tracking](#5-sistema-de-límites-y-tracking)
6. [Base de Datos](#6-base-de-datos)
7. [Archivos del Sistema](#7-archivos-del-sistema)

---

## 1. Visión General

CatifyPro ofrece dos métodos de carga de productos:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SISTEMA DE CARGA DE PRODUCTOS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                        ┌───────────────────────────┐                        │
│                        │    ENTRADA DE USUARIO     │                        │
│                        └─────────────┬─────────────┘                        │
│                                      │                                       │
│                    ┌─────────────────┴─────────────────┐                    │
│                    │                                   │                     │
│                    ▼                                   ▼                     │
│          ┌──────────────────┐              ┌──────────────────┐             │
│          │  CARGA NORMAL    │              │  CARGA MASIVA    │             │
│          │  /upload         │              │  /products/bulk  │             │
│          └────────┬─────────┘              └────────┬─────────┘             │
│                   │                                  │                       │
│           ┌───────┴───────┐              ┌───────────┴───────────┐          │
│           │               │              │                       │           │
│           ▼               ▼              ▼                       ▼           │
│    ┌────────────┐  ┌────────────┐  ┌──────────┐         ┌──────────────┐    │
│    │ Dropzone   │  │ ProductData│  │  Excel   │         │   Imágenes   │    │
│    │ Imágenes   │  │ Form       │  │  Parser  │         │   Dropzone   │    │
│    └────────────┘  └────────────┘  └──────────┘         └──────────────┘    │
│           │               │              │                       │           │
│           └───────┬───────┘              └───────────┬───────────┘          │
│                   │                                  │                       │
│                   ▼                                  ▼                       │
│          ┌──────────────────┐              ┌──────────────────┐             │
│          │  Image Upload    │              │  Matching Engine │             │
│          │  + Optimization  │              │  (SKU/Name)      │             │
│          └────────┬─────────┘              └────────┬─────────┘             │
│                   │                                  │                       │
│                   └──────────────┬───────────────────┘                      │
│                                  │                                           │
│                                  ▼                                           │
│                        ┌──────────────────┐                                  │
│                        │     products     │                                  │
│                        │     table        │                                  │
│                        └──────────────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Comparación de Métodos

| Característica | Carga Normal | Carga Masiva |
|---------------|--------------|--------------|
| **Ruta** | `/upload` | `/products/bulk-upload` |
| **Cantidad** | 1-50 productos | 1-500+ productos |
| **Input** | Drag & Drop imágenes | Excel/CSV + Imágenes |
| **Edición** | Formulario por producto | Mapeo de columnas |
| **Matching** | N/A | Automático (SKU/Nombre) |
| **Ideal para** | Pocos productos nuevos | Migración de inventario |

---

## 2. Carga Normal (Individual)

### 2.1 Flujo de Usuario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUJO DE CARGA NORMAL                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PASO 1                  PASO 2                   PASO 3                   │
│   Subir Fotos            Editar Datos            Guardar                   │
│                                                                              │
│   ┌─────────────┐       ┌─────────────┐        ┌─────────────┐             │
│   │  Dropzone   │       │  Nombre     │        │  Validar    │             │
│   │  📷 📷 📷   │──────>│  Precio     │───────>│  Límites    │             │
│   │  Arrastra   │       │  SKU        │        │  del Plan   │             │
│   │  aquí       │       │  Categoría  │        └──────┬──────┘             │
│   └─────────────┘       │  Descripción│               │                     │
│         │               └─────────────┘               ▼                     │
│         │                                      ┌─────────────┐             │
│         ▼                                      │ Auto-Save   │             │
│   ┌─────────────┐                              │ a Supabase  │             │
│   │ Supabase    │                              └──────┬──────┘             │
│   │ Storage     │                                     │                     │
│   │ (product-   │                                     ▼                     │
│   │  images)    │                              ┌─────────────┐             │
│   └─────────────┘                              │   Opciones  │             │
│         │                                      │ - Ver Biblio│             │
│         ▼                                      │ - Procesar  │             │
│   ┌─────────────┐                              │ - Catálogo  │             │
│   │ Optimizar   │                              └─────────────┘             │
│   │ (4 tamaños) │                                                          │
│   │ processed-  │                                                          │
│   │ images      │                                                          │
│   └─────────────┘                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Componentes Principales

#### Página Principal: `src/pages/Upload.tsx`

**Estados principales:**
```typescript
const [files, setFiles] = useState<UploadedFile[]>([]);        // Archivos subidos
const [productsData, setProductsData] = useState<ProductData[]>([]); // Data de productos
const [isSaving, setIsSaving] = useState(false);               // Estado guardado
const [isFinished, setIsFinished] = useState(false);           // Vista final
```

**Integración con límites:**
```typescript
const { remaining, isUnlimited, loading: loadingLimits } = useUploadTracking();

// Calcular espacios disponibles en sesión
const availableSlots = isUnlimited ? 9999 : Math.max(0, remaining - files.length);
```

**Validación al recibir archivos:**
```typescript
const handleFilesUploaded = (newFiles: UploadedFile[]) => {
  // 1. Filtrar duplicados
  const currentIds = new Set(files.map((f) => f.id));
  let distinctNewFiles = newFiles.filter((f) => !currentIds.has(f.id));

  // 2. Validar límites del plan
  if (!isUnlimited && distinctNewFiles.length > availableSlots) {
    if (availableSlots === 0) {
      toast({ title: "Límite alcanzado", variant: "destructive" });
      return;
    }
    // Cortar array si excede
    distinctNewFiles = distinctNewFiles.slice(0, availableSlots);
  }

  // 3. Generar data inicial para cada archivo
  const newProductsData: ProductData[] = distinctNewFiles.map((file) => ({
    id: file.id,
    name: cleanName(file.file.name),
    sku: "",
    price_retail: 0,
    // ... más campos
  }));

  setFiles([...prev, ...distinctNewFiles]);
  setProductsData([...prev, ...newProductsData]);
};
```

#### FileUploader: `src/components/upload/FileUploader.tsx`

**Interface de archivo:**
```typescript
export interface UploadedFile {
  id: string;
  file: File;
  preview: string;           // URL.createObjectURL para preview
  url?: string;              // URL final en Storage
  uploading: boolean;
  progress: number;          // 0-100
  error?: string;
  optimizedUrls?: {          // URLs optimizadas
    thumbnail: string;       // 300x300
    catalog: string;         // 800x800
    luxury: string;          // 1200x1200
    print: string;           // 2400x2400
  };
}
```

**Constantes de validación:**
```typescript
const MAX_FILES = 50;                    // Máximo por lote
const MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB por archivo
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB total
```

**Proceso de upload:**
```typescript
const onDrop = async (acceptedFiles: File[]) => {
  // 1. Validar límites del plan
  const canUpload = await validateBeforeUpload(acceptedFiles.length);
  if (!canUpload) return;

  // 2. Validar tamaños
  const validation = validateFiles(acceptedFiles);
  if (!validation.valid) return;

  // 3. Crear objetos UploadedFile
  const newFiles = acceptedFiles.map((file) => ({
    id: crypto.randomUUID(),
    file,
    preview: URL.createObjectURL(file),
    uploading: true,
    progress: 0,
  }));

  // 4. Subir cada archivo
  for (const uploadFile of newFiles) {
    // 4a. Subir original a Supabase Storage
    const { error } = await supabase.storage
      .from("product-images")
      .upload(filePath, uploadFile.file);

    // 4b. Optimizar (4 tamaños)
    const optimizedUrls = await uploadImageToSupabase(
      supabase, uploadFile.id, uploadFile.file, filename
    );

    // 4c. Actualizar progreso y URLs
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id
          ? { ...f, uploading: false, progress: 100, url, optimizedUrls }
          : f
      )
    );
  }

  // 5. Incrementar uso en BD
  await incrementUploadUsage(successfulFiles.length);
};
```

#### ProductDraftCard: `src/components/upload/ProductDraftCard.tsx`

Componente de tarjeta para editar datos de cada producto:
- Nombre del producto
- SKU
- Precio menudeo / mayoreo
- Cantidad mínima mayoreo
- Categoría
- Descripción personalizada
- Tags

#### FinalStepComponent: `src/components/upload/FinalStepComponent.tsx`

**Auto-guardado en BD:**
```typescript
const handleAutoSave = async () => {
  for (const file of files) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: productData.name,
        price_retail: Math.round(productData.price_retail * 100),
        // URLs originales y optimizadas
        original_image_url: file.url,
        thumbnail_image_url: file.optimizedUrls?.thumbnail,
        catalog_image_url: file.optimizedUrls?.catalog,
        luxury_image_url: file.optimizedUrls?.luxury,
        print_image_url: file.optimizedUrls?.print,
        processing_status: 'pending',
      })
      .select()
      .single();
  }
};
```

**Opciones post-guardado:**
1. **Ver Biblioteca** - Navega a `/products?tab=pending`
2. **Procesar Ahora** - Quitar fondos (requiere créditos)
3. **Crear Catálogo** - Ir directo a template-selection

---

## 3. Carga Masiva (Bulk Upload)

### 3.1 Flujo de Usuario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUJO DE CARGA MASIVA                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PASO 1              PASO 2              PASO 3              PASO 4        │
│   Upload              Mapping             Matching            Uploading     │
│                                                                              │
│   ┌─────────────┐   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   │ Excel/CSV   │   │ Mapear      │    │ Relacionar  │    │ Insertar    │  │
│   │ +           │──>│ Columnas    │───>│ Imágenes    │───>│ en BD       │  │
│   │ Imágenes    │   │ con Campos  │    │ con SKU     │    │ (Batch)     │  │
│   └─────────────┘   └─────────────┘    └─────────────┘    └─────────────┘  │
│         │                 │                  │                   │          │
│         │                 │                  │                   │          │
│         ▼                 ▼                  ▼                   ▼          │
│   ┌───────────┐    ┌───────────┐      ┌───────────┐      ┌───────────┐     │
│   │ XLSX.js   │    │ ColumnMap │      │ String    │      │ products  │     │
│   │ Parser    │    │ Component │      │ Similarity│      │ table     │     │
│   └───────────┘    └───────────┘      └───────────┘      └───────────┘     │
│                                                                              │
│                                       ┌─────────────────┐                   │
│   ESTADOS DE MATCHING:                │ matched (✅)    │ Imagen auto-     │
│                                       │ default (📦)    │ asignada o       │
│                                       │ unmatched (❌)  │ placeholder      │
│                                       └─────────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Página Principal: `src/pages/BulkUpload.tsx`

**Estados del flujo:**
```typescript
const [step, setStep] = useState<
  "upload" | "mapping" | "matching" | "uploading" | "finished"
>("upload");

const [rawFile, setRawFile] = useState<any[]>([]);      // Datos del Excel
const [headers, setHeaders] = useState<string[]>([]);   // Cabeceras
const [products, setProducts] = useState<BulkProduct[]>([]); // Productos mapeados
const [images, setImages] = useState<BulkImage[]>([]);  // Imágenes subidas
```

### 3.3 PASO 1: Lectura de Excel

```typescript
const onFileDrop = useCallback((acceptedFiles: File[]) => {
  const file = acceptedFiles[0];
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const data = e.target?.result;
    const workbook = XLSX.read(data, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Extraer headers y filas de datos
    const headersRow = jsonData[0] as string[];
    const dataRows = jsonData.slice(1).map((row: any) => {
      const obj: any = {};
      headersRow.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    setHeaders(headersRow);
    setRawFile(dataRows);
    setStep("mapping");
  };

  reader.readAsBinaryString(file);
}, []);
```

### 3.4 PASO 2: Mapeo de Columnas

**Componente:** `src/components/bulk-upload/ColumnMapper.tsx`

El usuario asocia columnas del Excel con campos del sistema:

| Campo Sistema | Columna Excel (ejemplo) |
|---------------|-------------------------|
| `name` | "Nombre Producto" |
| `price` | "Precio" |
| `sku` | "Código" |
| `description` | "Descripción" |
| `category` | "Categoría" |
| `tags` | "Etiquetas" |

```typescript
const handleMappingConfirm = (mapping: Record<string, string>) => {
  const mappedProducts: BulkProduct[] = rawFile
    .map((row) => ({
      id: crypto.randomUUID(),
      name: row[mapping["name"]],
      price: parseFloat(row[mapping["price"]] || "0"),
      sku: row[mapping["sku"]] || "",
      description: row[mapping["description"]] || "",
      category: row[mapping["category"]] || "",
      tags: parseTagsString(row[mapping["tags"]]),
      originalData: row,
    }))
    .filter((p) => p.name && p.price > 0); // Validación

  // Validar límites del plan
  const maxUploads = limits?.maxUploads || 50;
  if (mappedProducts.length > maxUploads) {
    toast({
      title: "Límite Excedido",
      description: `Tu plan permite máximo ${maxUploads} productos.`,
      variant: "destructive",
    });
    return;
  }

  setProducts(mappedProducts);
  setStep("matching");
};
```

### 3.5 PASO 3: Matching (Asociación de Imágenes)

**Hook:** `src/hooks/useBulkMatching.ts`

**Tipos:**
```typescript
export interface BulkProduct {
  id: string;
  name: string;
  price: number;
  sku?: string;
  description?: string;
  category?: string;
  tags?: string[];
  originalData: any;
}

export interface BulkImage {
  id: string;
  file: File;
  preview: string;
  name: string;
}

export interface MatchItem {
  productId: string;
  product: BulkProduct;
  imageId?: string;
  image?: BulkImage;
  isDefaultImage?: boolean;
  status: "matched" | "unmatched" | "default";
  matchMethod: "auto" | "manual" | "none";
}
```

**Algoritmo de Matching:**
```typescript
const calculateMatches = useCallback(() => {
  const newMatches: MatchItem[] = products.map((product) => {
    // 1. Revisar si hay override manual
    if (manualOverrides[product.id]) {
      const overrideId = manualOverrides[product.id];
      if (overrideId === "default") {
        return { ...product, status: "default", matchMethod: "manual" };
      }
      const img = images.find((i) => i.id === overrideId);
      if (img) {
        return { ...product, image: img, status: "matched", matchMethod: "manual" };
      }
    }

    // 2. Auto-Match usando String Similarity
    let bestMatch: BulkImage | null = null;
    let bestScore = 0;

    const targetStrings = [product.sku, product.name].filter(Boolean);
    const imageNames = images.map((img) => img.name.split(".")[0]);

    targetStrings.forEach((target) => {
      const match = stringSimilarity.findBestMatch(target, imageNames);
      if (match.bestMatch.rating > bestScore) {
        bestScore = match.bestMatch.rating;
        bestMatch = images[match.bestMatchIndex];
      }
    });

    // 3. Umbral de confianza: 0.4 (40%)
    if (bestMatch && bestScore > 0.4) {
      return { ...product, image: bestMatch, status: "matched", matchMethod: "auto" };
    }

    // 4. Sin match
    return { ...product, status: "unmatched", matchMethod: "none" };
  });

  setMatches(newMatches);
}, [products, images, manualOverrides]);
```

**Acciones del usuario:**
- `setManualMatch(productId, imageId)` - Asignar imagen manualmente
- `useDefaultImage(productId)` - Usar placeholder
- `applyDefaultToAllUnmatched()` - Default a todos sin imagen

### 3.6 PASO 4: Subida Final

```typescript
const handleFinalUpload = async () => {
  const BATCH_SIZE = 3; // Procesar de 3 en 3
  const PLACEHOLDER_URL = "https://[...]/placeholder.png";

  for (let i = 0; i < matches.length; i += BATCH_SIZE) {
    const batch = matches.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (match) => {
        // 1. Omitir sin imagen (ni default)
        if (match.status === "unmatched") {
          failedItems.push({ ...match.product, ERROR_REASON: "Sin imagen" });
          return null;
        }

        // 2. Procesar imagen
        let imageUrls = { original: PLACEHOLDER_URL, ... };

        if (match.status === "matched" && match.image) {
          // Subir original
          await supabase.storage.from("product-images").upload(path, file);
          
          // Optimizar (4 tamaños)
          const optimizedUrls = await uploadImageToSupabase(...);
          imageUrls = { ...optimizedUrls };
        }

        // 3. Retornar objeto producto
        return {
          user_id: user.id,
          name: match.product.name,
          price_retail: Math.round(match.product.price * 100),
          sku: match.product.sku,
          original_image_url: imageUrls.original,
          thumbnail_image_url: imageUrls.thumb,
          catalog_image_url: imageUrls.catalog,
          // ...
        };
      })
    );

    // 4. Insertar batch en BD
    const validProducts = batchResults.filter((p) => p !== null);
    await supabase.from("products").insert(validProducts);

    // 5. Actualizar progreso
    setUploadProgress((processed / total) * 100);
  }
};
```

### 3.7 Reporte de Errores

Si hay productos fallidos, se genera Excel descargable:

```typescript
const downloadErrorReport = () => {
  const ws = XLSX.utils.json_to_sheet(failedReport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Errores de Carga");
  XLSX.writeFile(wb, `reporte_errores_${date}.xlsx`);
};
```

---

## 4. Procesamiento de Imágenes

### 4.1 Archivo: `src/utils/imageProcessing.ts`

#### Función Principal: `uploadImageToSupabase`

Genera 4 versiones optimizadas de cada imagen:

| Versión | Tamaño | Uso |
|---------|--------|-----|
| `thumbnail` | 300x300 | Previews en listas |
| `catalog` | 800x800 | PDFs y catálogos digitales |
| `luxury` | 1200x1200 | Vista detalle |
| `print` | 2400x2400 | Impresión alta calidad |

```typescript
export const uploadImageToSupabase = async (
  supabase: any,
  productId: string, 
  originalBlob: Blob, 
  filename: string
): Promise<{ thumbnail: string; catalog: string; luxury: string; print: string }> => {
  
  // Detectar transparencia (PNG)
  const hasTransparency = originalBlob.type.includes('png');
  const fileExtension = hasTransparency ? 'png' : 'jpg';
  const contentType = hasTransparency ? 'image/png' : 'image/jpeg';
  
  // Generar 4 tamaños
  const [thumbnailBlob, catalogBlob, luxuryBlob, printBlob] = await Promise.all([
    resizeImage(originalBlob, 300, 300, 0.8),
    resizeImage(originalBlob, 800, 800, 0.85),
    resizeImage(originalBlob, 1200, 1200, 0.9),
    resizeImage(originalBlob, 2400, 2400, 0.95)
  ]);

  // Subir cada tamaño a Storage
  const sizes = [
    { blob: thumbnailBlob, suffix: 'thumb' },
    { blob: catalogBlob, suffix: 'catalog' },
    { blob: luxuryBlob, suffix: 'luxury' },
    { blob: printBlob, suffix: 'print' }
  ];

  const uploadedUrls: Record<string, string> = {};

  for (const { blob, suffix } of sizes) {
    const fileName = `${timestamp}_${productId}_${suffix}.${fileExtension}`;
    
    await supabase.storage
      .from('processed-images')
      .upload(fileName, blob, { contentType });

    const { data } = supabase.storage
      .from('processed-images')
      .getPublicUrl(fileName);

    uploadedUrls[suffix] = data.publicUrl;
  }

  return uploadedUrls;
};
```

#### Función de Resize: `resizeImage`

```typescript
export const resizeImage = (
  blob: Blob, 
  maxWidth: number, 
  maxHeight: number, 
  quality = 0.85
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calcular dimensiones manteniendo aspect ratio
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height); // Preservar transparencia
      ctx.drawImage(img, 0, 0, width, height);

      // Formato según transparencia
      const hasTransparency = blob.type.includes('png');
      if (hasTransparency) {
        canvas.toBlob(resolve, 'image/png');
      } else {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      }
    };

    img.src = URL.createObjectURL(blob);
  });
};
```

### 4.2 Buckets de Storage

| Bucket | Contenido | Público |
|--------|-----------|---------|
| `product-images` | Imágenes originales | ✅ |
| `processed-images` | Versiones optimizadas | ✅ |
| `business-logos` | Logos de negocios | ✅ |

---

## 5. Sistema de Límites y Tracking

### 5.1 Hook: `src/hooks/useUploadTracking.ts`

**Estados:**
```typescript
const [uploadsUsed, setUploadsUsed] = useState(0);   // Usados este mes
const [maxUploads, setMaxUploads] = useState(0);     // Límite del plan
const [loading, setLoading] = useState(true);

// Derivados
const isUnlimited = maxUploads > 10000;
const remaining = Math.max(0, maxUploads - uploadsUsed);
const canUpload = isUnlimited || remaining > 0;
const percentage = Math.min(100, Math.round((uploadsUsed / maxUploads) * 100));
```

**Carga inicial:**
```typescript
const fetchUsage = async () => {
  // 1. Obtener límite del plan
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("credit_packages(max_uploads)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const limit = subscription?.credit_packages?.max_uploads || 0;
  setMaxUploads(limit);

  // 2. Obtener uso del mes actual
  const currentMonth = new Date().getFullYear() * 100 + (new Date().getMonth() + 1);
  const { data: usage } = await supabase
    .from("catalog_usage")
    .select("uploads_used")
    .eq("user_id", user.id)
    .eq("usage_month", currentMonth)
    .maybeSingle();

  setUploadsUsed(usage?.uploads_used || 0);
};
```

**Incrementar uso:**
```typescript
const incrementUploadUsage = async (numberOfFiles: number) => {
  const currentMonth = YYYYMM;

  const { data: existingUsage } = await supabase
    .from("catalog_usage")
    .select("id, uploads_used")
    .eq("user_id", user.id)
    .eq("usage_month", currentMonth)
    .maybeSingle();

  if (existingUsage) {
    // Actualizar registro existente
    await supabase
      .from("catalog_usage")
      .update({ uploads_used: existingUsage.uploads_used + numberOfFiles })
      .eq("id", existingUsage.id);
  } else {
    // Crear nuevo registro del mes
    await supabase.from("catalog_usage").insert({
      user_id: user.id,
      usage_month: currentMonth,
      uploads_used: numberOfFiles,
      subscription_plan_id: packageId,
    });
  }

  setUploadsUsed((prev) => prev + numberOfFiles);
};
```

**Validación pre-upload:**
```typescript
const validateBeforeUpload = async (filesToUpload: number) => {
  const result = await checkUploadLimits(filesToUpload);
  if (!result.canUpload) {
    toast({
      title: "Límite alcanzado",
      description: `Solo te quedan ${result.uploadsRemaining} uploads.`,
      variant: "destructive",
    });
    return false;
  }
  return true;
};
```

### 5.2 Límites por Plan

| Plan | max_uploads | Descripción |
|------|-------------|-------------|
| Free | 10 | 10 productos/mes |
| Básico ($299) | 200 | 200 productos/mes |
| Pro ($599) | 500 | 500 productos/mes |
| Empresarial ($1,299) | 999999 | Ilimitado |

---

## 6. Base de Datos

### 6.1 Tabla `products`

**Campos relacionados con carga:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK auto-generado |
| `user_id` | uuid | Dueño del producto |
| `name` | text | Nombre (requerido) |
| `sku` | text | Código único |
| `price_retail` | integer | Precio menudeo (centavos) |
| `price_wholesale` | integer | Precio mayoreo (centavos) |
| `category` | text | Categoría |
| `description` | text | Descripción |
| `custom_description` | text | Descripción personalizada |
| `tags` | text[] | Array de etiquetas |
| `original_image_url` | text | Imagen original |
| `thumbnail_image_url` | text | 300x300 |
| `catalog_image_url` | text | 800x800 (para PDFs) |
| `luxury_image_url` | text | 1200x1200 |
| `print_image_url` | text | 2400x2400 |
| `processing_status` | text | 'pending', 'processing', 'completed' |
| `is_processed` | boolean | Si se quitó fondo |
| `has_variants` | boolean | Tiene variantes |
| `created_at` | timestamptz | Fecha creación |

### 6.2 Tabla `catalog_usage`

Trackea uso mensual por usuario:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | Usuario |
| `usage_month` | integer | Formato YYYYMM |
| `uploads_used` | integer | Productos subidos |
| `catalogs_generated` | integer | Catálogos generados |
| `subscription_plan_id` | uuid | FK a credit_packages |

---

## 7. Archivos del Sistema

### 7.1 Carga Normal

| Archivo | Propósito |
|---------|-----------|
| `src/pages/Upload.tsx` | Página principal |
| `src/components/upload/FileUploader.tsx` | Dropzone + upload |
| `src/components/upload/ProductDraftCard.tsx` | Formulario por producto |
| `src/components/upload/FinalStepComponent.tsx` | Auto-guardado + opciones |
| `src/components/upload/ProductForm.tsx` | Formulario detallado |
| `src/hooks/useUploadTracking.ts` | Límites y tracking |

### 7.2 Carga Masiva

| Archivo | Propósito |
|---------|-----------|
| `src/pages/BulkUpload.tsx` | Página principal |
| `src/components/bulk-upload/CSVUploader.tsx` | Parser de Excel/CSV |
| `src/components/bulk-upload/ColumnMapper.tsx` | Mapeo de columnas |
| `src/components/bulk-upload/ImageDropzone.tsx` | Dropzone imágenes |
| `src/components/bulk-upload/MatchingTable.tsx` | Tabla de matching |
| `src/components/bulk-upload/UploadProgress.tsx` | Barra de progreso |
| `src/components/bulk-upload/DuplicateWarning.tsx` | Alertas duplicados |
| `src/hooks/useBulkMatching.ts` | Algoritmo de matching |
| `src/lib/matching-engine.ts` | Motor de matching |

### 7.3 Procesamiento de Imágenes

| Archivo | Propósito |
|---------|-----------|
| `src/utils/imageProcessing.ts` | Resize y upload optimizado |
| `src/hooks/useImageCompression.ts` | Compresión en cliente |
| `src/lib/validation/bulk-upload-schemas.ts` | Validación Zod |

---

## 8. Diagrama de Secuencia: Carga Normal

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│  Usuario │     │ FileUploader │     │  Supabase   │     │  products   │
│          │     │              │     │  Storage    │     │   table     │
└────┬─────┘     └──────┬───────┘     └──────┬──────┘     └──────┬──────┘
     │                  │                    │                   │
     │  Drop Images     │                    │                   │
     │─────────────────>│                    │                   │
     │                  │                    │                   │
     │                  │ Upload Original    │                   │
     │                  │───────────────────>│                   │
     │                  │                    │                   │
     │                  │ Get Public URL     │                   │
     │                  │<───────────────────│                   │
     │                  │                    │                   │
     │                  │ Resize (4 sizes)   │                   │
     │                  │────────────┐       │                   │
     │                  │            │       │                   │
     │                  │<───────────┘       │                   │
     │                  │                    │                   │
     │                  │ Upload Optimized   │                   │
     │                  │───────────────────>│                   │
     │                  │                    │                   │
     │  Edit Product    │                    │                   │
     │  Data Forms      │                    │                   │
     │─────────────────>│                    │                   │
     │                  │                    │                   │
     │  Click "Publish" │                    │                   │
     │─────────────────>│                    │                   │
     │                  │                    │                   │
     │                  │                    │  INSERT products  │
     │                  │                    │──────────────────>│
     │                  │                    │                   │
     │  Success Toast   │                    │                   │
     │<─────────────────│                    │                   │
     │                  │                    │                   │
```

---

## 9. Diagrama de Secuencia: Carga Masiva

```
┌──────────┐  ┌───────────┐  ┌───────────┐  ┌────────────┐  ┌─────────────┐
│  Usuario │  │BulkUpload │  │ XLSX.js   │  │ Matching   │  │  Supabase   │
│          │  │   Page    │  │  Parser   │  │   Engine   │  │             │
└────┬─────┘  └─────┬─────┘  └─────┬─────┘  └──────┬─────┘  └──────┬──────┘
     │              │              │               │               │
     │ Drop Excel   │              │               │               │
     │─────────────>│              │               │               │
     │              │ Read Binary  │               │               │
     │              │─────────────>│               │               │
     │              │              │               │               │
     │              │ JSON Data    │               │               │
     │              │<─────────────│               │               │
     │              │              │               │               │
     │ Map Columns  │              │               │               │
     │─────────────>│              │               │               │
     │              │              │               │               │
     │ Drop Images  │              │               │               │
     │─────────────>│              │               │               │
     │              │              │               │               │
     │              │ Calculate    │               │               │
     │              │ Matches      │               │               │
     │              │─────────────────────────────>│               │
     │              │              │               │               │
     │              │ Match Results│               │               │
     │              │<─────────────────────────────│               │
     │              │              │               │               │
     │ Confirm      │              │               │               │
     │ Upload       │              │               │               │
     │─────────────>│              │               │               │
     │              │              │               │               │
     │              │ Batch Upload │               │               │
     │              │ (3 at time)  │               │               │
     │              │───────────────────────────────────────────────>│
     │              │              │               │               │
     │              │ Progress %   │               │               │
     │<─────────────│              │               │               │
     │              │              │               │               │
     │ Complete +   │              │               │               │
     │ Error Report │              │               │               │
     │<─────────────│              │               │               │
```
