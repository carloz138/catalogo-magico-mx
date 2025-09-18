// src/lib/templates/template-audit-system.ts
// 🔍 SISTEMA DE AUDITORÍA PARA TEMPLATES - GARANTIZA CALIDAD PERFECTA

import { IndustryTemplate, getTemplateById } from './industry-templates';
import INDUSTRY_TEMPLATES from './industry-templates';

interface AuditResult {
  templateId: string;
  templateName: string;
  status: 'perfect' | 'good' | 'needs_fix' | 'broken';
  issues: AuditIssue[];
  recommendations: string[];
  compatibility: {
    puppeteer: boolean;
    dynamic: boolean;
    classic: boolean;
  };
  scalability: {
    minProducts: number;
    maxProducts: number;
    optimalRange: [number, number];
  };
  qualityScore: number; // 0-100
}

interface AuditIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'layout' | 'colors' | 'typography' | 'performance' | 'compatibility';
  description: string;
  solution: string;
}

interface FixedTemplate extends IndustryTemplate {
  auditStatus: 'audited' | 'fixed' | 'optimized';
  lastAudit: string;
  qualityScore: number;
}

export class TemplateAuditSystem {
  
  /**
   * 🔍 AUDITORÍA COMPLETA DE TODOS LOS TEMPLATES
   */
  static async auditAllTemplates(): Promise<AuditResult[]> {
    console.log('🔍 Iniciando auditoría completa de templates...');
    
    const allTemplates = Object.values(INDUSTRY_TEMPLATES);
    const auditResults: AuditResult[] = [];
    
    for (const template of allTemplates) {
      const result = await this.auditSingleTemplate(template);
      auditResults.push(result);
      
      console.log(`✅ Template ${template.id} auditado: ${result.status} (${result.qualityScore}/100)`);
    }
    
    // Generar reporte de auditoría
    this.generateAuditReport(auditResults);
    
    return auditResults;
  }
  
  /**
   * 🔍 AUDITAR TEMPLATE INDIVIDUAL
   */
  static async auditSingleTemplate(template: IndustryTemplate): Promise<AuditResult> {
    const issues: AuditIssue[] = [];
    const recommendations: string[] = [];
    
    // 1. Auditoría de Layout
    const layoutIssues = this.auditLayout(template);
    issues.push(...layoutIssues);
    
    // 2. Auditoría de Colores
    const colorIssues = this.auditColors(template);
    issues.push(...colorIssues);
    
    // 3. Auditoría de Tipografía
    const typographyIssues = this.auditTypography(template);
    issues.push(...typographyIssues);
    
    // 4. Auditoría de Performance
    const performanceIssues = this.auditPerformance(template);
    issues.push(...performanceIssues);
    
    // 5. Auditoría de Compatibilidad
    const compatibilityResult = this.auditCompatibility(template);
    issues.push(...compatibilityResult.issues);
    
    // 6. Auditoría de Escalabilidad
    const scalabilityResult = this.auditScalability(template);
    issues.push(...scalabilityResult.issues);
    
    // Generar recomendaciones
    recommendations.push(...this.generateRecommendations(template, issues));
    
    // Calcular score de calidad
    const qualityScore = this.calculateQualityScore(issues);
    
    // Determinar status
    const status = this.determineStatus(qualityScore, issues);
    
    return {
      templateId: template.id,
      templateName: template.displayName,
      status,
      issues,
      recommendations,
      compatibility: compatibilityResult.compatibility,
      scalability: scalabilityResult.scalability,
      qualityScore
    };
  }
  
