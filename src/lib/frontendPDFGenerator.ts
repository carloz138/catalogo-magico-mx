import { getTemplateById, TemplateConfig } from '@/lib/templates';
import React from 'react';

// ✅ INTERFACES MEJORADAS
interface PDFProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price_retail?: number;
  price_wholesale?: number;
  image_url: string;
  sku?: string;
  stock?: number;
  discount_percentage?: number;
  weight?: string;
  dimensions?: string;
  brand?: string;
}

interface BusinessInfo {
  business_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

// ✅ CONFIGURACIONES ESPECÍFICAS POR TEMPLATE
const getTemplateSpecificStyles = (templateId: string, template: TemplateConfig) => {
  const baseColors = template.colors;
  
  const templateConfigs = {
    'minimalista-gris': {
      fonts: {
        main: 'Helvetica',
        headings: 'Helvetica-Bold',
        body: 'Helvetica'
      },
      spacing: {
        padding: 35,
        margin: 25,
        cardSpacing: 25,
        borderRadius: 2
      },
      design: {
        borderWidth: 0.5,
        shadowIntensity: 0.05,
        headerStyle: 'minimal',
        cardStyle: 'clean'
      },
      colors: {
        ...baseColors,
        cardBg: '#ffffff',
        accent: '#f8f9fa',
        border: '#e2e8f0'
      },
      layout: {
        headerHeight: 80,
        imageSize: 70,
        productsPerRow: 3
      }
    },
    
    'profesional-corporativo': {
      fonts: {
        main: 'Helvetica',
        headings: 'Helvetica-Bold',
        body: 'Helvetica'
      },
      spacing: {
        padding: 30,
        margin: 20,
        cardSpacing: 20,
        borderRadius: 4
      },
      design: {
        borderWidth: 1.5,
        shadowIntensity: 0.15,
        headerStyle: 'corporate',
        cardStyle: 'structured'
      },
      colors: {
        ...baseColors,
        primary: '#2563eb',
        secondary: '#64748b', 
        cardBg: '#f8fafc',
        accent: '#e2e8f0',
        border: '#cbd5e1'
      },
      layout: {
        headerHeight: 100,
        imageSize: 80,
        productsPerRow: 2
      }
    },
    
    'lujo-negro-oro': {
      fonts: {
        main: 'Times-Roman',
        headings: 'Times-Bold',
        body: 'Times-Roman'
      },
      spacing: {
        padding: 40,
        margin: 30,
        cardSpacing: 30,
        borderRadius: 8
      },
      design: {
        borderWidth: 2,
        shadowIntensity: 0.3,
        headerStyle: 'luxury',
        cardStyle: 'elegant'
      },
      colors: {
        ...baseColors,
        primary: '#ffd700',
        secondary: '#b8860b',
        background: '#1a1a1a',
        text: '#f5f5f5',
        cardBg: '#2a2a2a',
        accent: '#404040',
        border: '#ffd700'
      },
      layout: {
        headerHeight: 120,
        imageSize: 90,
        productsPerRow: 2
      }
    },
    
    'naturaleza-organico': {
      fonts: {
        main: 'Helvetica',
        headings: 'Helvetica-Bold',
        body: 'Helvetica'
      },
      spacing: {
        padding: 35,
        margin: 25,
        cardSpacing: 25,
        borderRadius: 15
      },
      design: {
        borderWidth: 1,
        shadowIntensity: 0.1,
        headerStyle: 'organic',
        cardStyle: 'rounded'
      },
      colors: {
        ...baseColors,
        primary: '#16a34a',
        secondary: '#65a30d',
        background: '#f0fdf4',
        cardBg: '#dcfce7',
        accent: '#bbf7d0',
        border: '#86efac'
      },
      layout: {
        headerHeight: 90,
        imageSize: 85,
        productsPerRow: 2
      }
    },
    
    'rustico-campestre': {
      fonts: {
        main: 'Courier',
        headings: 'Courier-Bold', 
        body: 'Courier'
      },
      spacing: {
        padding: 40,
        margin: 30,
        cardSpacing: 25,
        borderRadius: 0
      },
      design: {
        borderWidth: 3,
        shadowIntensity: 0.2,
        headerStyle: 'rustic',
        cardStyle: 'vintage'
      },
      colors: {
        ...baseColors,
        primary: '#8b4513',
        secondary: '#a0522d',
        background: '#faf8f1',
        cardBg: '#ffffff',
        accent: '#f5e6d3',
        border: '#d2b48c'
      },
      layout: {
        headerHeight: 110,
        imageSize: 75,
        productsPerRow: 2
      }
    }
  };
  
  return templateConfigs[templateId as keyof typeof templateConfigs] || templateConfigs['minimalista-gris'];
};

// ✅ FUNCIÓN PRINCIPAL COMPLETAMENTE DINÁMICA
export const generateCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    console.log(`🎨 Generando PDF dinámico para template: ${templateId}`);
    
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} no encontrado`);
    }

    // ✅ OBTENER CONFIGURACIÓN ESPECÍFICA DEL TEMPLATE
    const templateConfig = getTemplateSpecificStyles(templateId, template);
    console.log(`✨ Aplicando estilos únicos: ${templateConfig.design.cardStyle}`);

    // ✅ PROCESAR IMÁGENES
    const processedProducts = await processProductImages(products);

    // ✅ IMPORTAR REACT-PDF
    const { Document, Page, Text, View, StyleSheet, pdf, Image } = await import('@react-pdf/renderer');

    // ✅ CREAR DOCUMENTO DINÁMICO
    const MyDocument = React.createElement(Document, {
      title: `Catálogo ${businessInfo.business_name} - ${template.displayName}`,
      author: businessInfo.business_name,
      subject: `Catálogo estilo ${template.displayName}`,
      creator: 'Catalgo AI',
      producer: 'Catalgo AI'
    }, 
      createDynamicPDFPages(processedProducts, businessInfo, template, templateConfig, { Document, Page, Text, View, StyleSheet, Image })
    );
    
    const blob = await pdf(MyDocument).toBlob();
    
    console.log(`✅ PDF dinámico generado para ${templateId}:`, `${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    
    return { success: true, blob };

  } catch (error) {
    console.error('❌ Error generando PDF dinámico:', error);
    const fallbackBlob = await generateFallbackPDF(products, businessInfo, templateId);
    return { success: true, blob: fallbackBlob };
  }
};

