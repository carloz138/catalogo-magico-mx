import { WebCatalogTemplate } from "@/lib/web-catalog/types";

export class WebTemplateAdapter {
  static generateWebCSS(template: WebCatalogTemplate, backgroundPattern?: string | null): string {
    const colors = template.colorScheme;
    const config = template.config;

    // 1. Lógica de Fuentes (Google Fonts Import) - MEJORADA
    let fontImport = "";
    let fontFamily = "system-ui, -apple-system, sans-serif"; // Default

    if (config.customFonts && config.customFonts.length > 0) {
      const fontName = config.customFonts[0];
      const fontUrlName = fontName.replace(/\s+/g, "+");
      fontImport = `@import url('https://fonts.googleapis.com/css2?family=${fontUrlName}:wght@300;400;600;700&display=swap');`;
      fontFamily = `'${fontName}', sans-serif`;
    } else {
      // Mapeo de estilos a fuentes Google
      switch (template.style) {
        case "luxury":
          fontImport = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400&display=swap');`;
          fontFamily = `'Playfair Display', serif`;
          break;
        case "elegant": // Este es el que usa Frozen Blue
          fontImport = `@import url('https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600&display=swap');`;
          fontFamily = `'Raleway', sans-serif`;
          break;
        case "playful":
          fontImport = `@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap');`;
          fontFamily = `'Quicksand', sans-serif`;
          break;
        case "bold":
          fontImport = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Open+Sans:wght@400&display=swap');`;
          fontFamily = `'Oswald', sans-serif`;
          break;
        case "minimal":
          fontImport = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');`;
          fontFamily = `'Inter', sans-serif`;
          break;
        case "modern":
        default:
          fontImport = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`;
          fontFamily = `'DM Sans', sans-serif`;
          break;
      }
    }

    // 2. Mapeo de configuraciones
    const borderRadiusMap: Record<string, string> = {
      none: "0px",
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
      "2xl": "24px",
      "3xl": "32px",
      full: "9999px",
    };
    const borderRadius = borderRadiusMap[config.cardRadius] || "8px";

    const gapMap: Record<string, string> = {
      tight: "0.5rem",
      normal: "1rem",
      loose: "2rem",
    };
    const gap = gapMap[config.gap] || "1rem";

    const patternUrls: Record<string, string> = {
      taco: "/patterns/pattern-taco.png",
      ghost: "/patterns/pattern-ghost.png",
      pumpkin: "/patterns/pattern-pumpkin.png",
    };

    const patternUrl = backgroundPattern ? patternUrls[backgroundPattern] : null;

    // 4. ESTILOS DE TARJETA
    let cardStylesCSS = "";

    switch (config.cardStyle) {
      case "elevated":
        cardStylesCSS = `
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                border: 1px solid transparent !important;
            `;
        break;
      case "outlined":
        cardStylesCSS = `
                border: 1px solid var(--border-color) !important;
                box-shadow: none !important;
            `;
        break;
      case "flat":
        cardStylesCSS = `
                border: none !important;
                box-shadow: none !important;
                background: var(--card-background) !important;
            `;
        break;
      case "soft":
        cardStylesCSS = `
                box-shadow: 0 10px 15px -3px var(--primary-color-alpha), 0 4px 6px -2px var(--primary-color-alpha) !important;
                border: 1px solid rgba(255,255,255,0.5) !important;
            `;
        break;
      case "glass":
        cardStylesCSS = `
                background: rgba(255, 255, 255, 0.1) !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15) !important;
            `;
        if (colors.background.includes("#0") || colors.background.includes("#1")) {
          cardStylesCSS = `
                    background: rgba(0, 0, 0, 0.4) !important;
                    backdrop-filter: blur(12px) !important;
                    -webkit-backdrop-filter: blur(12px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                `;
        }
        break;
    }

    let hoverCSS = "";
    switch (config.hoverEffect) {
      case "lift":
        hoverCSS = `transform: translateY(-5px) !important; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;`;
        break;
      case "scale":
      case "zoom":
        hoverCSS = `transform: scale(1.02) !important; z-index: 10;`;
        break;
      case "glow":
        hoverCSS = `box-shadow: 0 0 15px var(--primary-color) !important; border-color: var(--primary-color) !important;`;
        break;
      case "bounce":
        hoverCSS = `transform: scale(0.98) !important;`;
        break;
      case "tilt":
        hoverCSS = `transform: rotate(1deg) scale(1.02) !important;`;
        break;
    }

    const hexToRgbAlpha = (hex: string, alpha: number) => {
      let c: any;
      if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split("");
        if (c.length == 3) {
          c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = "0x" + c.join("");
        return "rgba(" + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") + "," + alpha + ")";
      }
      return "rgba(0,0,0,0.1)";
    };

    return `
      ${fontImport}

      .catalog-public-container {
        --primary-color: ${colors.primary};
        --primary-color-alpha: ${hexToRgbAlpha(colors.primary, 0.15)};
        --secondary-color: ${colors.secondary};
        --accent-color: ${colors.accent};
        --background-color: ${colors.background};
        --card-background: ${colors.cardBackground};
        --text-color: ${colors.text};
        --text-muted: ${colors.textMuted};
        --border-color: ${colors.border};
        --border-radius: ${borderRadius};
        --grid-gap: ${gap};
        --font-family: ${fontFamily};
        
        font-family: var(--font-family) !important;
        background-color: var(--background-color) !important;
        background-image: ${colors.gradient ? `linear-gradient(${colors.gradient.direction}, ${colors.gradient.from}, ${colors.gradient.to})` : "none"} !important;
        min-height: 100vh;
        position: relative;
        color: var(--text-color);
      }
      
      ${
        patternUrl
          ? `
      .catalog-public-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('${patternUrl}');
        background-repeat: repeat;
        background-size: 120px 120px;
        opacity: 0.04;
        pointer-events: none;
        z-index: 0;
      }
      `
          : ""
      }
      
      .catalog-public-container .grid {
        gap: var(--grid-gap) !important;
        position: relative;
        z-index: 1;
      }
      
      .catalog-public-container .catalog-product-card {
        border-radius: var(--border-radius) !important;
        transition: all ${config.transitionSpeed === "slow" ? "0.5s" : "0.3s"} cubic-bezier(0.4, 0, 0.2, 1) !important;
        overflow: hidden;
        ${cardStylesCSS}
      }
      
      .catalog-public-container .catalog-product-card:hover {
        ${hoverCSS}
      }
      
      .catalog-public-container .catalog-product-image {
         ${config.imageRatio === "square" ? "aspect-ratio: 1 / 1;" : ""}
         ${config.imageRatio === "portrait" ? "aspect-ratio: 3 / 4;" : ""}
         ${config.imageRatio === "landscape" ? "aspect-ratio: 16 / 9;" : ""}
         object-fit: cover;
         width: 100%;
      }

      .catalog-public-container h1, 
      .catalog-public-container h2, 
      .catalog-public-container h3,
      .catalog-public-container .font-bold {
        font-family: var(--font-family) !important;
        font-weight: 700;
      }

      .catalog-public-container .catalog-product-name {
        color: var(--text-color) !important;
        font-size: ${template.style === "bold" || template.style === "luxury" ? "1.1rem" : "1rem"};
      }
      
      .catalog-public-container .catalog-product-price {
        color: var(--primary-color) !important;
        font-weight: 800;
      }
      
      .catalog-public-container .catalog-add-button {
        background: var(--primary-color) !important;
        border-radius: var(--border-radius) !important;
        color: ${colors.background === "#ffffff" || colors.background === "#f8fafc" ? "#ffffff" : "#000000"}; 
      }
      
      .catalog-public-container .badge-sale {
         background: var(--accent-color) !important;
         color: #fff;
      }

      .catalog-public-container .preview-internal-header {
         background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)) !important;
         color: white !important;
      }

      .catalog-public-container .preview-internal-header h1 {
         color: white !important;
      }

      .catalog-public-container .preview-internal-header p {
         color: rgba(255, 255, 255, 0.9) !important;
      }
    `;
  }
}