  /**
   * 📐 AUDITORÍA DE LAYOUT
   */
  private static auditLayout(template: IndustryTemplate): AuditIssue[] {
    const issues: AuditIssue[] = [];
    
    // Verificar grid columns vs products per page
    const optimalColumns = this.calculateOptimalColumns(template.productsPerPage);
    if (template.gridColumns !== optimalColumns) {
      issues.push({
        severity: 'medium',
        category: 'layout',
        description: `Grid columns (${template.gridColumns}) no es óptimo para ${template.productsPerPage} productos/página`,
        solution: `Usar ${optimalColumns} columnas para mejor layout`
      });
    }
    
    // Verificar aspect ratio de cards
    if (template.density === 'alta' && template.productsPerPage > 12) {
      issues.push({
        severity: 'high',
        category: 'layout',
        description: 'Densidad alta con muchos productos puede causar cards muy pequeñas',
        solution: 'Considerar densidad media o reducir productos por página'
      });
    }
    
    // Verificar compatibilidad de border radius
    if ((template.design?.borderRadius || 8) > 15) {
      issues.push({
        severity: 'low',
        category: 'layout',
        description: 'Border radius muy alto puede causar problemas en algunos navegadores',
        solution: 'Limitar border radius a máximo 15px'
      });
    }
    
    // Verificar spacing
    if (!template.design.spacing) {
      issues.push({
        severity: 'medium',
        category: 'layout',
        description: 'Spacing no definido',
        solution: 'Definir spacing explícitamente (compacto/normal/amplio)'
      });
    }
    
    return issues;
  }
  
  /**
   * 🎨 AUDITORÍA DE COLORES
   */
  private static auditColors(template: IndustryTemplate): AuditIssue[] {
    const issues: AuditIssue[] = [];
    
    // Verificar contraste
    const primaryContrast = this.calculateContrast(template.colors.primary, '#ffffff');
    if (primaryContrast < 4.5) {
      issues.push({
        severity: 'high',
        category: 'colors',
        description: `Contraste insuficiente en color primario (${primaryContrast.toFixed(1)})`,
        solution: 'Ajustar color primario para mejor legibilidad'
      });
    }
    
    // Verificar que secondary no sea igual a primary
    if (template.colors.secondary && template.colors.secondary === template.colors.primary) {
      issues.push({
        severity: 'low',
        category: 'colors',
        description: 'Color secundario igual al primario',
        solution: 'Definir color secundario diferente para mejor variación visual'
      });
    }
    
    // Verificar background color
    if (!template.colors.background) {
      issues.push({
        severity: 'medium',
        category: 'colors',
        description: 'Color de fondo no definido',
        solution: 'Definir color de fondo explícitamente'
      });
    }
    
    // Verificar accent color
    if (!template.colors.accent) {
      issues.push({
        severity: 'low',
        category: 'colors',
        description: 'Color de acento no definido',
        solution: 'Definir color de acento para mejor jerarquía visual'
      });
    }
    
    // Verificar cardBackground
    if (!template.colors.cardBackground) {
      issues.push({
        severity: 'low',
        category: 'colors',
        description: 'Color de fondo de cards no definido',
        solution: 'Definir cardBackground explícitamente'
      });
    }
    
    return issues;
  }
  
  /**
   * ✏️ AUDITORÍA DE TIPOGRAFÍA
   */
  private static auditTypography(template: IndustryTemplate): AuditIssue[] {
    const issues: AuditIssue[] = [];
    
    // Verificar que text color esté definido
    if (!template.colors.text) {
      issues.push({
        severity: 'medium',
        category: 'typography',
        description: 'Color de texto no definido',
        solution: 'Definir color de texto explícitamente'
      });
    }
    
    // Verificar compatibilidad de densidad con fonts
    if (template.density === 'alta' && template.productsPerPage > 15) {
      issues.push({
        severity: 'medium',
        category: 'typography',
        description: 'Densidad muy alta puede hacer texto ilegible',
        solution: 'Considerar reducir productos por página o usar densidad media'
      });
    }
    
    return issues;
  }
  
