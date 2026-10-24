import React, { useEffect, useState } from "react";
import { api, getFullImageUrl, type MenuItem, type MenuCategory } from "@/services/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Utensils, Upload, Image as ImageIcon, Loader2 } from "lucide-react";

export const MenuAdminView: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, catsData] = await Promise.all([
        api.getMenuItems(),
        api.getCategories(),
      ]);
      setItems(itemsData);
      setCategories(catsData);
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
      alert("Completa los campos obligatorios.");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Catálogo del Menú</h2>
          <p className="text-sm text-zinc-500">
            Administra los platillos, precios, imágenes y categorías visibles en la web pública.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingItem({
              idCategory: categories[0]?.idCategory || 1,
              title: "",
              description: "",
              price: 100,
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2" />
          <p>Cargando menú...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.idItem} className="overflow-hidden flex flex-col border-zinc-200">
              <div className="h-36 bg-zinc-100 relative overflow-hidden">
                {item.imageUrl ? (
                  <img src={getFullImageUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Utensils className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-xs font-bold text-indigo-700 shadow-xs">
                  ${Number(item.price).toFixed(2)}
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs uppercase font-semibold text-zinc-400">{item.categoryName}</span>
                    <CardTitle className="text-base font-bold text-zinc-900">{item.title}</CardTitle>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'}`}>
                    {item.isAvailable ? 'Disponible' : 'Oculto'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
                <p className="text-xs text-zinc-600 line-clamp-2 mb-3">
                  {item.description || "Sin descripción"}
                </p>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
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
                    className="h-8 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(item.idItem)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para Crear / Editar Platillo */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader>
              <CardTitle>{editingItem.idItem ? "Editar Platillo" : "Nuevo Platillo"}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Categoría *</label>
                  <select
                    className="w-full rounded-md border border-zinc-300 p-2 text-sm bg-white"
                    value={editingItem.idCategory || categories[0]?.idCategory}
                    onChange={(e) => setEditingItem({ ...editingItem, idCategory: parseInt(e.target.value) })}
                  >
                    {categories.map((c) => (
                      <option key={c.idCategory} value={c.idCategory}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Título / Nombre *</label>
                  <Input
                    required
                    value={editingItem.title || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder="Ej. Brochetas de Camarón"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Precio ($) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={editingItem.price || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Unidad de Cobro</label>
                    <Input
                      value={editingItem.unitLabel || "por persona"}
                      onChange={(e) => setEditingItem({ ...editingItem, unitLabel: e.target.value })}
                      placeholder="por persona, docena, pieza"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Imagen del Platillo</label>
                  
                  {/* Vista previa si ya tiene imagen */}
                  {editingItem.imageUrl && (
                    <div className="mb-2 relative rounded-lg overflow-hidden border border-zinc-200 h-28 bg-zinc-50 flex items-center justify-center">
                      <img 
                        src={getFullImageUrl(editingItem.imageUrl)} 
                        alt="Vista previa" 
                        className="h-full w-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, imageUrl: "" })}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700 shadow-sm"
                        title="Quitar imagen"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed rounded-lg text-xs cursor-pointer transition-colors ${
                      uploadingImage 
                        ? 'bg-zinc-100 border-zinc-300 text-zinc-400 cursor-not-allowed' 
                        : 'border-zinc-300 hover:border-terracotta-600 hover:bg-terracotta-50/30 text-zinc-600'
                    }`}>
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-terracotta-600" />
                          <span>Subiendo a Supabase Storage...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-terracotta-600" />
                          <span>Subir imagen desde mi equipo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setUploadingImage(true);
                          try {
                            const uploadedPath = await api.uploadMenuImage(file);
                            setEditingItem({ ...editingItem, imageUrl: uploadedPath });
                          } catch (err: any) {
                            alert(err.message || "Error al subir la imagen.");
                          } finally {
                            setUploadingImage(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  {/* Input manual opcional por si quieren usar una URL externa */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <ImageIcon className="h-3 w-3 text-zinc-400 shrink-0" />
                    <Input
                      className="text-xs h-7"
                      value={editingItem.imageUrl || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                      placeholder="o escribe una URL de imagen directamente"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Descripción</label>
                  <Textarea
                    value={editingItem.description || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Detalles sobre preparación, ingredientes, etc."
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={editingItem.isAvailable ?? true}
                    onChange={(e) => setEditingItem({ ...editingItem, isAvailable: e.target.checked })}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-semibold text-zinc-700 cursor-pointer">
                    Visible y disponible en menú público
                  </label>
                </div>
              </CardContent>
              <div className="p-4 border-t border-zinc-100 flex justify-end gap-2 bg-zinc-50 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar Platillo
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
