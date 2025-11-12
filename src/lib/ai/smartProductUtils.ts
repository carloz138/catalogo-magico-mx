// Lista de palabras vacías en español (Stopwords) que queremos ignorar
const SPANISH_STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'si',
  'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'entre',
  'mi', 'tu', 'su', 'sus', 'es', 'son', 'fue', 'era', 'muy', 'mas', 'más',
  'que', 'qué', 'este', 'esta', 'estos', 'estas', 'todo', 'toda', 'todos', 'todas',
  'cual', 'quien', 'donde', 'cuando', 'como', 'cm', 'mm', 'kg', 'gr', 'ml', 'pz', 'pza'
]);

/**
 * Genera tags sugeridos analizando un texto (título + descripción)
 */
export const generateSmartTags = (text: string): string[] => {
  if (!text) return [];

  // 1. Normalizar: minúsculas, quitar acentos básicos si prefieres (opcional), quitar puntuación
  const normalized = text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Quitar puntuación
    .replace(/\s{2,}/g, " "); // Quitar espacios dobles

  // 2. Tokenizar (separar palabras)
  const words = normalized.split(" ");

  // 3. Filtrar: quitar stopwords, números solos y palabras cortas
  const tags = words.filter(w => 
    w.length > 2 && 
    !SPANISH_STOPWORDS.has(w) &&
    isNaN(Number(w)) // Ignorar números puros (ej. precios o cantidades sueltas)
  );

  // 4. Únicos y limitar cantidad (top 8 para no saturar)
  return Array.from(new Set(tags)).slice(0, 8);
};