// ✅ CREAR PÁGINAS COMPLETAMENTE DINÁMICAS
const createDynamicPDFPages = (
  products: Array<PDFProduct & { processedImage?: string }>,
  businessInfo: BusinessInfo,
  template: TemplateConfig,
  config: any,
  components: any
) => {
  const { Page, Text, View, StyleSheet, Image } = components;

  // ✅ ESTILOS DINÁMICOS BASADOS EN TEMPLATE
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: config.colors.background,
      padding: config.spacing.padding,
      fontFamily: config.fonts.main,
    },
    
    // ✅ HEADER DINÁMICO POR TEMPLATE
    header: {
      marginBottom: config.spacing.margin,
      borderRadius: config.spacing.borderRadius,
      padding: config.spacing.padding,
      backgroundColor: getHeaderStyle(config),
      color: getHeaderTextColor(config),
      textAlign: 'center',
      borderWidth: config.design.borderWidth,
      borderColor: config.colors.border,
      height: config.layout.headerHeight,
      ...getHeaderDecorations(config)
    },
    
    businessName: {
      fontSize: getBusinessNameSize(config),
      fontWeight: 'bold',
      fontFamily: config.fonts.headings,
      color: getHeaderTextColor(config),
      marginBottom: 8,
      letterSpacing: getLetterSpacing(config),
      textTransform: getTextTransform(config),
    },
    
    catalogTitle: {
      fontSize: getCatalogTitleSize(config),
      fontWeight: 'bold',
      fontFamily: config.fonts.headings,
      color: getHeaderTextColor(config),
      marginBottom: 15,
      opacity: 0.9,
    },
    
    contactContainer: {
      flexDirection: getContactLayout(config),
      justifyContent: 'space-around',
      marginTop: 10,
    },
    
    contactInfo: {
      fontSize: 9,
      fontFamily: config.fonts.body,
      color: getHeaderTextColor(config),
      backgroundColor: getContactBgColor(config),
      padding: 4,
      borderRadius: config.spacing.borderRadius / 2,
      margin: 2,
    },
    
    // ✅ PRODUCTOS DINÁMICOS
    productsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: getProductsAlignment(config),
    },
    
    productCard: {
      width: getCardWidth(config),
      backgroundColor: config.colors.cardBg,
      borderRadius: config.spacing.borderRadius,
      padding: config.spacing.cardSpacing / 2,
      marginBottom: config.spacing.cardSpacing,
      marginRight: config.layout.productsPerRow > 2 ? 10 : 15,
      minHeight: getCardHeight(config),
      borderWidth: config.design.borderWidth,
      borderColor: config.colors.border,
      shadowColor: '#000000',
      shadowOpacity: config.design.shadowIntensity,
      shadowRadius: 4,
      shadowOffset: { width: 2, height: 2 },
      ...getCardDecorations(config)
    },
    
    categoryHeader: {
      fontSize: 8,
      fontWeight: 'bold',
      fontFamily: config.fonts.headings,
      textTransform: 'uppercase',
      textAlign: 'center',
      padding: 6,
      borderRadius: config.spacing.borderRadius,
      marginBottom: 10,
      letterSpacing: 0.5,
      ...getCategoryStyle(config)
    },
    
    productImageContainer: {
      width: config.layout.imageSize,
      height: config.layout.imageSize,
      marginBottom: 12,
      alignSelf: 'center',
      borderRadius: config.spacing.borderRadius,
      borderWidth: config.design.borderWidth / 2,
      borderColor: config.colors.border,
      backgroundColor: config.colors.accent,
    },
    
    productImage: {
      width: config.layout.imageSize - 2,
      height: config.layout.imageSize - 2,
      borderRadius: config.spacing.borderRadius - 1,
    },
    
    productName: {
      fontSize: getProductNameSize(config),
      fontWeight: 'bold',
      fontFamily: config.fonts.headings,
      color: config.colors.text,
      marginBottom: 6,
      textAlign: getTextAlignment(config),
    },
    
    productPrice: {
      fontSize: getProductPriceSize(config),
      fontWeight: 'bold',
      fontFamily: config.fonts.headings,
      color: config.colors.primary,
      ...getPriceStyle(config)
    },
    
    productSku: {
      fontSize: 8,
      fontFamily: config.fonts.body,
      color: config.colors.secondary,
      backgroundColor: config.colors.accent,
      padding: 2,
      borderRadius: config.spacing.borderRadius / 2,
    },
    
    productDescription: {
      fontSize: getDescriptionSize(config),
      fontFamily: config.fonts.body,
      color: config.colors.text,
      lineHeight: 1.4,
      marginTop: 6,
      textAlign: getTextAlignment(config),
      opacity: getDescriptionOpacity(config),
    },
    
    // ✅ FOOTER DINÁMICO
    footer: {
      position: 'absolute',
      bottom: 20,
      left: config.spacing.padding,
      right: config.spacing.padding,
      textAlign: 'center',
      borderTopWidth: config.design.borderWidth,
      borderTopColor: config.colors.border,
      paddingTop: 12,
      backgroundColor: config.colors.accent,
      borderRadius: config.spacing.borderRadius,
      padding: 12,
      ...getFooterDecorations(config)
    },
    
    footerText: {
      fontSize: 8,
      fontFamily: config.fonts.body,
      color: config.colors.text,
      fontWeight: 'bold',
    },
    
    footerSubtext: {
      fontSize: 7,
      fontFamily: config.fonts.body,
      color: config.colors.secondary,
      marginTop: 4,
    },
  });

  // ✅ DIVIDIR PRODUCTOS SEGÚN CONFIGURACIÓN DEL TEMPLATE
  const productsPerPage = config.layout.productsPerRow * 3; // 3 filas por página
  const pages = [];
  for (let i = 0; i < products.length; i += productsPerPage) {
    pages.push(products.slice(i, i + productsPerPage));
  }

  // ✅ GENERAR PÁGINAS DINÁMICAS
  return pages.map((pageProducts, pageIndex) => 
    React.createElement(Page, { key: pageIndex, size: "A4", style: styles.page }, [
      
      // ✅ HEADER ESPECÍFICO POR TEMPLATE
      pageIndex === 0 && React.createElement(View, { key: 'header', style: styles.header }, [
        React.createElement(Text, { key: 'business', style: styles.businessName }, 
          getBusinessNameText(businessInfo.business_name, config)
        ),
        React.createElement(Text, { key: 'title', style: styles.catalogTitle }, 
          getCatalogTitleText(config)
        ),
        React.createElement(View, { key: 'contacts', style: styles.contactContainer }, [
          businessInfo.phone && React.createElement(Text, { key: 'phone', style: styles.contactInfo }, 
            getContactText('phone', businessInfo.phone, config)
          ),
          businessInfo.email && React.createElement(Text, { key: 'email', style: styles.contactInfo }, 
            getContactText('email', businessInfo.email, config)
          ),
          businessInfo.website && React.createElement(Text, { key: 'website', style: styles.contactInfo }, 
            getContactText('website', businessInfo.website, config)
          ),
        ]),
        businessInfo.address && React.createElement(Text, { key: 'address', style: { ...styles.contactInfo, marginTop: 8, fontSize: 8 } }, 
          getContactText('address', businessInfo.address, config)
        ),
      ]),
      
      // ✅ PRODUCTOS DINÁMICOS
      React.createElement(View, { key: 'products', style: styles.productsContainer }, 
        pageProducts.map((product) => {
          const categoryColors = getCategoryColors(product.category || '', config);
          
          return React.createElement(View, { key: product.id, style: styles.productCard }, [
            
            // Categoría
            product.category && React.createElement(Text, { 
              key: 'category', 
              style: { 
                ...styles.categoryHeader, 
                backgroundColor: categoryColors.bg,
                color: categoryColors.text 
              } 
            }, product.category),
            
            // Imagen
            React.createElement(View, { key: 'imageContainer', style: styles.productImageContainer }, [
              product.processedImage 
                ? React.createElement(Image, { 
                    key: 'image', 
                    src: product.processedImage, 
                    style: styles.productImage 
                  })
                : React.createElement(Text, { 
                    key: 'placeholder', 
                    style: { fontSize: getPlaceholderSize(config), textAlign: 'center', marginTop: config.layout.imageSize / 3 } 
                  }, getPlaceholderIcon(config))
            ]),
            
            // Información del producto
            React.createElement(Text, { key: 'name', style: styles.productName }, 
              product.name
            ),
            
            React.createElement(Text, { key: 'price', style: styles.productPrice }, 
              `$${((product.price_retail || 0) / 100).toFixed(2)} MXN`
            ),
            
            product.sku && React.createElement(Text, { key: 'sku', style: styles.productSku }, 
              getSkuText(product.sku, config)
            ),
            
            product.description && React.createElement(Text, { key: 'desc', style: styles.productDescription }, 
              product.description.length > getDescriptionLimit(config)
                ? product.description.substring(0, getDescriptionLimit(config)) + '...'
                : product.description
            ),
          ]);
        })
      ),
      
      // ✅ FOOTER DINÁMICO
      React.createElement(View, { key: 'footer', style: styles.footer }, [
        React.createElement(Text, { key: 'footerMain', style: styles.footerText }, 
          getFooterMainText(pageIndex + 1, pages.length, products.length, config)
        ),
        React.createElement(Text, { key: 'footerSub', style: styles.footerSubtext }, 
          getFooterSubText(config)
        ),
      ]),
    ])
  );
};

