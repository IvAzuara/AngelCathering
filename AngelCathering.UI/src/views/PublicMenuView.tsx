import React, { useEffect, useState } from "react";
import { useSiteContent } from "@/context/ContentContext";
import { api, getFullImageUrl, type MenuCategory, type Season } from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, Phone, 
  Flower2, HeartHandshake, ShieldCheck,
  Send, CheckCircle2, X, RefreshCw
} from "lucide-react";

export const PublicMenuView: React.FC<{ onGoToLogin: () => void }> = ({ onGoToLogin }) => {
  const { content } = useSiteContent();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonSlug, setSelectedSeasonSlug] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Modal interactivo de Solicitud de Cotización
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedPackageTitle, setSelectedPackageTitle] = useState<string>("");
  const [quoteForm, setQuoteForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    eventType: "Social / Fiesta",
    eventDate: "",
    guestCount: 30,
    serviceLocation: "",
    notes: ""
  });
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSuccessMessage, setQuoteSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuData, activeSeasons] = await Promise.all([
        api.getPublicMenu(),
        api.getActiveSeasons()
      ]);
      setCategories(menuData);
      setSeasons(activeSeasons);
      if (menuData.length > 0) {
        setSelectedCategory(menuData[0].idCategory);
      }
    } catch (err) {
      console.error("Error al cargar menú y temporadas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar platillos según temporada seleccionada (si aplica)
  const currentCategory = categories.find((c) => c.idCategory === selectedCategory) || categories[0];
  
  const displayedItems = currentCategory ? currentCategory.items.filter(item => {
    if (selectedSeasonSlug === "all") return true;
    if (selectedSeasonSlug === "navidad") {
      return item.idSeason === 2 || item.categoryName?.toLowerCase().includes("navideñ");
    }
    if (selectedSeasonSlug === "regular") {
      return !item.idSeason || item.idSeason === 1;
    }
    return true;
  }) : [];

  const handleOpenQuoteModal = (packageTitle?: string) => {
    setSelectedPackageTitle(packageTitle || "Catering Personalizado");
    setQuoteSuccessMessage(null);
    setIsQuoteModalOpen(true);
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.customerName.trim() || !quoteForm.customerPhone.trim()) {
      alert("Por favor ingresa tu nombre y un número telefónico.");
      return;
    }

    setIsSubmittingQuote(true);
    try {
      const res = await api.requestPublicQuote({
        customerName: quoteForm.customerName,
        customerPhone: quoteForm.customerPhone,
        customerEmail: quoteForm.customerEmail || undefined,
        eventType: quoteForm.eventType,
        eventDate: quoteForm.eventDate || undefined,
        guestCount: quoteForm.guestCount,
        serviceLocation: quoteForm.serviceLocation || undefined,
        selectedPackage: selectedPackageTitle,
        notes: quoteForm.notes || undefined
      });

      setQuoteSuccessMessage(res.message || "¡Solicitud enviada con éxito!");
      setQuoteForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        eventType: "Social / Fiesta",
        eventDate: "",
        guestCount: 30,
        serviceLocation: "",
        notes: ""
      });
    } catch (err: any) {
      alert(err.message || "Error al enviar la solicitud.");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  return (
    <div className="min-h-screen bg-boho-bg text-boho-text flex flex-col font-sans-boho selection:bg-terracotta-200">
      {/* Header BoHo */}
      <header className="border-b border-boho-border-subtle bg-boho-bg/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-boho-surface border border-boho-border text-terracotta-600 flex items-center justify-center shadow-xs">
              <Flower2 className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.5]" />
            </div>
            <div>
              <span className="font-serif-boho text-xl sm:text-2xl font-bold tracking-wide text-boho-text-title block leading-tight">
                {content.branding.businessName}
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-boho-text-light font-medium">
                Monterrey • Eventos &amp; Banquetes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              size="sm"
              onClick={() => handleOpenQuoteModal()}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs px-3 sm:px-4 py-2 rounded-full shadow-xs transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Cotizar Evento
            </Button>
            <button
              onClick={onGoToLogin}
              className="text-xs text-boho-text-light hover:text-boho-text-title transition-colors font-medium p-2"
              title="Acceso administrativo"
            >
              Staff
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-8 sm:pt-16 sm:pb-12 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-boho-surface text-terracotta-700 text-xs tracking-wider uppercase font-semibold border border-boho-border">
            <Sparkles className="h-3.5 w-3.5 text-terracotta-600" /> Monterrey &amp; Área Metropolitana
          </div>
          <h1 className="font-serif-boho text-4xl sm:text-5xl md:text-6xl font-normal text-boho-text-title leading-tight">
            Banquetes, Pizza Bar &amp; Experiencias Gastronómicas
          </h1>
          <p className="text-sm sm:text-base text-boho-text-muted max-w-xl mx-auto leading-relaxed">
            Platillos artesanales de autor, servicio de mesa, barras temáticas y paquetes completos para tus celebraciones más memorables.
          </p>

          {/* SELECTOR DE TEMPORADAS DINÁMICO */}
          {seasons.length > 0 && (
            <div className="pt-4 flex flex-wrap justify-center items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSeasonSlug("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedSeasonSlug === "all"
                    ? "bg-terracotta-600 text-white shadow-xs"
                    : "bg-white text-zinc-600 border border-boho-border hover:bg-boho-surface"
                }`}
              >
                🌿 Catálogo Completo
              </button>

              {seasons.map((s) => (
                <button
                  key={s.idSeason}
                  type="button"
                  onClick={() => setSelectedSeasonSlug(s.slug)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedSeasonSlug === s.slug
                      ? "bg-terracotta-600 text-white shadow-xs scale-105"
                      : "bg-white text-zinc-700 border border-boho-border hover:bg-boho-surface"
                  }`}
                >
                  <span>{s.name}</span>
                  {s.badgeText && (
                    <span className="text-[10px] bg-terracotta-100 text-terracotta-800 px-1.5 py-0.2 rounded-full">
                      {s.badgeText}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Menu Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* Filtros de Categorías BoHo */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat.idCategory}
                onClick={() => setSelectedCategory(cat.idCategory)}
                className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
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
        ) : displayedItems.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-boho-border">
            <Flower2 className="h-10 w-10 text-boho-border mx-auto mb-2 stroke-1" />
            <p className="text-boho-text-muted">No hay platillos disponibles en esta selección en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedItems.map((item) => (
              <Card 
                key={item.idItem} 
                className="overflow-hidden flex flex-col bg-boho-card border border-boho-border shadow-2xs hover:shadow-md transition-all duration-300 rounded-2xl group"
              >
                {item.imageUrl ? (
                  <div className="h-52 sm:h-56 w-full overflow-hidden bg-boho-surface relative">
                    <img
                      src={getFullImageUrl(item.imageUrl)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-boho-bg/95 backdrop-blur-xs px-3 py-1 rounded-full text-sm font-serif-boho font-bold text-terracotta-700 shadow-xs border border-boho-border">
                      ${Number(item.price).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div className="h-36 bg-boho-surface/60 flex items-center justify-center text-boho-border">
                    <Flower2 className="h-8 w-8 stroke-1" />
                  </div>
                )}
                
                <CardHeader className="p-5 sm:p-6 pb-2">
                  <div className="flex justify-between items-baseline gap-2">
                    <CardTitle className="font-serif-boho text-xl sm:text-2xl font-semibold text-boho-text-title leading-snug">
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
                
                <CardContent className="p-5 sm:p-6 pt-2 flex-1 flex flex-col justify-between space-y-4">
                  <CardDescription className="text-xs sm:text-sm text-boho-text-muted leading-relaxed">
                    {item.description || "Elaboración artesanal con insumos selectos de temporada."}
                  </CardDescription>
                  
                  <div className="pt-3 border-t border-boho-surface flex items-center justify-between">
                    <span className="text-[11px] text-boho-text-light flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-terracotta-500" /> Monterrey, N.L.
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenQuoteModal(item.title)}
                      className="text-xs h-7 px-3 border-terracotta-500 text-terracotta-600 hover:bg-terracotta-50 rounded-full"
                    >
                      Cotizar este plato
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sección llamada a cotizar */}
        <div className="mt-16 sm:mt-20 bg-gradient-to-r from-boho-surface via-boho-bg to-boho-surface border border-boho-border rounded-3xl p-6 sm:p-12 text-center space-y-4">
          <HeartHandshake className="h-10 w-10 text-terracotta-600 mx-auto stroke-1" />
          <h3 className="font-serif-boho text-2xl sm:text-4xl font-normal text-boho-text-title">
            ¿Tienes un evento en mente en Monterrey o San Pedro?
          </h3>
          <p className="text-xs sm:text-base text-boho-text-muted max-w-xl mx-auto leading-relaxed">
            Personalizamos el menú para adaptarnos a tu espacio, presupuesto y preferencias de invitados.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={() => handleOpenQuoteModal()}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-full px-8 shadow-xs"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Solicitar Cotización Formal
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-boho-border-subtle bg-white/60 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-boho-text-muted text-center md:text-left">
          <div className="space-y-1">
            <p className="font-serif-boho text-lg font-bold text-boho-text-title">Rosé Catering</p>
            <p>Calle Florencia #135, Urbivilla del rey, CP: 64102 • Monterrey, N.L.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-terracotta-600" /> Tel: 81 3584 2443</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-sage-600" /> Insumos higiénicos certificados</span>
          </div>
        </div>
      </footer>

      {/* MODAL DE SOLICITUD DE COTIZACIÓN EN LÍNEA */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-boho-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 bg-boho-surface/60 border-b border-boho-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta-700">Cotización Rápida</span>
                <h3 className="font-serif-boho text-xl font-bold text-boho-text-title">
                  {selectedPackageTitle || "Solicitar Cotización de Evento"}
                </h3>
              </div>
              <button 
                onClick={() => setIsQuoteModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {quoteSuccessMessage ? (
              <div className="p-8 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="font-serif-boho text-2xl font-bold text-zinc-900">¡Muchas Gracias!</h4>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-sm mx-auto">
                  {quoteSuccessMessage}
                </p>
                <Button
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="bg-terracotta-600 text-white rounded-full px-6 text-xs"
                >
                  Volver al Menú
                </Button>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Tu Nombre Completo *</label>
                    <Input
                      value={quoteForm.customerName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, customerName: e.target.value })}
                      placeholder="Ej. Pao González"
                      className="mt-1 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Teléfono / WhatsApp *</label>
                    <Input
                      value={quoteForm.customerPhone}
                      onChange={(e) => setQuoteForm({ ...quoteForm, customerPhone: e.target.value })}
                      placeholder="Ej. 8117603902"
                      className="mt-1 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Tipo de Evento</label>
                    <Input
                      value={quoteForm.eventType}
                      onChange={(e) => setQuoteForm({ ...quoteForm, eventType: e.target.value })}
                      placeholder="Ej. Boda, Posada, Cumpleaños"
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Fecha Tentativa</label>
                    <Input
                      type="date"
                      value={quoteForm.eventDate}
                      onChange={(e) => setQuoteForm({ ...quoteForm, eventDate: e.target.value })}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Número de Invitados</label>
                    <Input
                      type="number"
                      value={quoteForm.guestCount}
                      onChange={(e) => setQuoteForm({ ...quoteForm, guestCount: parseInt(e.target.value) || 1 })}
                      className="mt-1 text-xs"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Ubicación / Municipio</label>
                    <Input
                      value={quoteForm.serviceLocation}
                      onChange={(e) => setQuoteForm({ ...quoteForm, serviceLocation: e.target.value })}
                      placeholder="Ej. Mitras Centro, Monterrey"
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-700">Notas o Solicitudes Especiales</label>
                    <textarea
                      rows={2}
                      value={quoteForm.notes}
                      onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                      placeholder="¿Tienes alguna preferencia de platillo, horario o mobiliario?"
                      className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-terracotta-600"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-boho-surface">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsQuoteModalOpen(false)}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingQuote}
                    className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-medium shadow-xs"
                  >
                    {isSubmittingQuote ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" /> Enviar Solicitud
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
