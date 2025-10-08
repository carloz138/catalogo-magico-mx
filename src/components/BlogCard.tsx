import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight } from "lucide-react";

interface BlogCardProps {
  title: string;
  description: string;
  slug: string;
  date: string;
  author: string;
  category: string;
  image: string;
}

export const BlogCard = ({
  title,
  description,
  slug,
  date,
  author,
  category,
  image,
}: BlogCardProps) => {
  return (
    <Link to={`/blog/${slug}`} className="group">
      <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 h-full flex flex-col">
        {/* Imagen */}
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 left-4">
            <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
              {category}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(date).toLocaleDateString('es-MX', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{author}</span>
            </div>
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Descripción */}
          <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
            {description}
          </p>

          {/* CTA */}
          <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
            Leer más
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
};