// ✅ FUNCIONES DINÁMICAS POR TEMPLATE
const getHeaderStyle = (config: any) => {
  const styles = {
    'minimal': config.colors.background,
    'corporate': config.colors.primary,
    'luxury': config.colors.background,
    'organic': config.colors.primary,
    'rustic': config.colors.accent
  };
  return styles[config.design.headerStyle] || config.colors.primary;
};

const getHeaderTextColor = (config: any) => {
  const colors = {
    'minimal': config.colors.text,
    'corporate': '#ffffff',
    'luxury': config.colors.primary,
    'organic': '#ffffff', 
    'rustic': config.colors.text
  };
  return colors[config.design.headerStyle] || '#ffffff';
};

const getBusinessNameSize = (config: any) => {
  const sizes = {
    'minimal': 24,
    'corporate': 28,
    'luxury': 32,
    'organic': 26,
    'rustic': 22
  };
  return sizes[config.design.headerStyle] || 26;
};

const getCatalogTitleSize = (config: any) => {
  const sizes = {
    'minimal': 14,
    'corporate': 16,
    'luxury': 18,
    'organic': 15,
    'rustic': 13
  };
  return sizes[config.design.headerStyle] || 16;
};

const getLetterSpacing = (config: any) => {
  const spacing = {
    'minimal': 0.5,
    'corporate': 1,
    'luxury': 2,
    'organic': 0.5,
    'rustic': 0
  };
  return spacing[config.design.headerStyle] || 1;
};

