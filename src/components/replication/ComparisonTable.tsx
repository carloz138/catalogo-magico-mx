export function ComparisonTable() {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 text-center border-2 border-green-200">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        ¡Catálogo 100% GRATUITO!
      </h3>
      <p className="text-lg text-gray-600 mb-4">
        Activa tu catálogo sin costo alguno y empieza a recibir cotizaciones de tus clientes
      </p>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-3xl mb-2">📦</div>
          <p className="font-semibold text-gray-900">Productos ilimitados</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-3xl mb-2">💰</div>
          <p className="font-semibold text-gray-900">Cotizaciones automáticas</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-3xl mb-2">📊</div>
          <p className="font-semibold text-gray-900">Analytics incluidos</p>
        </div>
      </div>
    </div>
  );
}
