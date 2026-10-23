import React, { useEffect, useState } from "react";
import { useSiteContent } from "@/context/ContentContext";
import { api, type MenuCategory } from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Utensils, Phone, Mail, Clock, MapPin, ChefHat, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Barra de navegación superior */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-zinc-900 block leading-tight">{content.branding.businessName}</span>
              <span className="text-xs text-zinc-500 hidden sm:block">{content.branding.tagline}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${content.contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="outline" className="hidden sm:inline-flex text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                <Phone className="h-4 w-4 mr-1 text-emerald-600" /> WhatsApp
              </Button>
            </a>
            <Button size="sm" onClick={onGoToLogin}>
              Acceso Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Badge variant="secondary" className="bg-indigo-700/60 text-indigo-100 hover:bg-indigo-700/80 mb-2 border-indigo-500/30">
            <Sparkles className="h-3 w-3 mr-1 text-amber-300" /> Banquetes &amp; Eventos Exclusivos
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {content.branding.businessName}
          </h1>
          <p className="text-lg md:text-xl text-indigo-200 max-w-2xl mx-auto">
            {content.branding.shortDescription}
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4 text-xs md:text-sm text-indigo-200">
            <div className="flex items-center gap-1.5 bg-indigo-900/40 px-3 py-1.5 rounded-full border border-indigo-700/50">
              <MapPin className="h-4 w-4 text-indigo-400" /> {content.contact.city}
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-900/40 px-3 py-1.5 rounded-full border border-indigo-700/50">
              <Clock className="h-4 w-4 text-indigo-400" /> {content.contact.hours}
            </div>
          </div>
        </div>
      </section>

      {/* Menú y Catálogo */}
      <main className="max-w-7xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            {content.publicMenuSection.title}
          </h2>
          <p className="text-zinc-600 max-w-xl mx-auto">
            {content.publicMenuSection.subtitle}
          </p>
        </div>

        {/* Filtros de Categorías */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <Button
                key={cat.idCategory}
                variant={selectedCategory === cat.idCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.idCategory)}
                className="rounded-full"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {/* Lista de Platillos */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
            <p>Cargando opciones del menú...</p>
          </div>
        ) : !activeCategory || activeCategory.items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-zinc-300">
            <Utensils className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
            <p className="text-zinc-600">No hay platillos disponibles en esta categoría por el momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCategory.items.map((item) => (
              <Card key={item.idItem} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {item.imageUrl ? (
                  <div className="h-48 w-full overflow-hidden bg-zinc-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-zinc-100 flex items-center justify-center text-zinc-400">
                    <Utensils className="h-8 w-8" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                    <span className="text-indigo-600 font-bold whitespace-nowrap">
                      ${Number(item.price).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">{item.unitLabel}</span>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="text-sm text-zinc-600">
                    {item.description || "Deliciosa opción gourmet preparada especialmente para tus eventos."}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 px-4 text-center text-sm text-zinc-500">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex flex-wrap justify-center gap-6 text-zinc-600 font-medium">
            <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {content.contact.phone}</span>
            <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {content.contact.email}</span>
          </div>
          <p>{content.footerCopy.note}</p>
          <p className="text-xs text-zinc-400">{content.footerCopy.copyrightText}</p>
        </div>
      </footer>
    </div>
  );
};
