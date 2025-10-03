export const generateCSVTemplate = () => {
  const headers = ['sku', 'nombre', 'precio', 'precio_mayoreo', 'descripcion', 'categoria'];
  
  const exampleRows = [
    ['PROD001', 'Camisa Azul Talla M', '299', '250', 'Camisa de algodón 100%', 'ropa'],
    ['PROD002', 'Zapatos Negros Talla 42', '899', '750', 'Zapatos de cuero genuino', 'calzado'],
    ['PROD003', 'Gorra Deportiva', '199', '150', 'Gorra ajustable con logo bordado', 'accesorios']
  ];
  
  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_productos.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
