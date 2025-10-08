import { useState, useEffect } from "react";
import { BlogCard } from "@/components/BlogCard";
import { Search } from "lucide-react";

interface BlogPost {
  title: string;
  description: string;
  slug: string;
  date: string;
  author: string;
  category: string;
  image: string;
  keywords: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [selectedCategory, searchQuery, posts]);

  const loadBlogPosts = async () => {
    try {
      // Importar todos los archivos .md de la carpeta blog
      const markdownFiles = import.meta.glob('/src/content/blog/*.md', { as: 'raw' });
      
      const loadedPosts: BlogPost[] = [];
      
      for (const path in markdownFiles) {
        const content = await markdownFiles[path]();
        const post = parseMarkdown(content, path);
        if (post) loadedPosts.push(post);
      }

      // Ordenar por fecha (más reciente primero)
      loadedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setPosts(loadedPosts);
      
      // Extraer categorías únicas
      const uniqueCategories = Array.from(new Set(loadedPosts.map(p => p.category)));
      setCategories(["Todas", ...uniqueCategories]);
      
    } catch (error) {
      console.error("Error loading blog posts:", error);
    }
  };

  const parseMarkdown = (content: string, path: string): BlogPost | null => {
    try {
      // Extraer frontmatter (entre --- y ---)
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
      const match = content.match(frontmatterRegex);
      
      if (!match) return null;
      
      const frontmatterText = match[1];
      const frontmatter: any = {};
      
      // Parse simple del frontmatter
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
      };
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return null;
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    // Filtrar por categoría
    if (selectedCategory !== "Todas") {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.keywords.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Blog de CatifyPro
          </h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Guías, estrategias y consejos para crear catálogos digitales que convierten.
            Todo lo que necesitas saber para vender más.
          </p>
        </div>
      </section>

      {/* Filtros y Búsqueda */}
      <section className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 max-w-6xl py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Categorías */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Búsqueda */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar artículos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid de artículos */}
      <section className="container mx-auto px-4 max-w-6xl py-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">
              {searchQuery || selectedCategory !== "Todas" 
                ? "No se encontraron artículos con estos filtros." 
                : "Aún no hay artículos publicados."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Mostrando <span className="font-semibold">{filteredPosts.length}</span> artículo{filteredPosts.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <BlogCard key={post.slug} {...post} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
