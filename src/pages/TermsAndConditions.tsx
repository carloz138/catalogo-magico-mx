import { ScrollArea } from "@/components/ui/scroll-area";

const TermsAndConditions = () => {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-muted-foreground">
            Última actualización: [fecha]
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="prose prose-gray max-w-none text-foreground">
            <p className="text-lg leading-relaxed mb-6">
              Bienvenido a CatalogoIa ("la Plataforma"), un servicio propiedad de CatalogoIa S.A. de C.V. (en adelante "nosotros" o "la Empresa"). Al acceder o utilizar nuestros servicios, el usuario ("usted") acepta cumplir con los presentes Términos y Condiciones.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">1. Objeto del Servicio</h2>
              <p className="leading-relaxed">
                CatalogoIa ofrece una plataforma digital que permite a los usuarios crear catálogos de productos a partir de la información e imágenes que suben, remover fondos de imágenes, y generar imágenes mejoradas con inteligencia artificial.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">2. Registro y Cuenta de Usuario</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>El uso de la Plataforma está disponible para cualquier persona física mayor de edad y personas morales (empresas).</li>
                <li>El usuario es responsable de la veracidad y legalidad de la información y materiales que registre en la Plataforma.</li>
                <li>El usuario debe mantener la confidencialidad de su cuenta y contraseña.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">3. Responsabilidad del Usuario</h2>
              <p className="mb-3">El usuario se compromete a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usar la Plataforma de manera legal y conforme a lo establecido en estos Términos.</li>
                <li>Garantizar que cuenta con los derechos necesarios sobre los productos, imágenes y contenido que suba.</li>
                <li>No cargar contenido que infrinja derechos de autor, marcas registradas u otros derechos de terceros.</li>
                <li>No utilizar la Plataforma para actividades fraudulentas, engañosas o ilegales.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">4. Planes, Pagos y Facturación</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>CatalogoIa opera bajo un esquema de suscripciones y créditos.</li>
                <li>Todos los precios están expresados en pesos mexicanos (MXN) e incluyen impuestos aplicables, salvo que se indique lo contrario.</li>
                <li>El pago se procesa a través de proveedores externos de pago seguros (ej. Stripe, PayPal, tarjetas de crédito/débito).</li>
                <li>No se otorgan reembolsos por suscripciones o créditos adquiridos, salvo que la legislación mexicana obligue lo contrario.</li>
                <li>El usuario recibirá facturas electrónicas conforme a las disposiciones fiscales mexicanas (CFDI). Para ello, deberá proporcionar su RFC y datos de facturación correctos.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">5. Actividades Prohibidas</h2>
              <p className="mb-3">El usuario no podrá:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Subir contenido ilegal, ofensivo, difamatorio, discriminatorio o que atente contra la moral y buenas costumbres.</li>
                <li>Usar imágenes o contenido sobre el que no tenga derechos de uso.</li>
                <li>Intentar vulnerar la seguridad de la Plataforma, acceder sin autorización a cuentas de otros usuarios o manipular datos.</li>
                <li>Utilizar la Plataforma para fines que compitan con los servicios de CatalogoIa.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">6. Propiedad Intelectual</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Todo el software, código, diseños, marcas, logotipos y demás elementos de la Plataforma son propiedad exclusiva de CatalogoIa y están protegidos por las leyes mexicanas e internacionales de propiedad intelectual.</li>
                <li>El contenido que el usuario suba a la Plataforma seguirá siendo de su propiedad, pero otorga a CatalogoIa una licencia no exclusiva y limitada para usar dicho contenido con el único fin de operar el servicio.</li>
                <li>Las imágenes generadas con IA a través de la Plataforma pueden ser utilizadas por el usuario libremente, salvo que infrinjan derechos de terceros.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">7. Limitación de Responsabilidad</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>CatalogoIa no garantiza la disponibilidad ininterrumpida de la Plataforma.</li>
                <li>No nos hacemos responsables por pérdidas de información, daños indirectos, lucro cesante o uso indebido del servicio.</li>
                <li>El uso de la Plataforma es bajo riesgo del usuario.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">8. Privacidad y Protección de Datos</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>CatalogoIa recopila y procesa datos personales de acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México).</li>
                <li>El usuario puede consultar nuestro Aviso de Privacidad para conocer a detalle el uso de sus datos.</li>
                <li>CatalogoIa implementa medidas de seguridad técnicas y administrativas para proteger la información, pero no garantiza protección absoluta contra ataques cibernéticos.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">9. Modificaciones</h2>
              <p className="leading-relaxed">
                CatalogoIa podrá modificar en cualquier momento estos Términos y Condiciones, así como las tarifas y características del servicio. Los cambios entrarán en vigor desde su publicación en la Plataforma. El uso continuo de la Plataforma después de los cambios constituye aceptación de los mismos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">10. Legislación Aplicable y Jurisdicción</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Estos Términos y Condiciones se rigen por las leyes de los Estados Unidos Mexicanos.</li>
                <li>Cualquier controversia será resuelta ante los tribunales competentes de la Ciudad de Monterrey, Nuevo León, renunciando el usuario a cualquier otra jurisdicción que pudiera corresponder.</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </div>
    </main>
  );
};

export default TermsAndConditions;