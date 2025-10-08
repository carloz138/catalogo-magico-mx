import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Helmet } from "react-helmet";

interface BlogPostData {
  title: string;
  description: string;
  slug: string;
  date: string;
  author: string;
  category: string;
  image: string;
  keywords: string;
  content: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(false);

      // Importar el archivo específico
      const markdownFiles = import.meta.glob('/src/content/blog/*.md', { as: 'raw' });
      
      let foundPost: BlogPostData | null = null;

      for (const path in markdownFiles) {
        const content = await markdownFiles[path]();
        const parsed = parseMarkdown(content);
        
        if (parsed && parsed.slug === slug) {
          foundPost = parsed;
          break;
        }
      }

      if (foundPost) {
        setPost(foundPost);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Error loading post:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const parseMarkdown = (content: string): BlogPostData | null => {
    try {
      // Extraer frontmatter
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
      const match = content.match(frontmatterRegex);
      
      if (!match) return null;
      
      const frontmatterText = match[1];
      const markdownContent = match[2];
      
      const frontmatter: any = {};
      
      frontmatterText.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
          frontmatter[key.trim()] = value;
        }
      });

      return {
        title: frontmatter.title || "Sin título",
        description: frontmatter.description || "",
        slug: frontmatter.slug || "",
        date: frontmatter.date || new Date().toISOString(),
        author: frontmatter.author || "Anónimo",
        category: frontmatter.category || "General",
        image: frontmatter.image || "/placeholder.svg",
        keywords: frontmatter.keywords || "",
        content: markdownContent,
      };
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return null;
    }
  };

  const shareOnSocial = (platform: string) => {
    const url = window.location.href;
    const text = post?.title || "";
    
    const shareUrls: { [key: string]: string } = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando artículo...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Artículo no encontrado</p>
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{post.title} | Blog CatifyPro</title>
        <meta name="description" content={post.description} />
        <meta name="keywords" content={post.keywords} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:image" content={post.image} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />
        <meta name="twitter:image" content={post.image} />
        
        {/* Schema.org Article */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.description,
            "image": post.image,
            "datePublished": post.date,
            "author": {
              "@type": "Person",
              "name": post.author
            },
            "publisher": {
              "@type": "Organization",
              "name": "CatifyPro",
              "logo": {
                "@type": "ImageObject",
                "url": "https://catifypro.com/logo.png"
              }
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Botón volver */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 max-w-4xl py-4">
            <Link 
              to="/blog" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al blog
            </Link>
          </div>
        </div>

        {/* Header del artículo */}
        <article className="container mx-auto px-4 max-w-4xl py-12">
          <header className="mb-8">
            {/* Categoría */}
            <div className="mb-4">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                {post.category}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-8">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>
                  {new Date(post.date).toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {/* Botones compartir */}
            <div className="flex items-center gap-3 pb-8 border-b">
              <span className="text-gray-600 font-medium flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Compartir:
              </span>
              <button
                onClick={() => shareOnSocial('facebook')}
                className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                aria-label="Compartir en Facebook"
              >
                <Facebook className="w-5 h-5" />
              </button>
              <button
                onClick={() => shareOnSocial('twitter')}
                className="p-2 rounded-full hover:bg-sky-50 text-sky-600 transition-colors"
                aria-label="Compartir en Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              <button
                onClick={() => shareOnSocial('linkedin')}
                className="p-2 rounded-full hover:bg-blue-50 text-blue-700 transition-colors"
                aria-label="Compartir en LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
              <button
                onClick={() => shareOnSocial('whatsapp')}
                className="p-2 rounded-full hover:bg-green-50 text-green-600 transition-colors"
                aria-label="Compartir en WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
            </div>
          </header>

          {/* Contenido del artículo */}
          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:my-6 prose-li:my-2 prose-img:rounded-lg prose-img:shadow-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* CTA al final */}
          <div className="mt-16 bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-4">
              ¿Listo para crear tu catálogo digital?
            </h2>
            <p className="text-xl text-white/90 mb-6">
              Prueba CatifyPro gratis por 14 días. Sin tarjeta de crédito.
            </p>
            <Link
              to="/registro"
              className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Empezar gratis →
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
