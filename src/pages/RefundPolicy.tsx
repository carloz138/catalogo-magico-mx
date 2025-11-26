import { ScrollArea } from "@/components/ui/scroll-area";
import ComplianceFooter from "@/components/layout/ComplianceFooter";

const RefundPolicy = () => {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Política de Reembolsos y Cancelaciones
            </h1>
            <p className="text-muted-foreground">
              Última actualización: Enero 2025
            </p>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="prose prose-gray max-w-none text-foreground">
              <p className="text-lg leading-relaxed mb-6">
                En CatifyPro valoramos la transparencia y claridad con nuestros usuarios. A continuación se detalla nuestra política de reembolsos y cancelaciones.
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">1. Cancelaciones</h2>
                <p className="leading-relaxed mb-3">
                  Las cancelaciones de pedidos están permitidas siempre y cuando el producto no haya sido enviado.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Si el producto aún no ha sido despachado, puede solicitar la cancelación del pedido sin costo adicional.</li>
                  <li>Una vez que el producto haya sido enviado, no se podrán procesar cancelaciones, pero puede aplicar a devolución según las reglas de cada vendedor.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">2. Devoluciones</h2>
                <p className="leading-relaxed mb-3">
                  Las devoluciones están sujetas a las políticas específicas de cada vendedor:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cada vendedor establece sus propias condiciones de devolución.</li>
                  <li>El producto debe estar en su estado original, sin uso, y con su empaque intacto para ser elegible para devolución.</li>
                  <li>Se recomienda contactar al vendedor directamente para conocer sus términos específicos de devolución.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">3. Reembolsos</h2>
                <p className="leading-relaxed mb-3">
                  Los reembolsos aprobados se procesarán de la siguiente manera:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Los reembolsos tardan de 5 a 15 días hábiles en reflejarse en su cuenta, dependiendo de su institución bancaria.</li>
                  <li>El monto reembolsado será el correspondiente al valor del producto devuelto o cancelado.</li>
                  <li>Los reembolsos se realizarán al mismo método de pago utilizado en la compra original.</li>
                </ul>
              </section>

              <section className="mb-8 bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
                <h2 className="text-2xl font-semibold text-amber-900 dark:text-amber-400 mb-4">
                  IMPORTANTE: Tarifa de Blindaje de Pago Seguro
                </h2>
                <div className="space-y-3">
                  <p className="leading-relaxed font-medium">
                    En caso de reembolso total o cancelación aprobada, la "Tarifa de Blindaje de Pago Seguro" NO es reembolsable.
                  </p>
                  <p className="leading-relaxed">
                    Esta tarifa corresponde al servicio de procesamiento, infraestructura de seguridad bancaria, soporte técnico de pagos y monitoreo antifraude que ya fue prestado al momento de realizar la transacción.
                  </p>
                  <p className="leading-relaxed">
                    Al realizar un pago, el usuario acepta que esta tarifa cubre servicios de seguridad financiera que se ejecutan inmediatamente y, por lo tanto, no son recuperables incluso si se cancela o reembolsa el pedido principal.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">4. Excepciones</h2>
                <p className="leading-relaxed mb-3">
                  Existen casos especiales en los que se pueden aplicar políticas diferentes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Productos defectuosos o dañados al momento de la entrega pueden ser elegibles para reembolso completo incluyendo envío.</li>
                  <li>Errores en la descripción del producto por parte del vendedor.</li>
                  <li>Productos que no coincidan con lo mostrado en el catálogo.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">5. Cómo Solicitar un Reembolso</h2>
                <p className="leading-relaxed mb-3">
                  Para solicitar un reembolso o cancelación:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Contacte a nuestro equipo de soporte a través de soporte@catifypro.com</li>
                  <li>Proporcione su número de pedido y motivo de la solicitud.</li>
                  <li>Nuestro equipo evaluará su caso y responderá en un plazo máximo de 48 horas hábiles.</li>
                  <li>Si se aprueba, se procesará el reembolso según los tiempos establecidos.</li>
                </ol>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">6. Contacto</h2>
                <p className="leading-relaxed">
                  Para cualquier duda o aclaración sobre nuestra política de reembolsos, puede contactarnos en:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li><strong>Email:</strong> soporte@catifypro.com</li>
                  <li><strong>Teléfono:</strong> (81) 1990-8243</li>
                  <li><strong>Horario:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM</li>
                </ul>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
      <ComplianceFooter />
    </main>
  );
};

export default RefundPolicy;
