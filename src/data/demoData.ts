import { addDays, subDays } from "date-fns";

export type Industry = "ropa" | "ferreteria" | "acero" | "belleza" | "veterinaria";

// Función auxiliar para generar datos falsos de la gráfica
const generateMainChartData = (baseAmount: number, volatility: number) => {
  const historyDays = 30;
  const history = Array.from({ length: historyDays }, (_, i) => {
    const randomVar = (Math.random() - 0.5) * volatility;
    return {
      name: `Día ${i + 1}`,
      total: Math.max(0, Math.floor(baseAmount + randomVar)),
      prediction: null
    };
  });
  const lastRealVal = history[history.length - 1].total || baseAmount;
  if(history.length > 0) history[history.length - 1].prediction = lastRealVal;

  const future = Array.from({ length: 7 }, (_, i) => {
    const trend = baseAmount * (1 + (i * 0.05));
    return {
      name: `Proy ${i + 1}`,
      total: null,
      prediction: Math.floor(trend)
    };
  });
  return [...history, ...future];
};

export const DEMO_DATA = {
  ropa: {
    label: "Moda & Accesorios",
    colors: { primary: "#db2777" },
    kpis: { ventas: 154000, cotizaciones: 340, pendientes: 45, tasaCierre: 28 },
    mainChartData: generateMainChartData(5000, 2000), 
    // NUEVO: Valor de la oportunidad perdida para el Banner Grande
    opportunityValue: 45000, 
    radar: [
      { id: "1", producto_nombre: "Vestido Noche Rojo", cantidad: 5, cliente: "Boutique Lomas", status: "urgente", potential: 12500 },
      { id: "2", producto_nombre: "Cinturón Cuero Café", cantidad: 20, cliente: "Moda Homs", status: "nuevo", potential: 8000 },
    ],
    searchTerms: [
      { term: "Vestido Verano", count: 120, zeroResults: 0 },
      { term: "Chamarra Piel", count: 85, zeroResults: 45 },
      { term: "Talla XL", count: 60, zeroResults: 0 },
    ],
    forecastHistory: Array.from({ length: 60 }, (_, i) => ({
      date: subDays(new Date(), 60 - i).toISOString(),
      count: Math.floor(Math.random() * 50) + 20
    })),
    products: [
      { id: "1", name: "Vestido Floral Verano", price_retail: 85000, category: "Vestidos", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=400&auto=format&fit=crop" },
      { id: "2", name: "Jeans Slim Fit", price_retail: 120000, category: "Pantalones", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=400&auto=format&fit=crop" },
      { id: "3", name: "Blusa Seda Blanca", price_retail: 65000, category: "Tops", image: "https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?q=80&w=400&auto=format&fit=crop" },
      { id: "4", name: "Chamarra Mezclilla", price_retail: 150000, category: "Chamarras", image: "https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?q=80&w=400&auto=format&fit=crop" },
    ]
  },
  ferreteria: {
    label: "Ferretería Industrial",
    colors: { primary: "#ea580c" },
    kpis: { ventas: 890000, cotizaciones: 120, pendientes: 15, tasaCierre: 65 },
    mainChartData: generateMainChartData(25000, 15000),
    opportunityValue: 120000,
    radar: [
      { id: "1", producto_nombre: "Taladro Industrial Bosch", cantidad: 2, cliente: "Construcciones SA", status: "urgente", potential: 8500 },
      { id: "2", producto_nombre: "Tubería PVC 4in", cantidad: 100, cliente: "Ing. Pedro", status: "nuevo", potential: 45000 },
    ],
    searchTerms: [
      { term: "Cemento gris", count: 450, zeroResults: 0 },
      { term: "Llave inglesa", count: 120, zeroResults: 5 },
      { term: "Generador eléctrico", count: 80, zeroResults: 80 },
    ],
    forecastHistory: Array.from({ length: 60 }, (_, i) => ({
      date: subDays(new Date(), 60 - i).toISOString(),
      count: Math.floor(Math.random() * 200) + 100
    })),
    products: [
      { id: "1", name: "Taladro Percutor 500W", price_retail: 185000, category: "Herramientas", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=400&auto=format&fit=crop" },
      { id: "2", name: "Juego Desarmadores", price_retail: 45000, category: "Manuales", image: "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?q=80&w=400&auto=format&fit=crop" },
      { id: "3", name: "Lijadora Orbital", price_retail: 120000, category: "Herramientas", image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=400&auto=format&fit=crop" },
      { id: "4", name: "Casco Seguridad", price_retail: 25000, category: "Seguridad", image: "https://images.unsplash.com/photo-1585832770485-e68a5dbfad52?q=80&w=400&auto=format&fit=crop" },
    ]
  },
  acero: {
    label: "Aceros & Estructuras",
    colors: { primary: "#475569" },
    kpis: { ventas: 4500000, cotizaciones: 45, pendientes: 8, tasaCierre: 40 },
    mainChartData: generateMainChartData(150000, 50000),
    opportunityValue: 850000,
    radar: [
      { id: "1", producto_nombre: "Viga IPR 6x4", cantidad: 50, cliente: "Grupo Vertical", status: "urgente", potential: 450000 },
    ],
    searchTerms: [
      { term: "Varilla corrugada", count: 800, zeroResults: 0 },
      { term: "PTR 4x4", count: 300, zeroResults: 20 },
      { term: "Lámina galvanizada", count: 150, zeroResults: 0 },
    ],
    forecastHistory: Array.from({ length: 60 }, (_, i) => ({
      date: subDays(new Date(), 60 - i).toISOString(),
      count: i % 7 === 0 ? 500 : 50
    })),
    products: [
      { id: "1", name: "Viga IPR Estructural", price_retail: 4500000, category: "Estructural", image: "https://images.unsplash.com/photo-1535813547-99c456a41d4a?q=80&w=400&auto=format&fit=crop" },
      { id: "2", name: "Varilla 3/8 Tonelada", price_retail: 1800000, category: "Construcción", image: "https://images.unsplash.com/photo-1626863004868-b7eb462b55b6?q=80&w=400&auto=format&fit=crop" },
      { id: "3", name: "PTR 4x4 Calibre 14", price_retail: 85000, category: "Perfiles", image: "https://images.unsplash.com/photo-1518709414768-a88981a45e5d?q=80&w=400&auto=format&fit=crop" },
      { id: "4", name: "Lámina Acanalada", price_retail: 45000, category: "Láminas", image: "https://images.unsplash.com/photo-1513467535987-fd81bc7d7cd3?q=80&w=400&auto=format&fit=crop" },
    ]
  },
  belleza: {
    label: "Cosméticos",
    colors: { primary: "#7c3aed" },
    kpis: { ventas: 45000, cotizaciones: 600, pendientes: 120, tasaCierre: 15 },
    mainChartData: generateMainChartData(2000, 500),
    opportunityValue: 18000,
    radar: [{ id: "1", producto_nombre: "Serum Vitamina C", cantidad: 10, cliente: "Spa Center", status: "nuevo", potential: 4500 }],
    searchTerms: [
      { term: "Labial Matte", count: 1200, zeroResults: 0 },
      { term: "Rimel Waterproof", count: 800, zeroResults: 50 },
      { term: "Ácido Hialurónico", count: 600, zeroResults: 600 },
    ],
    forecastHistory: Array.from({ length: 60 }, (_, i) => ({
      date: subDays(new Date(), 60 - i).toISOString(),
      count: Math.floor(Math.random() * 1000) + 500
    })),
    products: [
      { id: "1", name: "Kit Labiales Nude", price_retail: 45000, category: "Labios", image: "https://images.unsplash.com/photo-1571781535469-fec2c4125d0d?q=80&w=400&auto=format&fit=crop" },
      { id: "2", name: "Paleta Sombras", price_retail: 85000, category: "Ojos", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=400&auto=format&fit=crop" },
      { id: "3", name: "Base Maquillaje", price_retail: 65000, category: "Rostro", image: "https://images.unsplash.com/photo-1596462502278-27bfdd403348?q=80&w=400&auto=format&fit=crop" },
      { id: "4", name: "Brochas Profesionales", price_retail: 120000, category: "Accesorios", image: "https://images.unsplash.com/photo-1596462502278-27bfdd403348?q=80&w=400&auto=format&fit=crop" },
    ]
  },
  veterinaria: {
    label: "Distribuidora Vet",
    colors: { primary: "#059669" },
    kpis: { ventas: 210000, cotizaciones: 85, pendientes: 12, tasaCierre: 55 },
    mainChartData: generateMainChartData(8000, 2000),
    opportunityValue: 35000,
    radar: [{ id: "1", producto_nombre: "Vacuna Parvovirus", cantidad: 50, cliente: "Vet San José", status: "urgente", potential: 12000 }],
    searchTerms: [
      { term: "Croquetas Adulto", count: 300, zeroResults: 0 },
      { term: "Antipulgas", count: 150, zeroResults: 20 },
      { term: "Collar Isabelino", count: 40, zeroResults: 40 },
    ],
    forecastHistory: Array.from({ length: 60 }, (_, i) => ({
      date: subDays(new Date(), 60 - i).toISOString(),
      count: Math.floor(Math.random() * 100) + 50
    })),
    products: [
      { id: "1", name: "Alimento Premium 20kg", price_retail: 120000, category: "Alimento", image: "https://images.unsplash.com/photo-1589924691195-41432c84c161?q=80&w=400&auto=format&fit=crop" },
      { id: "2", name: "Pipeta Antipulgas", price_retail: 35000, category: "Medicina", image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=400&auto=format&fit=crop" },
      { id: "3", name: "Shampoo Hipoalergénico", price_retail: 25000, category: "Higiene", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=400&auto=format&fit=crop" },
      { id: "4", name: "Juguete Morder", price_retail: 15000, category: "Accesorios", image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=400&auto=format&fit=crop" },
    ]
  }
};