const getTextTransform = (config: any) => {
  const transforms = {
    'minimal': 'none',
    'corporate': 'uppercase',
    'luxury': 'uppercase',
    'organic': 'none',
    'rustic': 'uppercase'
  };
  return transforms[config.design.headerStyle] || 'none';
};

const getContactLayout = (config: any) => {
  const layouts = {
    'minimal': 'row',
    'corporate': 'row',
    'luxury': 'column',
    'organic': 'row',
    'rustic': 'row'
  };
  return layouts[config.design.headerStyle] || 'row';
};

const getContactBgColor = (config: any) => {
  const bgColors = {
    'minimal': 'transparent',
    'corporate': 'rgba(255,255,255,0.2)',
    'luxury': config.colors.accent,
    'organic': 'rgba(255,255,255,0.2)',
    'rustic': config.colors.border
  };
  return bgColors[config.design.headerStyle] || 'transparent';
};

const getCardWidth = (config: any) => {
  const widths = {
    2: '47%',
    3: '30%'
  };
  return widths[config.layout.productsPerRow] || '47%';
};

const getCardHeight = (config: any) => {
  const heights = {
    'minimal': 180,
    'corporate': 200,
    'luxury': 220,
    'organic': 190,
    'rustic': 185
  };
  return heights[config.design.cardStyle] || 190;
};

