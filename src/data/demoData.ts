// src/data/demoData.ts

export type Industry = "ropa" | "ferreteria" | "acero" | "belleza" | "veterinaria";

interface IndustryData {
  label: string;
  currency: string;
  ticketPromedio: number;
  kpis: {
    ventas: number;
    cotizaciones: number;
    pendientes: number;
    tasaCierre: number;
  };
  chartData: { name: string; total: number; prediction: number }[];
  insights: {
    radar: string;
    search: string;
    forecast: string;
  };
}

export const DEMO_DATA: Record<Industry, IndustryData> = {
  ropa: {
    label: "Moda y Accesorios",
    currency: "MXN",
    ticketPromedio: 1200,
    kpis: { ventas: 154000, cotizaciones: 340, pendientes: 45, tasaCierre: 28 },
    chartData: Array.from({ length: 15 }, (_, i) => ({
      name: `Día ${i + 1}`,
      total: Math.floor(Math.random() * 5000) + 2000, // Ventas constantes
      prediction: Math.floor(Math.random() * 5000) + 2500,
    })),
    insights: {
      radar: "Alta demanda detectada en 'Chamarras de Piel' en tu zona.",
      search: "Término más buscado: 'Vestido Rojo Talla M'.",
      forecast: "Tendencia estacional: Prepara stock de invierno.",
    },
  },
  ferreteria: {
    label: "Ferretería Industrial",
    currency: "MXN",
    ticketPromedio: 4500,
    kpis: { ventas: 890000, cotizaciones: 120, pendientes: 15, tasaCierre: 65 },
    chartData: Array.from({ length: 15 }, (_, i) => ({
      name: `Día ${i + 1}`,
      total: Math.floor(Math.random() * 50000) + 10000, // Picos altos (proyectos grandes)
      prediction: Math.floor(Math.random() * 50000) + 12000,
    })),
    insights: {
      radar: "Oportunidad: Tus competidores no tienen 'Taladro Bosch 500w'.",
      search: "Cliente buscó 15 veces 'Tubería PVC 2pulg'.",
      forecast: "Demanda estable. Sugerencia: Pack de herramientas.",
    },
  },
  acero: {
    label: "Comercializadora de Acero",
    currency: "USD",
    ticketPromedio: 25000,
    kpis: { ventas: 4500000, cotizaciones: 45, pendientes: 8, tasaCierre: 40 },
    chartData: Array.from({ length: 15 }, (_, i) => ({
      name: `Día ${i + 1}`,
      total: i % 5 === 0 ? 150000 : 0, // Ventas espaciadas pero gigantes
      prediction: 0,
    })),
    insights: {
      radar: "Precio del acero subiendo en mercado global.",
      search: "Buscan 'Viga IPR' masivamente.",
      forecast: "Se predice una venta grande el próximo martes basado en historial.",
    },
  },
  belleza: {
    label: "Cosméticos y Belleza",
    currency: "MXN",
    ticketPromedio: 600,
    kpis: { ventas: 45000, cotizaciones: 600, pendientes: 120, tasaCierre: 15 },
    chartData: Array.from({ length: 15 }, (_, i) => ({
      name: `Día ${i + 1}`,
      total: Math.floor(Math.random() * 2000) + 500, // Ventas hormiga
      prediction: Math.floor(Math.random() * 2000) + 800,
    })),
    insights: {
      radar: "Tendencia viral: 'Labiales Matte' agotándose.",
      search: "Búsquedas fallidas: 'Serum Ácido Hialurónico'.",
      forecast: "Pico de ventas esperado para fin de semana.",
    },
  },
  veterinaria: {
    label: "Distribuidora Veterinaria",
    currency: "MXN",
    ticketPromedio: 3200,
    kpis: { ventas: 210000, cotizaciones: 85, pendientes: 12, tasaCierre: 55 },
    chartData: Array.from({ length: 15 }, (_, i) => ({
      name: `Día ${i + 1}`,
      total: Math.floor(Math.random() * 15000) + 3000,
      prediction: Math.floor(Math.random() * 16000) + 3000,
    })),
    insights: {
      radar: "Escasez de vacunas en la región detectada.",
      search: "Alto interés en 'Alimento Premium Raza Grande'.",
      forecast: "Re-stock sugerido de antipulgas.",
    },
  },
};
