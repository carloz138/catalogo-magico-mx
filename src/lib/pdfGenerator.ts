
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { getTemplateById, TemplateConfig } from '@/lib/templates';

// ✅ REGISTRAR FONTS PERSONALIZADAS
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff2'
});

Font.register({
  family: 'Playfair Display',
  src: 'https://fonts.gstatic.com/s/playfairdisplay/v22/nuFiD-vYSZviVYUb_rj3ij__anPXBYf9pzDTwBH7.woff2'
});

Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2'
});

// ✅ INTERFACES
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

// ✅ FUNCIÓN PRINCIPAL: Generar PDF
export const generateCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    console.log('🎨 Generando PDF con React-PDF');
    console.log('🎨 Template:', templateId);
    console.log('🎨 Productos:', products.length);
    
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} no encontrado`);
    }

    // ✅ CREAR DOCUMENTO REACT-PDF
    const CatalogDocument = React.createElement(CatalogPDFDocument, {
      products,
      businessInfo,
      template
    });

    // ✅ GENERAR BLOB PDF
    console.log('🔄 Generando blob PDF...');
    const blob = await pdf(CatalogDocument).toBlob();
    
    console.log('✅ PDF generado exitosamente:', {
      size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      pages: Math.ceil(products.length / template.productsPerPage)
    });

    return {
      success: true,
      blob: blob
    };

  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido generando PDF'
    };
  }
};

// ✅ COMPONENTE PRINCIPAL DEL DOCUMENTO PDF
const CatalogPDFDocument: React.FC<{
  products: PDFProduct[];
  businessInfo: BusinessInfo;
  template: TemplateConfig;
}> = ({ products, businessInfo, template }) => {
  // ✅ CALCULAR PÁGINAS
  const productsPerPage = template.productsPerPage;
  const totalPages = Math.ceil(products.length / productsPerPage);
  const pages = [];

  // ✅ DIVIDIR PRODUCTOS EN PÁGINAS
  for (let i = 0; i < totalPages; i++) {
    const startIndex = i * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const pageProducts = products.slice(startIndex, endIndex);
    pages.push(pageProducts);
  }

  console.log(`📄 Generando ${totalPages} páginas con ${productsPerPage} productos c/u`);

  return (
    <Document>
      {pages.map((pageProducts, pageIndex) => (
        <CatalogPage
          key={pageIndex}
          products={pageProducts}
          businessInfo={businessInfo}
          template={template}
          pageNumber={pageIndex + 1}
          totalPages={totalPages}
        />
      ))}
    </Document>
  );
};

// ✅ COMPONENTE DE PÁGINA PDF
const CatalogPage: React.FC<{
  products: PDFProduct[];
  businessInfo: BusinessInfo;
  template: TemplateConfig;
  pageNumber: number;
  totalPages: number;
}> = ({ products, businessInfo, template, pageNumber, totalPages }) => {
  
  // ✅ ESTILOS ESPECÍFICOS POR TEMPLATE
  const styles = getTemplateStyles(template);

  return (
    <Page size="A4" style={styles.page}>
      {/* ✅ HEADER CON LOGO Y EMPRESA */}
      <View style={styles.header}>
        {businessInfo.logo_url && (
          <Image 
            src={businessInfo.logo_url} 
            style={styles.logo}
          />
        )}
        <View style={styles.headerText}>
          <Text style={styles.businessName}>{businessInfo.business_name}</Text>
          {businessInfo.phone && (
            <Text style={styles.contactInfo}>📞 {businessInfo.phone}</Text>
          )}
          {businessInfo.email && (
            <Text style={styles.contactInfo}>✉️ {businessInfo.email}</Text>
          )}
        </View>
      </View>

      {/* ✅ TÍTULO DEL CATÁLOGO */}
      <View style={styles.titleSection}>
        <Text style={styles.catalogTitle}>CATÁLOGO DE PRODUCTOS</Text>
        <Text style={styles.templateName}>{template.displayName}</Text>
      </View>

      {/* ✅ GRID DE PRODUCTOS DINÁMICO */}
      <View style={styles.productsGrid}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            template={template}
            styles={styles}
            index={index}
          />
        ))}
      </View>

      {/* ✅ FOOTER CON PAGINACIÓN */}
      <View style={styles.footer} fixed>
        <Text style={styles.pageNumber}>
          Página {pageNumber} de {totalPages}
        </Text>
        <Text style={styles.footerText}>
          Generado con Catalgo AI • {new Date().toLocaleDateString('es-MX')}
        </Text>
        {businessInfo.address && (
          <Text style={styles.address}>{businessInfo.address}</Text>
        )}
      </View>
    </Page>
  );
};

// ✅ COMPONENTE DE PRODUCTO
const ProductCard: React.FC<{
  product: PDFProduct;
  template: TemplateConfig;
  styles: any;
  index: number;
}> = ({ product, template, styles, index }) => {
  
  return (
    <View style={styles.productCard}>
      {/* ✅ IMAGEN PNG CON TRANSPARENCIA */}
      <View style={styles.imageContainer}>
        <Image
          src={product.image_url}
          style={styles.productImage}
        />
      </View>

      {/* ✅ INFO DEL PRODUCTO */}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        
        {product.category && (
          <Text style={styles.productCategory}>{product.category}</Text>
        )}
        
        {product.price_retail && (
          <Text style={styles.productPrice}>
            ${(product.price_retail / 100).toFixed(2)} MXN
          </Text>
        )}
        
        {product.description && (
          <Text style={styles.productDescription}>
            {product.description}
          </Text>
        )}
      </View>
    </View>
  );
};

// ✅ FUNCIÓN: Estilos dinámicos por template
const getTemplateStyles = (template: TemplateConfig) => {
  
  // ✅ ESTILOS BASE
  const baseStyles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: template.colors.background,
      padding: 30,
      fontFamily: 'Inter'
    },
    header: {
      flexDirection: 'row',
      marginBottom: 30,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: template.colors.primary,
      alignItems: 'center'
    },
    logo: {
      width: 60,
      height: 60,
      marginRight: 20
    },
    headerText: {
      flex: 1
    },
    businessName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: template.colors.primary,
      marginBottom: 5
    },
    contactInfo: {
      fontSize: 10,
      color: template.colors.text,
      marginBottom: 2
    },
    titleSection: {
      alignItems: 'center',
      marginBottom: 30
    },
    catalogTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: template.colors.primary,
      marginBottom: 5,
      letterSpacing: 2
    },
    templateName: {
      fontSize: 12,
      color: template.colors.secondary,
      textTransform: 'uppercase'
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 30,
      right: 30,
      textAlign: 'center',
      borderTopWidth: 1,
      borderTopColor: template.colors.secondary,
      paddingTop: 10
    },
    pageNumber: {
      fontSize: 10,
      color: template.colors.text,
      marginBottom: 5
    },
    footerText: {
      fontSize: 8,
      color: template.colors.secondary,
      marginBottom: 3
    },
    address: {
      fontSize: 8,
      color: template.colors.text
    }
  });

  // ✅ ESTILOS ESPECÍFICOS POR LAYOUT
  const layoutStyles = getLayoutStyles(template);
  
  return { ...baseStyles, ...layoutStyles };
};

// ✅ FUNCIÓN: Estilos por layout (grid, list, magazine)
const getLayoutStyles = (template: TemplateConfig) => {
  
  const imageWidth = template.imageSize.width * 0.75; // Ajuste para PDF
  const imageHeight = template.imageSize.height * 0.75;
  
  switch (template.layout) {
    case 'grid':
      return StyleSheet.create({
        productsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: 40
        },
        productCard: {
          width: template.productsPerPage === 2 ? '48%' : 
                 template.productsPerPage === 3 ? '31%' :
                 template.productsPerPage === 4 ? '23%' : '18%',
          marginBottom: 25,
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          padding: 15,
          borderWidth: 1,
          borderColor: template.colors.secondary
        },
        imageContainer: {
          alignItems: 'center',
          marginBottom: 10
        },
        productImage: {
          width: imageWidth,
          height: imageHeight,
          objectFit: 'contain'
        },
        productInfo: {
          alignItems: 'center'
        },
        productName: {
          fontSize: 14,
          fontWeight: 'bold',
          color: template.colors.text,
          marginBottom: 5,
          textAlign: 'center'
        },
        productCategory: {
          fontSize: 10,
          color: template.colors.secondary,
          marginBottom: 5,
          textTransform: 'uppercase'
        },
        productPrice: {
          fontSize: 16,
          fontWeight: 'bold',
          color: template.colors.primary,
          marginBottom: 8
        },
        productDescription: {
          fontSize: 9,
          color: template.colors.text,
          textAlign: 'center',
          lineHeight: 1.3
        }
      });

    case 'list':
      return StyleSheet.create({
        productsGrid: {
          flexDirection: 'column',
          marginBottom: 40
        },
        productCard: {
          flexDirection: 'row',
          marginBottom: 20,
          backgroundColor: '#FFFFFF',
          padding: 20,
          borderRadius: 10,
          borderLeftWidth: 5,
          borderLeftColor: template.colors.primary
        },
        imageContainer: {
          marginRight: 20
        },
        productImage: {
          width: imageWidth * 0.8,
          height: imageHeight * 0.8,
          objectFit: 'contain'
        },
        productInfo: {
          flex: 1,
          justifyContent: 'center'
        },
        productName: {
          fontSize: 18,
          fontWeight: 'bold',
          color: template.colors.text,
          marginBottom: 8
        },
        productCategory: {
          fontSize: 12,
          color: template.colors.secondary,
          marginBottom: 5,
          textTransform: 'uppercase'
        },
        productPrice: {
          fontSize: 20,
          fontWeight: 'bold',
          color: template.colors.primary,
          marginBottom: 10
        },
        productDescription: {
          fontSize: 11,
          color: template.colors.text,
          lineHeight: 1.4
        }
      });

    case 'magazine':
      return StyleSheet.create({
        productsGrid: {
          flexDirection: 'column',
          marginBottom: 40
        },
        productCard: {
          marginBottom: 30,
          backgroundColor: '#FFFFFF',
          borderRadius: 15,
          padding: 25,
          borderWidth: 2,
          borderColor: template.colors.secondary
        },
        imageContainer: {
          alignItems: 'center',
          marginBottom: 15
        },
        productImage: {
          width: imageWidth * 1.2,
          height: imageHeight * 1.2,
          objectFit: 'contain'
        },
        productInfo: {
          alignItems: 'center'
        },
        productName: {
          fontSize: 20,
          fontWeight: 'bold',
          color: template.colors.text,
          marginBottom: 10,
          textAlign: 'center'
        },
        productCategory: {
          fontSize: 14,
          color: template.colors.secondary,
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 1
        },
        productPrice: {
          fontSize: 24,
          fontWeight: 'bold',
          color: template.colors.primary,
          marginBottom: 12
        },
        productDescription: {
          fontSize: 12,
          color: template.colors.text,
          textAlign: 'center',
          lineHeight: 1.5
        }
      });

    default:
      return getLayoutStyles({ ...template, layout: 'grid' });
  }
};

// ✅ FUNCIÓN: Estilos específicos por template ID
export const getTemplateSpecificStyles = (templateId: string) => {
  const baseFont = templateId.includes('lujo') || templateId.includes('elegante') 
    ? 'Playfair Display' 
    : templateId.includes('profesional') || templateId.includes('corporativo')
    ? 'Roboto'
    : 'Inter';

  return {
    fontFamily: baseFont,
    // Estilos específicos por template pueden ir aquí
    specialEffects: templateId.includes('halloween') || templateId.includes('fiesta')
  };
};

// ✅ FUNCIÓN: Descargar PDF generado
export const downloadCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string,
  filename?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📄 Iniciando descarga de PDF...');
    
    const result = await generateCatalogPDF(products, businessInfo, templateId);
    
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'No se pudo generar el PDF');
    }

    // ✅ CREAR URL Y DESCARGAR
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `catalogo-${templateId}-${Date.now()}.pdf`;
    
    // ✅ TRIGGER DOWNLOAD
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // ✅ CLEANUP
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log('✅ Descarga iniciada exitosamente');
    
    return { success: true };

  } catch (error) {
    console.error('❌ Error en descarga:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error descargando PDF'
    };
  }
};

// ✅ FUNCIÓN: Preview del PDF (para mostrar antes de descargar)
export const generatePreviewPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const result = await generateCatalogPDF(products, businessInfo, templateId);
    
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'No se pudo generar preview');
    }

    // ✅ CREAR URL PARA PREVIEW
    const url = URL.createObjectURL(result.blob);
    
    return {
      success: true,
      url: url
    };

  } catch (error) {
    console.error('❌ Error generando preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error generando preview'
    };
  }
};

// ✅ FUNCIÓN: Estadísticas del PDF a generar
export const getPDFStats = (products: PDFProduct[], template: TemplateConfig) => {
  const totalPages = Math.ceil(products.length / template.productsPerPage);
  const avgImagesPerPage = products.length / totalPages;
  const estimatedFileSize = (products.length * 0.8) + 2; // MB estimado

  return {
    totalProducts: products.length,
    totalPages,
    avgImagesPerPage: Math.round(avgImagesPerPage * 10) / 10,
    productsPerPage: template.productsPerPage,
    estimatedFileSize: `${estimatedFileSize.toFixed(1)} MB`,
    templateInfo: {
      name: template.displayName,
      layout: template.layout,
      category: template.category
    }
  };
};