const getProductsAlignment = (config: any) => {
  const alignments = {
    'minimal': 'space-between',
    'corporate': 'flex-start',
    'luxury': 'space-around',
    'organic': 'space-between',
    'rustic': 'flex-start'
  };
  return alignments[config.design.cardStyle] || 'space-between';
};

const getTextAlignment = (config: any) => {
  const alignments = {
    'minimal': 'center',
    'corporate': 'left',
    'luxury': 'center',
    'organic': 'center',
    'rustic': 'left'
  };
  return alignments[config.design.cardStyle] || 'center';
};

const getProductNameSize = (config: any) => {
  const sizes = {
    'minimal': 12,
    'corporate': 13,
    'luxury': 14,
    'organic': 12,
    'rustic': 11
  };
  return sizes[config.design.cardStyle] || 12;
};

const getProductPriceSize = (config: any) => {
  const sizes = {
    'minimal': 14,
    'corporate': 15,
    'luxury': 16,
    'organic': 14,
    'rustic': 13
  };
  return sizes[config.design.cardStyle] || 14;
};

const getDescriptionSize = (config: any) => {
  const sizes = {
    'minimal': 8,
    'corporate': 9,
    'luxury': 9,
    'organic': 8,
    'rustic': 7
  };
  return sizes[config.design.cardStyle] || 8;
};

const getDescriptionLimit = (config: any) => {
  const limits = {
    'minimal': 60,
    'corporate': 80,
    'luxury': 70,
    'organic': 65,
    'rustic': 50
  };
  return limits[config.design.cardStyle] || 70;
};

const getDescriptionOpacity = (config: any) => {
  const opacities = {
    'minimal': 0.7,
    'corporate': 0.8,
    'luxury': 0.9,
    'organic': 0.75,
    'rustic': 0.8
  };
  return opacities[config.design.cardStyle] || 0.8;
};

const getPlaceholderSize = (config: any) => {
  return config.layout.imageSize / 3;
};

const getPlaceholderIcon = (config: any) => {
  const icons = {
    'minimal': '□',
    'corporate': '■',
    'luxury': '◊',
    'organic': '🌿',
    'rustic': '⌂'
  };
  return icons[config.design.cardStyle] || '📷';
};

const getBusinessNameText = (name: string, config: any) => {
  const transforms = {
    'minimal': name,
    'corporate': name.toUpperCase(),
    'luxury': name.toUpperCase(),
    'organic': name,
    'rustic': name.toUpperCase()
  };
  return transforms[config.design.headerStyle] || name;
};

const getCatalogTitleText = (config: any) => {
  const titles = {
    'minimal': 'Catálogo de Productos',
    'corporate': 'CATÁLOGO CORPORATIVO',
    'luxury': 'COLECCIÓN EXCLUSIVA',
    'organic': 'Productos Naturales',
    'rustic': 'CATÁLOGO ARTESANAL'
  };
  return titles[config.design.headerStyle] || 'CATÁLOGO DE PRODUCTOS';
};

