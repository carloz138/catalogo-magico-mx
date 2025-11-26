import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const ComplianceFooter = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Información de Contacto y Datos de Negocio */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Monte Blanco 119, Francisco G Sada, San Nicolás De Los Garza, Nuevo León</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:soporte@catifypro.com" className="hover:text-white transition-colors">
                  soporte@catifypro.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:8119908243" className="hover:text-white transition-colors">
                  (81) 1990-8243
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Lunes a Viernes<br />9:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Producto</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/why-subscribe" className="hover:text-white transition-colors">
                  Características
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="hover:text-white transition-colors">
                  Precios
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <a href="mailto:soporte@catifypro.com" className="hover:text-white transition-colors">
                  Soporte
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition-colors">
                  Aviso de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/politica-de-reembolsos" className="hover:text-white transition-colors">
                  Política de Reembolsos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Métodos de Pago Aceptados */}
        <div className="border-t border-slate-900 pt-8 mb-8">
          <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest text-center">
            Métodos de Pago Aceptados
          </h4>
          <div className="flex justify-center items-center gap-6 flex-wrap">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
              alt="Visa"
              className="h-8 opacity-70 hover:opacity-100 transition-opacity"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
              alt="MasterCard"
              className="h-8 opacity-70 hover:opacity-100 transition-opacity"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo_%282018%29.svg"
              alt="American Express"
              className="h-8 opacity-70 hover:opacity-100 transition-opacity"
            />
            <div className="text-white font-bold text-lg opacity-70 hover:opacity-100 transition-opacity">
              CARNET
            </div>
          </div>
        </div>

        {/* Información Legal y Divisa */}
        <div className="border-t border-slate-900 pt-8 text-center space-y-2">
          <p className="text-sm font-semibold text-white">
            Precios expresados en Moneda Nacional (MXN)
          </p>
          <p className="text-xs opacity-60">
            © 2025 CatifyPro. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default ComplianceFooter;
