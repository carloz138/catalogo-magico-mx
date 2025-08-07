import { getTemplateById, TemplateConfig } from '@/lib/templates';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf, Image } from '@react-pdf/renderer';

// ✅ INTERFACES LIMPIAS
interface PDFProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price_retail?: number;
  image_url: string;
}

interface BusinessInfo {
  business_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  phone?: string;
  email?: string;
  address?: string;
}

// ✅ FUNCIÓN PRINCIPAL: Generar PDF REAL
export const generateCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    console.log('📄 Generando PDF REAL con @react-pdf/renderer');
    console.log(`🎨 Template: ${templateId}, Productos: ${products.length}`);
    
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} no encontrado`);
    }

    // ✅ CREAR DOCUMENTO PDF REAL
    const MyDocument = createPDFDocument(products, businessInfo, template);
    
    // ✅ GENERAR BLOB PDF
    const blob = await pdf(MyDocument).toBlob();
    
    console.log('✅ PDF REAL generado:', `${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    
    return { success: true, blob };

  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error generando PDF'
    };
  }
};

// ✅ CREAR DOCUMENTO PDF CON REACT-PDF
const createPDFDocument = (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  template: TemplateConfig
) => {
  
  // ✅ ESTILOS DINÁMICOS BASADOS EN TEMPLATE
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: template.colors.background,
      padding: 30,
      fontFamily: 'Helvetica',
    },
    
    header: {
      marginBottom: 30,
      borderBottom: `3pt solid ${template.colors.primary}`,
      paddingBottom: 20,
    },
    
    businessName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: template.colors.primary,
      textAlign: 'center',
      marginBottom: 10,
    },
    
    catalogTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: template.colors.primary,
      textAlign: 'center',
      letterSpacing: 2,
      marginBottom: 15,
    },
    
    contactInfo: {
      fontSize: 10,
      color: template.colors.text,
      textAlign: 'center',
      marginBottom: 5,
    },
    
    productsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    
    productCard: {
      width: template.layout === 'list' ? '100%' : '48%',
      backgroundColor: '#ffffff',
      border: `1pt solid ${template.colors.secondary}`,
      borderRadius: 8,
      padding: 15,
      marginBottom: 20,
      minHeight: 200,
    },
    
    productImage: {
      width: 80,
      height: 80,
      marginBottom: 10,
      alignSelf: 'center',
      backgroundColor: '#f5f5f5',
      border: `1pt solid ${template.colors.secondary}`,
    },
    
    productName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: template.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    
    productCategory: {
      fontSize: 10,
      color: template.colors.secondary,
      textTransform: 'uppercase',
      marginBottom: 6,
      textAlign: 'center',
    },
    
    productPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: template.colors.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    
    productDescription: {
      fontSize: 9,
      color: template.colors.text,
      textAlign: 'center',
      lineHeight: 1.4,
    },
    
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 30,
      right: 30,
      borderTop: `1pt solid ${template.colors.secondary}`,
      paddingTop: 10,
      textAlign: 'center',
    },
    
    footerText: {
      fontSize: 9,
      color: template.colors.secondary,
    },
  });

  // ✅ DIVIDIR PRODUCTOS EN PÁGINAS
  const productsPerPage = template.productsPerPage;
  const pages = [];
  for (let i = 0; i < products.length; i += productsPerPage) {
    pages.push(products.slice(i, i + productsPerPage));
  }

  // ✅ DOCUMENTO PDF
  return (
    <Document>
      {pages.map((pageProducts, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* ✅ HEADER (solo en primera página) */}
          {pageIndex === 0 && (
            <View style={styles.header}>
              <Text style={styles.businessName}>
                {businessInfo.business_name.toUpperCase()}
              </Text>
              <Text style={styles.catalogTitle}>
                CATÁLOGO DE PRODUCTOS
              </Text>
              {businessInfo.phone && (
                <Text style={styles.contactInfo}>
                  📞 {businessInfo.phone}
                </Text>
              )}
              {businessInfo.email && (
                <Text style={styles.contactInfo}>
                  ✉️ {businessInfo.email}
                </Text>
              )}
              {businessInfo.address && (
                <Text style={styles.contactInfo}>
                  📍 {businessInfo.address}
                </Text>
              )}
            </View>
          )}
          
          {/* ✅ PRODUCTOS */}
          <View style={styles.productsContainer}>
            {pageProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                {/* Imagen del producto */}
                <View style={styles.productImage}>
                  {/* Placeholder para imagen - react-pdf tiene limitaciones con imágenes externas */}
                  <Text style={{ fontSize: 24, textAlign: 'center', marginTop: 25 }}>📷</Text>
                </View>
                
                {/* Información del producto */}
                <Text style={styles.productName}>
                  {product.name}
                </Text>
                
                {product.category && (
                  <Text style={styles.productCategory}>
                    {product.category}
                  </Text>
                )}
                
                <Text style={styles.productPrice}>
                  ${((product.price_retail || 0) / 100).toFixed(2)} MXN
                </Text>
                
                {product.description && (
                  <Text style={styles.productDescription}>
                    {product.description.length > 100 
                      ? product.description.substring(0, 100) + '...'
                      : product.description
                    }
                  </Text>
                )}
              </View>
            ))}
          </View>
          
          {/* ✅ FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Página {pageIndex + 1} de {pages.length} • {products.length} productos • 
              Generado el {new Date().toLocaleDateString('es-MX')} • Creado con Catalgo AI
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

// ✅ FUNCIÓN: Descargar PDF REAL
export const downloadCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string,
  filename?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📄 Descargando PDF REAL...');
    
    const result = await generateCatalogPDF(products, businessInfo, templateId);
    
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'Error generando PDF');
    }

    // ✅ CREAR DESCARGA
    const timestamp = new Date().toISOString().slice(0, 10);
    const finalFilename = filename || `catalogo-${businessInfo.business_name.replace(/\s+/g, '-')}-${timestamp}.pdf`;
    
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    
    console.log('✅ PDF REAL descargado:', finalFilename);
    
    return { success: true };

  } catch (error) {
    console.error('❌ Error descarga PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error descargando PDF'
    };
  }
};

// ✅ FUNCIÓN: Preview PDF REAL
export const previewCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await generateCatalogPDF(products, businessInfo, templateId);
    
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'Error generando preview');
    }

    const url = URL.createObjectURL(result.blob);
    window.open(url, '_blank');
    
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return { success: true };

  } catch (error) {
    console.error('❌ Error en preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en preview'
    };
  }
};

// ✅ RESTO DE FUNCIONES (sin cambios)
export const getPDFEstimates = (products: PDFProduct[], template: TemplateConfig) => {
  const totalPages = Math.ceil(products.length / template.productsPerPage);
  const estimatedSize = Math.max(0.1, (products.length * 0.05) + 0.1);
  const estimatedTime = Math.max(1, products.length * 0.02);

  return {
    totalProducts: products.length,
    totalPages,
    productsPerPage: template.productsPerPage,
    estimatedSize: `${estimatedSize.toFixed(1)} MB`,
    estimatedTime: `${Math.ceil(estimatedTime)} seg`,
    instantGeneration: true,
    noCreditsCost: true,
    templateInfo: {
      name: template.displayName,
      layout: template.layout,
      category: template.category,
      imageSize: `${template.imageSize.width}×${template.imageSize.height}px`
    }
  };
};

export const validateProductsForPDF = (products: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!products || products.length === 0) {
    errors.push('No hay productos seleccionados');
  }
  
  products.forEach((product, index) => {
    if (!product.name) {
      errors.push(`Producto ${index + 1}: Sin nombre`);
    }
    if (!product.image_url && !product.original_image_url) {
      errors.push(`Producto ${index + 1}: Sin imagen`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};