const getContactText = (type: string, value: string, config: any) => {
  const prefixes = {
    'minimal': { phone: '', email: '', website: '', address: '' },
    'corporate': { phone: 'Tel:', email: 'Email:', website: 'Web:', address: 'Oficina:' },
    'luxury': { phone: 'Teléfono', email: 'Correo', website: 'Sitio Web', address: 'Dirección' },
    'organic': { phone: '📞', email: '✉️', website: '🌐', address: '📍' },
    'rustic': { phone: 'Tel.', email: 'Correo', website: 'Web', address: 'Ubicación' }
  };
  
  const prefix = prefixes[config.design.headerStyle]?.[type] || '';
  return prefix ? `${prefix} ${value}` : value;
};

const getSkuText = (sku: string, config: any) => {
  const formats = {
    'minimal': sku,
    'corporate': `Código: ${sku}`,
    'luxury': `Ref: ${sku}`,
    'organic': `#${sku}`,
    'rustic': `Cód. ${sku}`
  };
  return formats[config.design.cardStyle] || `SKU: ${sku}`;
};

const getFooterMainText = (currentPage: number, totalPages: number, totalProducts: number, config: any) => {
  const formats = {
    'minimal': `${currentPage}/${totalPages} • ${totalProducts} productos`,
    'corporate': `Página ${currentPage} de ${totalPages} • Total: ${totalProducts} productos`,
    'luxury': `Página ${currentPage} de ${totalPages} • ${totalProducts} artículos exclusivos`,
    'organic': `Pág. ${currentPage}/${totalPages} • ${totalProducts} productos naturales`,
    'rustic': `Hoja ${currentPage} de ${totalPages} • ${totalProducts} productos artesanales`
  };
  return formats[config.design.headerStyle] || `Página ${currentPage} de ${totalPages} • ${totalProducts} productos`;
};

const getFooterSubText = (config: any) => {
  const texts = {
    'minimal': `${new Date().toLocaleDateString('es-MX')} • Catalgo AI`,
    'corporate': `Generado: ${new Date().toLocaleDateString('es-MX')} • Powered by Catalgo AI`,
    'luxury': `Creado exclusivamente el ${new Date().toLocaleDateString('es-MX')} • Catalgo AI Premium`,
    'organic': `🌱 ${new Date().toLocaleDateString('es-MX')} • Eco-friendly by Catalgo AI`,
    'rustic': `Hecho a mano el ${new Date().toLocaleDateString('es-MX')} • Con Catalgo AI`
  };
  return texts[config.design.headerStyle] || `${new Date().toLocaleDateString('es-MX')} • Catalgo AI`;
};

// ✅ FUNCIONES AUXILIARES (mantenidas de versión anterior)
const processProductImages = async (products: PDFProduct[]): Promise<Array<PDFProduct & { processedImage?: string }>> => {
  const processedProducts = await Promise.all(
    products.map(async (product) => {
      try {
        const imageBase64 = await convertImageToBase64(product.image_url);
        return { ...product, processedImage: imageBase64 };
      } catch (error) {
        return { ...product, processedImage: undefined };
      }
    })
  );
  return processedProducts;
};

const convertImageToBase64 = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const maxSize = 200;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
    setTimeout(() => reject(new Error('Image load timeout')), 3000);
    img.src = imageUrl;
  });
};

const getCategoryColors = (category: string, config: any) => {
  return {
    bg: config.colors.accent,
    text: config.colors.text
  };
};

const getHeaderDecorations = (config: any) => {
  const decorations = {
    'minimal': {},
    'corporate': { borderLeftWidth: 5, borderLeftColor: config.colors.secondary },
    'luxury': { borderTopWidth: 3, borderTopColor: config.colors.primary, borderBottomWidth: 3, borderBottomColor: config.colors.primary },
    'organic': { borderRadius: 20 },
    'rustic': { borderStyle: 'dashed' }
  };
  return decorations[config.design.headerStyle] || {};
};

const getCardDecorations = (config: any) => {
  const decorations = {
    'minimal': {},
    'corporate': { borderLeftWidth: 3, borderLeftColor: config.colors.primary },
    'luxury': { borderTopWidth: 2, borderTopColor: config.colors.primary },
    'organic': { borderRadius: 15 },
    'rustic': { borderStyle: 'solid', borderTopWidth: 3, borderTopColor: config.colors.primary }
  };
  return decorations[config.design.cardStyle] || {};
};

