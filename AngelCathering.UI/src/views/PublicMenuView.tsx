import React, { useEffect, useState } from "react";
import { useSiteContent } from "@/context/ContentContext";
import { api, type MenuCategory } from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Phone, Mail, Clock, MapPin, 
  Leaf, Flower2, HeartHandshake, ShieldCheck
} from "lucide-react";

export const PublicMenuView: React.FC<{ onGoToLogin: () => void }> = ({ onGoToLogin }) => {
  const { content } = useSiteContent();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    api.getPublicMenu()
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0].idCategory);
      })
      .catch((err) => console.error("Error al cargar menú:", err))
      .finally(() => setLoading(false));
  }, []);

  const activeCategory = categories.find((c) => c.idCategory === selectedCategory) || categories[0];

  return (
    <div className="min-h-screen bg-boho-bg text-boho-text flex flex-col font-sans-boho selection:bg-terracotta-200">
      {/* Header BoHo */}
      <header className="border-b border-boho-border-subtle bg-boho-bg/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-boho-surface border border-boho-border text-terracotta-600 flex items-center justify-center shadow-xs">
              <Flower2 className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div>
              <span className="font-serif-boho text-2xl font-bold tracking-wide text-boho-text-title block leading-tight">
                {content.branding.businessName}
              </span>
              <span className="text-[11px] uppercase tracking-widest text-boho-text-light font-medium hidden sm:block">
                Monterrey • Eventos &amp; Banquetes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${content.contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="outline" className="border-sage-500 text-sage-700 hover:bg-sage-50 rounded-full px-4">
                <Phone className="h-3.5 w-3.5 mr-1.5 text-sage-500" /> WhatsApp
              </Button>
            </a>
            <Button size="sm" variant="ghost" onClick={onGoToLogin} className="text-boho-text-light hover:text-boho-text rounded-full text-xs">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Panel Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner BoHo */}
      <section className="relative overflow-hidden bg-gradient-to-b from-boho-surface via-boho-bg to-boho-bg py-20 px-6 border-b border-boho-border-subtle">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 bg-boho-bg border border-boho-border px-4 py-1.5 rounded-full shadow-2xs">
            <Leaf className="h-3.5 w-3.5 text-sage-500" />
            <span className="text-xs uppercase tracking-widest font-semibold text-terracotta-700">
              Catering de Autor en Monterrey, N.L.
            </span>
          </div>

          <h1 className="font-serif-boho text-5xl md:text-6xl font-normal tracking-tight text-boho-text-title leading-[1.15]">
            {content.branding.tagline}
          </h1>

          <p className="text-base md:text-lg text-boho-text-muted max-w-2xl mx-auto leading-relaxed font-normal">
            {content.branding.shortDescription}
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4 text-xs text-boho-text-muted">
            <div className="flex items-center gap-1.5 bg-white/80 border border-boho-border px-4 py-2 rounded-full shadow-2xs">
              <MapPin className="h-4 w-4 text-terracotta-600" />
              <span className="font-medium">{content.contact.city}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/80 border border-boho-border px-4 py-2 rounded-full shadow-2xs">
              <Clock className="h-4 w-4 text-sage-500" />
              <span className="font-medium">{content.contact.hours}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Menú y Catálogo */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 w-full">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs uppercase tracking-widest font-bold text-terracotta-600">Experiencias Gastronómicas</span>
          <h2 className="font-serif-boho text-4xl md:text-5xl font-medium tracking-tight text-boho-text-title">
            {content.publicMenuSection.title}
          </h2>
          <p className="text-boho-text-muted max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            {content.publicMenuSection.subtitle}
          </p>
          <div className="w-16 h-0.5 bg-terracotta-500/40 mx-auto mt-4 rounded-full" />
        </div>

        {/* Filtros de Categorías BoHo */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2.5 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.idCategory}
                onClick={() => setSelectedCategory(cat.idCategory)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat.idCategory
                    ? "bg-terracotta-600 text-boho-bg shadow-xs scale-105"
                    : "bg-boho-surface/70 text-boho-text hover:bg-boho-surface border border-boho-border"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Lista de Platillos */}
        {loading ? (
          <div className="text-center py-24 text-boho-text-light">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-600 mb-3" />
            <p className="font-serif-boho text-lg">Cargando menú artesanal...</p>
          </div>
        ) : !activeCategory || activeCategory.items.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-boho-border">
            <Flower2 className="h-10 w-10 text-boho-border mx-auto mb-2 stroke-1" />
            <p className="text-boho-text-muted">No hay platillos disponibles en esta categoría en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeCategory.items.map((item) => (
              <Card 
                key={item.idItem} 
                className="overflow-hidden flex flex-col bg-boho-card border border-boho-border shadow-2xs hover:shadow-md transition-all duration-300 rounded-2xl group"
              >
                {item.imageUrl ? (
                  <div className="h-56 w-full overflow-hidden bg-boho-surface relative">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-boho-bg/95 backdrop-blur-xs px-3 py-1 rounded-full text-sm font-serif-boho font-bold text-terracotta-700 shadow-xs border border-boho-border">
                      ${Number(item.price).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div className="h-40 bg-boho-surface/60 flex items-center justify-center text-boho-border">
                    <Flower2 className="h-8 w-8 stroke-1" />
                  </div>
                )}
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-baseline gap-2">
                    <CardTitle className="font-serif-boho text-2xl font-semibold text-boho-text-title leading-snug">
                      {item.title}
                    </CardTitle>
                    {!item.imageUrl && (
                      <span className="text-terracotta-700 font-serif-boho font-bold text-lg whitespace-nowrap">
                        ${Number(item.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs uppercase tracking-wider text-boho-text-light font-medium">
                    {item.unitLabel}
                  </span>
                </CardHeader>
                <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between">
                  <CardDescription className="text-sm text-boho-text-muted leading-relaxed">
                    {item.description || "Elaboración artesanal con insumos selectos de temporada."}
                  </CardDescription>
                  <div className="pt-4 flex items-center justify-between text-xs text-boho-text-light border-t border-boho-surface">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-terracotta-500" /> Hecho en Monterrey
                    </span>
                    <Badge variant="sage" className="text-[10px]">Artesanal</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sección de llamada a cotización */}
        <div className="mt-20 bg-gradient-to-r from-boho-surface via-boho-bg to-boho-surface border border-boho-border rounded-3xl p-8 md:p-12 text-center space-y-4">
          <HeartHandshake className="h-10 w-10 text-terracotta-600 mx-auto stroke-1" />
          <h3 className="font-serif-boho text-3xl md:text-4xl font-normal text-boho-text-title">
            ¿Tienes un evento en mente en Monterrey o San Pedro?
          </h3>
          <p className="text-sm md:text-base text-boho-text-muted max-w-xl mx-auto">
            Personalizamos el menú para bodas, celebraciones familiares y eventos corporativos con la estética y el sabor que buscas.
          </p>
          <a
            href={`https://wa.me/${content.contact.whatsapp}?text=Hola,%20me%20gustaría%20solicitar%20información%20sobre%20el%20servicio%20de%20catering%20en%20Monterrey.`}
            target="_blank"
            rel="noreferrer"
            className="inline-block pt-2"
          >
            <Button size="lg" className="rounded-full shadow-md bg-terracotta-600 hover:bg-terracotta-700 text-boho-bg">
              <Phone className="h-4 w-4 mr-2" /> Escríbenos por WhatsApp
            </Button>
          </a>
        </div>
      </main>

      {/* Footer BoHo */}
      <footer className="border-t border-boho-border-subtle bg-boho-surface py-10 px-6 text-center text-sm text-boho-text-muted">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-wrap justify-center gap-6 text-boho-text font-medium text-xs md:text-sm">
            <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-terracotta-600" /> {content.contact.phone}</span>
            <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-sage-500" /> {content.contact.email}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-terracotta-600" /> {content.contact.city}</span>
          </div>
          <p className="text-xs text-boho-text-light max-w-md mx-auto">{content.footerCopy.note}</p>
          <p className="text-[11px] text-boho-text-light pt-2">{content.footerCopy.copyrightText}</p>
        </div>
      </footer>
    </div>
  );
};
