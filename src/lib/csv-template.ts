export const generateCSVTemplate = () => {
  // Extended headers with backorder columns
  const headers = [
    'sku',
    'nombre',
    'precio',
    'precio_mayoreo',
    'descripcion',
    'categoria',
    'tags',
    'allow_backorder',
    'lead_time_days'
  ];
  
  const exampleRows = [
    ['PROD001', 'Camisa Azul Talla M', '299', '250', 'Camisa de algodón 100%', 'ropa', 'nuevo,algodón', 'false', '0'],
    ['PROD002', 'Zapatos Negros Talla 42', '899', '750', 'Zapatos de cuero genuino', 'calzado', 'cuero,premium', 'true', '14'],
    ['PROD003', 'Gorra Deportiva', '199', '150', 'Gorra ajustable con logo bordado', 'accesorios', 'deportivo', 'false', '0']
  ];
  
  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.join(','))
  ].join('\n');
  
  // Agregar BOM (Byte Order Mark) para UTF-8 para que Excel lea correctamente acentos y ñ
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_productos.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
