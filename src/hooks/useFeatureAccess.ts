import { useSubscription } from '@/contexts/SubscriptionContext';
import { UpsellBanner } from '@/components/subscription/UpsellBanner'; // Crearemos este en el Paso 5

// Definimos las "llaves" de nuestras features premium
export type FeatureKey = 'radar_inteligente' | 'recomendaciones' | 'predictivo';

type FeatureConfig = {
  [key in FeatureKey]: {
    featureName: string;
    requiredPlan: string;
    description: string;
  };
};

// Configuración centralizada de tus features (para los banners de upsell)
// Esto hace que cambiar el texto de marketing sea muy fácil
const FEATURE_CONFIG: FeatureConfig = {
  radar_inteligente: {
    featureName: 'Radar de Mercado Inteligente',
    requiredPlan: 'Básico IA ($299 MXN)',
    description: 'Analiza tendencias, estacionalidad y demanda con nuestra Nube de Palabras IA.',
  },
  recomendaciones: {
    featureName: 'IA de Recomendaciones',
    requiredPlan: 'Profesional IA ($599 MXN)',
    description: 'Aumenta tus ventas con sugerencias de productos basadas en IA en cada cotización.',
  },
  predictivo: {
    featureName: 'Análisis Predictivo',
    requiredPlan: 'Empresarial IA ($1,299 MXN)',
    description: 'Adelántate al mercado con análisis predictivo de demanda y estacionalidad.',
  },
};

/**
 * Hook para controlar el acceso a features premium.
 * Devuelve si el usuario tiene acceso y un componente de Upsell
 * listo para renderizar si no lo tiene.
 */
export const useFeatureAccess = (feature: FeatureKey) => {
  const { hasAccess, loading } = useSubscription();
  
  // Obtenemos la configuración del banner para esta feature
  const config = FEATURE_CONFIG[feature];

  const isAllowed = hasAccess(feature);

  return {
    isAllowed, // boolean: ¿Tiene acceso?
    loading,   // boolean: ¿Está cargando el plan del usuario?
    
    // Un componente de "reemplazo" listo para usar
    UpsellComponent: (
      <UpsellBanner
        featureName={config.featureName}
        description={config.description}
        requiredPlan={config.requiredPlan}
      />
    ),
  };
};
