import React, { useEffect, useState } from "react";
import { api, getFullImageUrl, type MenuItem, type MenuCategory, type Season } from "@/services/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Edit, Trash2, Utensils, Upload, 
  Loader2, Sparkles 
} from "lucide-react";

export const MenuAdminView: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal de platillo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Gestor de Temporadas (Admin)
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Partial<Season> | null>(null);
  const [isSavingSeason, setIsSavingSeason] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, catsData, seasonsData] = await Promise.all([
        api.getMenuItems(),
        api.getCategories(),
        api.getAllSeasons(),
      ]);
      setItems(itemsData);
      setCategories(catsData);
      setSeasons(seasonsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Deseas eliminar este platillo del menú?")) return;
    try {
      await api.deleteMenuItem(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar platillo.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title || !editingItem?.idCategory) {
      alert("Título y categoría son requeridos");
      return;
    }

    try {
      await api.saveMenuItem(editingItem);
      setIsModalOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Error al guardar platillo.");
    }
  };

  // Switch de activación rápida de Temporada
  const handleToggleSeason = async (season: Season) => {
    try {
      await api.toggleSeason(season.idSeason, !season.isActive);
      await loadData();
    } catch (err) {
      alert("Error al cambiar estado de la temporada.");
    }
  };

  const handleSaveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeason?.name || !editingSeason?.slug) {
      alert("Nombre y slug son obligatorios.");
      return;
    }

    setIsSavingSeason(true);
    try {
      await api.saveSeason(editingSeason);
      setEditingSeason(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Error al guardar temporada.");
    } finally {
      setIsSavingSeason(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1: CONTROL DE TEMPORADAS Y CAMPAÑAS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-boho-border shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-boho-surface">
          <div>
            <h3 className="text-base font-serif font-bold text-boho-text flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-terracotta-600" /> Control de Temporadas del Menú
            </h3>
            <p className="text-xs text-zinc-500">
              Activa o apaga temporadas con un solo clic. Los platillos asignados solo se mostrarán en la web cuando la temporada esté activa.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingSeason({
                name: "",
                slug: "",
                badgeText: "",
                description: "",
                isActive: true
              });
              setIsSeasonModalOpen(true);
            }}
            className="text-xs border-terracotta-500 text-terracotta-600 hover:bg-terracotta-50"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Nueva Temporada
          </Button>
        </div>

        {/* Lista de temporadas con Switch rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
          {seasons.map((s) => (
            <div 
              key={s.idSeason}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                s.isActive ? "bg-terracotta-50/40 border-terracotta-200" : "bg-zinc-50 border-zinc-200 opacity-75"
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-zinc-900">{s.name}</span>
                  {s.badgeText && (
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-600">
                      {s.badgeText}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">{s.slug} • {s.isActive ? "Visible al público" : "Oculta"}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingSeason(s);
                    setIsSeasonModalOpen(true);
                  }}
                  className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-800"
                  title="Editar temporada"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>

                {/* Switch ON/OFF */}
                <button
                  type="button"
                  onClick={() => handleToggleSeason(s)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    s.isActive ? "bg-emerald-600" : "bg-zinc-300"
                  }`}
                  title={s.isActive ? "Desactivar temporada" : "Activar temporada"}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    s.isActive ? "left-6" : "left-1"
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: CATÁLOGO DE PLATILLOS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Catálogo del Menú</h2>
          <p className="text-sm text-zinc-500">
            Administra los platillos, precios, imágenes, categorías y temporadas visibles en la web pública.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-terracotta-600 hover:bg-terracotta-700 text-white"
          onClick={() => {
            setEditingItem({
              idCategory: categories[0]?.idCategory || 1,
              title: "",
              description: "",
              price: 200,
              unitLabel: "por persona",
              imageUrl: "",
              isAvailable: true,
            });
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nuevo Platillo
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-600 mb-2" />
          <p>Cargando menú...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.idItem} className="overflow-hidden flex flex-col border-zinc-200 bg-white">
              <div className="h-40 bg-zinc-100 relative overflow-hidden">
                {item.imageUrl ? (
                  <img src={getFullImageUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Utensils className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-bold text-terracotta-700 shadow-xs border border-zinc-200">
                  ${Number(item.price).toFixed(2)}
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">{item.categoryName}</span>
                    <CardTitle className="text-base font-bold text-zinc-900 leading-snug">{item.title}</CardTitle>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${item.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'}`}>
                    {item.isAvailable ? 'Disponible' : 'Oculto'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
                <p className="text-xs text-zinc-600 line-clamp-2 mb-3">
                  {item.description || "Sin descripción"}
                </p>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                    {item.unitLabel}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(item.idItem)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR PLATILLO */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-bold text-zinc-900 text-base">
                {editingItem.idItem ? "Editar Platillo" : "Nuevo Platillo"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-zinc-700">Título del Platillo</label>
                  <Input
                    required
                    value={editingItem.title || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder="Ej. Pechuga en Crema de Champiñones"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Categoría</label>
                  <select
                    className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs mt-1"
                    value={editingItem.idCategory}
                    onChange={(e) => setEditingItem({ ...editingItem, idCategory: Number(e.target.value) })}
                  >
                    {categories.map((c) => (
                      <option key={c.idCategory} value={c.idCategory}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Temporada Asignada</label>
                  <select
                    className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs mt-1"
                    value={editingItem.idSeason || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, idSeason: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">Todo el Año (Sin restricción)</option>
                    {seasons.map((s) => (
                      <option key={s.idSeason} value={s.idSeason}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Precio Unitario ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={editingItem.price ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Etiqueta de Unidad</label>
                  <Input
                    value={editingItem.unitLabel || "por persona"}
                    onChange={(e) => setEditingItem({ ...editingItem, unitLabel: e.target.value })}
                    placeholder="Ej. por persona / por docena"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Subida de Imagen a Supabase Storage */}
              <div>
                <label className="text-xs font-semibold text-zinc-700">Imagen del Platillo</label>
                {editingItem.imageUrl && (
                  <div className="relative mb-2 rounded-lg overflow-hidden border border-zinc-200 h-28 bg-zinc-50 flex items-center justify-center">
                    <img src={getFullImageUrl(editingItem.imageUrl)} alt="Vista previa" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, imageUrl: "" })}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700 shadow-sm"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed rounded-lg text-xs cursor-pointer border-zinc-300 hover:border-terracotta-600 hover:bg-terracotta-50/30 text-zinc-600">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-terracotta-600" />
                      <span>Subiendo a Supabase Storage...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-terracotta-600" />
                      <span>Subir foto desde mi equipo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true);
                      try {
                        const uploadedUrl = await api.uploadMenuImage(file);
                        setEditingItem({ ...editingItem, imageUrl: uploadedUrl });
                      } catch (err: any) {
                        alert(err.message || "Error al subir imagen.");
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700">Descripción</label>
                <Textarea
                  rows={3}
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Detalles de preparación, ingredientes y acompañamientos..."
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={editingItem.isAvailable ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isAvailable: e.target.checked })}
                  className="rounded text-terracotta-600"
                />
                <label htmlFor="isAvailable" className="text-xs font-semibold text-zinc-700 cursor-pointer">
                  Platillo disponible en el menú público
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-terracotta-600 hover:bg-terracotta-700 text-white">
                  Guardar Platillo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR TEMPORADA */}
      {isSeasonModalOpen && editingSeason && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-bold text-zinc-900 text-base">
                {editingSeason.idSeason ? "Editar Temporada" : "Nueva Temporada"}
              </h3>
              <button onClick={() => { setIsSeasonModalOpen(false); setEditingSeason(null); }} className="text-zinc-400 hover:text-zinc-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveSeason} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700">Nombre de la Temporada *</label>
                <Input
                  required
                  value={editingSeason.name || ""}
                  onChange={(e) => setEditingSeason({ ...editingSeason, name: e.target.value })}
                  placeholder="Ej. 🎓 Temporada de Graduaciones"
                  className="mt-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Slug (identificador) *</label>
                  <Input
                    required
                    value={editingSeason.slug || ""}
                    onChange={(e) => setEditingSeason({ ...editingSeason, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-") })}
                    placeholder="graduaciones"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Etiqueta / Badge</label>
                  <Input
                    value={editingSeason.badgeText || ""}
                    onChange={(e) => setEditingSeason({ ...editingSeason, badgeText: e.target.value })}
                    placeholder="Ej. Mayo - Julio"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700">Descripción</label>
                <Textarea
                  rows={2}
                  value={editingSeason.description || ""}
                  onChange={(e) => setEditingSeason({ ...editingSeason, description: e.target.value })}
                  placeholder="Mensaje sobre la temporada visible para los clientes..."
                  className="mt-1 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="seasonActive"
                  checked={editingSeason.isActive ?? true}
                  onChange={(e) => setEditingSeason({ ...editingSeason, isActive: e.target.checked })}
                  className="rounded text-terracotta-600"
                />
                <label htmlFor="seasonActive" className="text-xs font-semibold text-zinc-700 cursor-pointer">
                  Temporada activa inmediatamente
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <Button type="button" variant="outline" size="sm" onClick={() => { setIsSeasonModalOpen(false); setEditingSeason(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isSavingSeason} className="bg-terracotta-600 hover:bg-terracotta-700 text-white">
                  {isSavingSeason ? "Guardando..." : "Guardar Temporada"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