const getCategoryStyle = (config: any) => {
  const styles = {
    'minimal': { backgroundColor: config.colors.accent },
    'corporate': { backgroundColor: config.colors.primary, color: '#ffffff' },
    'luxury': { backgroundColor: config.colors.primary, color: config.colors.background },
    'organic': { backgroundColor: config.colors.primary, color: '#ffffff', borderRadius: 10 },
    'rustic': { backgroundColor: config.colors.accent, borderWidth: 1, borderColor: config.colors.border }
  };
  return styles[config.design.cardStyle] || {};
};

const getPriceStyle = (config: any) => {
  const styles = {
    'minimal': {},
    'corporate': { backgroundColor: config.colors.accent, padding: 4, borderRadius: 3 },
    'luxury': { backgroundColor: config.colors.primary, color: config.colors.background, padding: 6, borderRadius: 5 },
    'organic': { backgroundColor: config.colors.accent, padding: 4, borderRadius: 8 },
    'rustic': { backgroundColor: config.colors.accent, padding: 3, border: `1pt solid ${config.colors.border}` }
  };
  return styles[config.design.cardStyle] || {};
};

const getFooterDecorations = (config: any) => {
  const decorations = {
    'minimal': {},
    'corporate': { borderLeftWidth: 3, borderLeftColor: config.colors.primary },
    'luxury': { backgroundColor: config.colors.accent, borderTopWidth: 2, borderTopColor: config.colors.primary },
    'organic': { borderRadius: 15, backgroundColor: config.colors.accent },
    'rustic': { borderStyle: 'dashed', backgroundColor: config.colors.accent }
  };
  return decorations[config.design.headerStyle] || {};
};

// ✅ FALLBACK Y FUNCIONES DE EXPORTACIÓN (simplificadas)
const generateFallbackPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string
): Promise<Blob> => {
  const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj  
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 200>>stream
BT
/F1 20 Tf
50 750 Td
(${businessInfo.business_name}) Tj
0 -30 Td
(Catalogo ${templateId}) Tj
0 -30 Td
(${products.length} productos) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000100 00000 n
0000000200 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
250
%%EOF`;
  
  return new Blob([pdfContent], { type: 'application/pdf' });
};

// ✅ FUNCIONES DE EXPORTACIÓN (mantenidas)
export const downloadCatalogPDF = async (
  products: PDFProduct[],
  businessInfo: BusinessInfo,
  templateId: string,
  filename?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await generateCatalogPDF(products, businessInfo, templateId);
    
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'Error generando PDF');
    }

    const template = getTemplateById(templateId);
    const timestamp = new Date().toISOString().slice(0, 10);
    const cleanBusinessName = businessInfo.business_name.replace(/[^a-zA-Z0-9]/g, '-');
    const finalFilename = filename || `catalogo-${template?.displayName.replace(/\s+/g, '-').toLowerCase()}-${cleanBusinessName}-${timestamp}.pdf`;
    
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    
    console.log(`✅ PDF dinámico ${templateId} descargado:`, finalFilename);
    return { success: true };

  } catch (error) {
    console.error('❌ Error descarga PDF dinámico:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error descargando'
    };
  }
};

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

export const getPDFEstimates = (products: PDFProduct[], template: TemplateConfig) => {
  const config = getTemplateSpecificStyles(template.id, template);
  const productsPerPage = config.layout.productsPerRow * 3;
  const totalPages = Math.ceil(products.length / productsPerPage);
  const estimatedSize = Math.max(0.3, (products.length * 0.1) + 0.4);
  const estimatedTime = Math.max(3, products.length * 0.08);

  return {
    totalProducts: products.length,
    totalPages,
    productsPerPage,
    estimatedSize: `${estimatedSize.toFixed(1)} MB`,
    estimatedTime: `${Math.ceil(estimatedTime)} seg`,
    instantGeneration: true,
    noCreditsCost: true,
    dynamicFeatures: [
      `🎨 Estilo único: ${template.displayName}`,
      `📐 Layout optimizado: ${config.design.cardStyle}`,
      `🖼️ Imágenes reales procesadas`,
      `🎯 Diseño 100% personalizado`
    ],
    templateInfo: {
      name: template.displayName,
      layout: template.layout,
      category: template.category,
      uniqueStyle: config.design.headerStyle
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
    if (!product.image_url) {
      errors.push(`Producto ${index + 1}: Sin imagen`);
    }
    if (!product.price_retail || product.price_retail <= 0) {
      errors.push(`Producto ${index + 1}: Precio inválido`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};