  /**
   * ⚡ AUDITORÍA DE PERFORMANCE
   */
  private static auditPerformance(template: IndustryTemplate): AuditIssue[] {
    const issues: AuditIssue[] = [];
    
    // Verificar shadows performance
    if (template.design.shadows && template.productsPerPage > 20) {
      issues.push({
        severity: 'low',
        category: 'performance',
        description: 'Sombras con muchos productos pueden afectar performance',
        solution: 'Considerar deshabilitar sombras para alta densidad'
      });
    }
    
    // Verificar productos por página
    if (template.productsPerPage > 30) {
      issues.push({
        severity: 'medium',
        category: 'performance',
        description: 'Demasiados productos por página pueden causar problemas de memoria',
        solution: 'Limitar a máximo 30 productos por página'
      });
    }
    
    return issues;
  }
  
  /**
   * 🔧 AUDITORÍA DE COMPATIBILIDAD
   */
  private static auditCompatibility(template: IndustryTemplate): {
    compatibility: { puppeteer: boolean; dynamic: boolean; classic: boolean };
    issues: AuditIssue[];
  } {
    const issues: AuditIssue[] = [];
    const compatibility = {
      puppeteer: true,
      dynamic: true,
      classic: true
    };
    
    // Verificar compatibilidad con Puppeteer
    if ((template.design?.borderRadius || 8) > 20) {
      compatibility.puppeteer = false;
      issues.push({
        severity: 'medium',
        category: 'compatibility',
        description: 'Border radius muy alto puede causar problemas en Puppeteer',
        solution: 'Reducir border radius para mejor compatibilidad'
      });
    }
    
    // Verificar compatibilidad con Dynamic Engine
    if (template.productsPerPage > 25) {
      compatibility.dynamic = false;
      issues.push({
        severity: 'low',
        category: 'compatibility',
        description: 'Dynamic engine puede tener problemas con muchos productos',
        solution: 'Considerar paginación más pequeña para dynamic engine'
      });
    }
    
    // Verificar compatibilidad con Classic Engine
    if (template.design.shadows && template.productsPerPage > 15) {
      compatibility.classic = false;
      issues.push({
        severity: 'low',
        category: 'compatibility',
        description: 'Classic engine puede tener problemas con sombras y alta densidad',
        solution: 'Simplificar diseño para mejor compatibilidad con classic engine'
      });
    }
    
    return { compatibility, issues };
  }
  
  /**
   * 📈 AUDITORÍA DE ESCALABILIDAD
   */
  private static auditScalability(template: IndustryTemplate): {
    scalability: { minProducts: number; maxProducts: number; optimalRange: [number, number] };
    issues: AuditIssue[];
  } {
    const issues: AuditIssue[] = [];
    
    // Calcular rangos según densidad
    const ranges = {
      alta: { min: 10, max: 1000, optimal: [20, 200] as [number, number] },
      media: { min: 5, max: 500, optimal: [10, 100] as [number, number] },
      baja: { min: 1, max: 200, optimal: [5, 50] as [number, number] }
    };
    
    const range = ranges[template.density] || ranges.media;
    
    // Verificar si el template es escalable
    if (template.productsPerPage < 3 && template.density === 'alta') {
      issues.push({
        severity: 'medium',
        category: 'performance',
        description: 'Pocos productos por página con alta densidad es ineficiente',
        solution: 'Aumentar productos por página o cambiar a densidad media/baja'
      });
    }
    
    if (template.productsPerPage > 20 && template.density === 'baja') {
      issues.push({
        severity: 'high',
        category: 'performance',
        description: 'Demasiados productos por página con baja densidad causará cards muy pequeñas',
        solution: 'Reducir productos por página o cambiar a densidad alta'
      });
    }
    
    return {
      scalability: {
        minProducts: range.min,
        maxProducts: range.max,
        optimalRange: range.optimal
      },
      issues
    };
  }
  
