import { ScrollArea } from "@/components/ui/scroll-area";
import ComplianceFooter from "@/components/layout/ComplianceFooter";

const PrivacyPolicy = () => {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Aviso de Privacidad</h1>
            <p className="text-muted-foreground">Última actualización: Enero 2025</p>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="prose prose-gray max-w-none text-foreground">
              <p className="text-lg leading-relaxed mb-6">
                En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares,
                CatalogoIa S.A. de C.V. (en adelante "CatalogoIa" o "nosotros"), con domicilio en [tu dirección fiscal
                en México], hace de su conocimiento el presente Aviso de Privacidad.
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">1. Datos personales que recabamos</h2>
                <p className="mb-3">Podemos recopilar las siguientes categorías de datos personales:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Datos de identificación:</strong> nombre, correo electrónico, número telefónico, razón
                    social, RFC.
                  </li>
                  <li>
                    <strong>Datos de pago:</strong> información de facturación y datos bancarios procesados por terceros
                    autorizados (no almacenamos datos de tarjetas).
                  </li>
                  <li>
                    <strong>Datos de uso:</strong> información sobre cómo interactúa con la Plataforma, preferencias,
                    historial de actividad.
                  </li>
                  <li>
                    <strong>Contenido del usuario:</strong> imágenes, productos, catálogos o información que el usuario
                    suba voluntariamente a la Plataforma.
                  </li>
                </ul>
                <p className="mt-3 leading-relaxed">No recabamos datos personales sensibles de manera intencional.</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">2. Finalidades del tratamiento de datos</h2>
                <p className="mb-3">Los datos personales serán utilizados para las siguientes finalidades:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Proveer los servicios contratados en la Plataforma.</li>
                  <li>Procesar pagos, generar facturación y administrar suscripciones.</li>
                  <li>
                    Generar catálogos e imágenes con inteligencia artificial a partir del contenido que el usuario
                    cargue.
                  </li>
                  <li>Brindar soporte técnico y atención al cliente.</li>
                  <li>Mejorar nuestros servicios y funcionalidades.</li>
                  <li>
                    Enviar notificaciones sobre actualizaciones, promociones o cambios en el servicio (el usuario puede
                    cancelar estas comunicaciones en cualquier momento).
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">3. Transferencia de datos</h2>
                <p className="mb-3">CatalogoIa no vende ni renta datos personales a terceros.</p>
                <p className="mb-3">Únicamente podremos compartir datos con:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Proveedores de servicios tecnológicos y de pago (ej. servidores en la nube, pasarelas de pago).
                  </li>
                  <li>Autoridades competentes en caso de requerimiento legal.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">4. Medidas de seguridad</h2>
                <p className="leading-relaxed">
                  CatalogoIa adopta medidas de seguridad administrativas, técnicas y físicas para proteger sus datos
                  personales contra pérdida, acceso no autorizado, alteración o divulgación indebida.
                </p>
                <p className="leading-relaxed mt-3">
                  No obstante, el usuario entiende que ningún sistema es 100% seguro frente a ataques cibernéticos.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">5. Derechos ARCO</h2>
                <p className="mb-3">Usted tiene derecho a:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Acceder</strong> a sus datos personales que tenemos.
                  </li>
                  <li>
                    <strong>Rectificar</strong> la información en caso de ser inexacta o incompleta.
                  </li>
                  <li>
                    <strong>Cancelar</strong> sus datos cuando considere que no se requieren para alguna de las
                    finalidades señaladas.
                  </li>
                  <li>
                    <strong>Oponerse</strong> al tratamiento de sus datos para fines específicos.
                  </li>
                </ul>
                <p className="mt-3 leading-relaxed">
                  Para ejercer sus derechos ARCO, el usuario puede enviar un correo a: [tu correo de contacto] indicando
                  su solicitud y acompañando identificación oficial.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">6. Uso de cookies y tecnologías similares</h2>
                <p className="leading-relaxed">
                  CatalogoIa puede utilizar cookies y tecnologías similares para mejorar la experiencia de usuario y
                  analizar el uso de la Plataforma. El usuario puede deshabilitar cookies desde su navegador, aunque
                  algunas funciones podrían no estar disponibles.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">7. Modificaciones al Aviso de Privacidad</h2>
                <p className="leading-relaxed">
                  CatalogoIa podrá modificar el presente Aviso de Privacidad en cualquier momento. Las modificaciones
                  estarán disponibles en la Plataforma y entrarán en vigor a partir de su publicación.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-primary mb-4">8. Contacto</h2>
                <p className="mb-3">Si tiene dudas sobre este Aviso de Privacidad, puede contactarnos en:</p>
                <ul className="list-none space-y-2">
                  <li>
                    <strong>Correo electrónico:</strong> soporte@catifypro.com
                  </li>
                  <li>
                    <strong>Domicilio:</strong> Monte Blanco 119, Francisco G Sada, San Nicolás De Los Garza, Nuevo León
                  </li>
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

export default PrivacyPolicy;