  /**
   * 💡 GENERAR RECOMENDACIONES
   */
  private static generateRecommendations(template: IndustryTemplate, issues: AuditIssue[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    
    if (criticalIssues > 0) {
      recommendations.push(`🚨 URGENTE: Corregir ${criticalIssues} problema(s) crítico(s) antes de usar en producción`);
    }
    
    if (highIssues > 0) {
      recommendations.push(`⚠️ Corregir ${highIssues} problema(s) de alta prioridad para mejor calidad`);
    }
    
    if (mediumIssues > 2) {
      recommendations.push(`💡 Optimizar template corrigiendo ${mediumIssues} problemas medianos`);
    }
    
    // Recomendaciones específicas por industria
    const industryRecommendations = {
      joyeria: ['Usar colores elegantes', 'Maximizar espacio para imágenes', 'Fuentes serif para elegancia'],
      moda: ['Priorizar imágenes grandes', 'Colores vibrantes', 'Layout moderno'],
      electronica: ['Enfoque en especificaciones', 'Colores tech', 'Layout limpio'],
      ferreteria: ['Información práctica', 'Colores industriales', 'Layout funcional'],
      cosmeticos: ['Imágenes atractivas', 'Colores suaves', 'Información de beneficios']
    };
    
    const industryRec = industryRecommendations[template.industry];
    if (industryRec) {
      recommendations.push(`🎯 Optimizaciones para ${template.industry}: ${industryRec.join(', ')}`);
    }
    
    return recommendations;
  }
  
  /**
   * 📊 CALCULAR SCORE DE CALIDAD
   */
  private static calculateQualityScore(issues: AuditIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * 📈 DETERMINAR STATUS
   */
  private static determineStatus(score: number, issues: AuditIssue[]): 'perfect' | 'good' | 'needs_fix' | 'broken' {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0) return 'broken';
    if (highIssues > 0 || score < 60) return 'needs_fix';
    if (score >= 90) return 'perfect';
    return 'good';
  }
  
  /**
   * 🛠️ GENERAR TEMPLATES CORREGIDOS
   */
  static generateFixedTemplates(auditResults: AuditResult[]): FixedTemplate[] {
    const fixedTemplates: FixedTemplate[] = [];
    
    for (const audit of auditResults) {
      if (audit.status === 'broken' || audit.status === 'needs_fix') {
        const originalTemplate = getTemplateById(audit.templateId);
        if (originalTemplate) {
          const fixedTemplate = this.applyFixes(originalTemplate, audit);
          fixedTemplates.push(fixedTemplate);
        }
      }
    }
    
    return fixedTemplates;
  }
  
  /**
   * 🔧 APLICAR CORRECCIONES
   */
  private static applyFixes(template: IndustryTemplate, audit: AuditResult): FixedTemplate {
    const fixed: FixedTemplate = {
      ...template,
      auditStatus: 'fixed',
      lastAudit: new Date().toISOString(),
      qualityScore: audit.qualityScore
    };
    
    // Aplicar correcciones automáticas
    audit.issues.forEach(issue => {
      switch (issue.category) {
        case 'layout':
          if (issue.description.includes('Grid columns')) {
            fixed.gridColumns = this.calculateOptimalColumns(template.productsPerPage);
          }
          if (issue.description.includes('Border radius')) {
            fixed.design.borderRadius = Math.min(15, template.design?.borderRadius || 8);
          }
          if (!template.design.spacing) {
            fixed.design.spacing = 'normal';
          }
          break;
          
        case 'colors':
          if (!template.colors.background) {
            fixed.colors.background = '#ffffff';
          }
          if (!template.colors.accent) {
            fixed.colors.accent = this.generateAccentColor(template.colors.primary);
          }
          if (!template.colors.cardBackground) {
            fixed.colors.cardBackground = '#ffffff';
          }
          if (!template.colors.text) {
            fixed.colors.text = '#2c3e50';
          }
          break;
          
        case 'performance':
          if (issue.description.includes('Demasiados productos')) {
            fixed.productsPerPage = Math.min(20, template.productsPerPage);
          }
          if (issue.description.includes('sombras') && template.productsPerPage > 20) {
            fixed.design.shadows = false;
          }
          break;
      }
    });
    
    return fixed;
  }
  
  /**
   * 📋 GENERAR REPORTE DE AUDITORÍA
   */
  private static generateAuditReport(results: AuditResult[]): void {
    const perfect = results.filter(r => r.status === 'perfect').length;
    const good = results.filter(r => r.status === 'good').length;
    const needsFix = results.filter(r => r.status === 'needs_fix').length;
    const broken = results.filter(r => r.status === 'broken').length;
    
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const avgScore = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
    
    console.log(`
🔍 === REPORTE DE AUDITORÍA DE TEMPLATES ===

📊 RESUMEN:
- Total templates: ${results.length}
- Perfectos: ${perfect} (${((perfect / results.length) * 100).toFixed(1)}%)
- Buenos: ${good} (${((good / results.length) * 100).toFixed(1)}%)
- Necesitan corrección: ${needsFix} (${((needsFix / results.length) * 100).toFixed(1)}%)
- Rotos: ${broken} (${((broken / results.length) * 100).toFixed(1)}%)

🎯 MÉTRICAS:
- Issues totales encontrados: ${totalIssues}
- Puntaje promedio: ${avgScore.toFixed(1)}/100
- Templates compatibles con Puppeteer: ${results.filter(r => r.compatibility.puppeteer).length}
- Templates compatibles con Dynamic: ${results.filter(r => r.compatibility.dynamic).length}
- Templates compatibles con Classic: ${results.filter(r => r.compatibility.classic).length}

${broken > 0 ? `🚨 TEMPLATES ROTOS (requieren corrección inmediata):
${results.filter(r => r.status === 'broken').map(r => `- ${r.templateName} (${r.templateId})`).join('\n')}` : ''}

${needsFix > 0 ? `⚠️ TEMPLATES QUE NECESITAN CORRECCIÓN:
${results.filter(r => r.status === 'needs_fix').map(r => `- ${r.templateName} (${r.templateId}) - Score: ${r.qualityScore}/100`).join('\n')}` : ''}

✅ TEMPLATES PERFECTOS:
${results.filter(r => r.status === 'perfect').map(r => `- ${r.templateName} (${r.templateId}) - Score: ${r.qualityScore}/100`).join('\n')}
    `);
  }
  
  // ===== UTILITY FUNCTIONS =====
  
  private static calculateOptimalColumns(productsPerPage: number): number {
    if (productsPerPage <= 2) return 1;
    if (productsPerPage <= 4) return 2;
    if (productsPerPage <= 9) return 3;
    if (productsPerPage <= 16) return 4;
    return 5;
  }
  
  private static calculateContrast(color1: string, color2: string): number {
    const getLuminance = (color: string): number => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const adjustColor = (c: number): number => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      
      return 0.2126 * adjustColor(r) + 0.7152 * adjustColor(g) + 0.0722 * adjustColor(b);
    };
    
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    
    const brighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (brighter + 0.05) / (darker + 0.05);
  }
  
  private static generateAccentColor(primaryColor: string): string {
    const hex = primaryColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Rotar el hue para generar color complementario
    const newR = Math.min(255, Math.max(0, r + 30));
    const newG = Math.min(255, Math.max(0, g - 20));
    const newB = Math.min(255, Math.max(0, b + 40));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

// Función de conveniencia para ejecutar auditoría completa
export const auditAllTemplates = async (): Promise<AuditResult[]> => {
  return TemplateAuditSystem.auditAllTemplates();
};

// Función para auditar un template específico
export const auditTemplate = async (templateId: string): Promise<AuditResult | null> => {
  const template = getTemplateById(templateId);
  if (!template) return null;
  
  return TemplateAuditSystem.auditSingleTemplate(template);
};

// Función para generar templates corregidos
export const generateFixedTemplates = (auditResults: AuditResult[]): FixedTemplate[] => {
  return TemplateAuditSystem.generateFixedTemplates(auditResults);
};