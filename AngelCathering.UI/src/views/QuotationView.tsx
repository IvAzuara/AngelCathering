import React, { useState, useRef, useEffect } from "react";
import { 
  Calculator, 
  FileDown, 
  Plus, 
  Trash2, 
  User, 
  FileText,
  Sparkles,
  Eye,
  RefreshCw,
  ShoppingBag,
  CheckCircle,
  RotateCcw,
  Settings2,
  Edit2,
  X,
  Check
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, type QuotePreset } from "@/services/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface QuoteItem {
  id: string;
  description: string;
  serviceDays: number;
  peopleCount: number;
  unitPrice: number;
}

// Fallback estático en caso de que la red falle
const DEFAULT_PIZZA_PRESET: QuotePreset = {
  idPreset: 1,
  name: "🍕 Pizza Bar Artesanal",
  serviceType: "Pizza Bar",
  includedMenu: "Pizza artesanal + complementos",
  pricePerPerson: 200,
  foodDetails: "Variedad de pizzas: pepperoni, hawaiana, jamón, champiñones, 2 quesos\n\nPasta (a elegir)\n\nEnsalada italiana",
  complementDetails: "Aderezos gourmet\n\nQueso parmesano\n\nChile quebrado",
  includesDetails: "1 hora de servicio continuo\nPersonal de cocina y atención\nDesechables biodegradables (platos y cubiertos)\nDecoración temática rústica / boho",
  defaultDescription: "Pizza bar artesanal",
  isActive: true
};

interface QuotationViewProps {
  onOrderCreated?: () => void;
  initialOrderData?: any;
}

export const QuotationView: React.FC<QuotationViewProps> = ({ onOrderCreated, initialOrderData }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [presets, setPresets] = useState<QuotePreset[]>([DEFAULT_PIZZA_PRESET]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);

  // Modal / Gestor de Plantillas
  const [isManagingPresets, setIsManagingPresets] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Partial<QuotePreset> | null>(null);
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  // Datos Generales de la Cotización
  const [responsible, setResponsible] = useState("");
  const [emissionDate, setEmissionDate] = useState("");
  
  // Datos del Cliente
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [peopleCount, setPeopleCount] = useState<number | "">("");

  // Detalle del Servicio (Página 1)
  const [serviceType, setServiceType] = useState("");
  const [includedMenu, setIncludedMenu] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState<number | "">("");

  // Lista de Comida y Complementos
  const [foodDetails, setFoodDetails] = useState("");
  const [complementDetails, setComplementDetails] = useState("");

  // Incluye
  const [includesDetails, setIncludesDetails] = useState("");

  // Tabla Genérica por Día (Página 2)
  const [tableItems, setTableItems] = useState<QuoteItem[]>([
    {
      id: "item-1",
      description: "",
      serviceDays: 1,
      peopleCount: 0,
      unitPrice: 0
    }
  ]);

  // Impuestos y condiciones
  const [includeIva, setIncludeIva] = useState(false);
  const [paymentConditions, setPaymentConditions] = useState(
    "- 50% anticipo para reservar fechas\n- El restante se liquida 1 día antes del evento\n- Cambios en el número de personas deben realizarse con 7 días de anticipación"
  );
  const [notes, setNotes] = useState(
    "- En caso de requerir factura, se adicionarán los impuestos correspondientes (IVA)"
  );

  // Estados de carga y feedback
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderSavedSuccess, setOrderSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const pdfPage1Ref = useRef<HTMLDivElement>(null);
  const pdfPage2Ref = useRef<HTMLDivElement>(null);

  // Cargar plantillas desde la base de datos
  const loadPresetsFromDb = async () => {
    setIsLoadingPresets(true);
    try {
      const data = await api.getQuotePresets();
      if (data && data.length > 0) {
        setPresets(data);
      } else {
        setPresets([DEFAULT_PIZZA_PRESET]);
      }
    } catch (err) {
      console.warn("No se pudieron cargar presets de la BD, usando predeterminados:", err);
      setPresets([DEFAULT_PIZZA_PRESET]);
    } finally {
      setIsLoadingPresets(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    setIsAdmin(!!token);

    // Inicializar responsable y fecha de emisión actual si están vacíos
    const today = new Date();
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    setEmissionDate(`${months[today.getMonth()]} ${today.getFullYear()}`);
    setResponsible("Linda Camacho");

    loadPresetsFromDb();

    // Precargar datos si viene de una orden seleccionada en Kanban
    if (initialOrderData) {
      if (initialOrderData.customerName) setClientName(initialOrderData.customerName);
      if (initialOrderData.customerPhone) setClientPhone(initialOrderData.customerPhone);
      if (initialOrderData.eventType) setEventType(initialOrderData.eventType);
      if (initialOrderData.eventDate) setEventDate(new Date(initialOrderData.eventDate).toLocaleDateString("es-MX", { day: '2-digit', month: 'long', year: 'numeric' }));
      if (initialOrderData.guestCount) {
        setPeopleCount(initialOrderData.guestCount);
        setTableItems(prev => prev.map((item, idx) => idx === 0 ? { ...item, peopleCount: initialOrderData.guestCount } : item));
      }
      if (initialOrderData.notes) {
        setNotes(initialOrderData.notes);
      }
    }
  }, [initialOrderData]);

  // Cálculos económicos
  const calculateItemSubtotal = (item: QuoteItem) => {
    if (item.peopleCount > 0) {
      return (item.serviceDays || 1) * item.peopleCount * (item.unitPrice || 0);
    }
    return (item.serviceDays || 1) * (item.unitPrice || 0);
  };

  const subtotal = tableItems.reduce((acc, item) => acc + calculateItemSubtotal(item), 0);
  const ivaAmount = includeIva ? subtotal * 0.16 : 0;
  const total = subtotal + ivaAmount;

  // Manejo de ítems de la tabla
  const handleAddItem = (desc = "", days = 1, people = 0, price = 0) => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      description: desc,
      serviceDays: days,
      peopleCount: people,
      unitPrice: price
    };
    setTableItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (tableItems.length <= 1) {
      setTableItems([{ id: `item-${Date.now()}`, description: "", serviceDays: 1, peopleCount: 0, unitPrice: 0 }]);
      return;
    }
    setTableItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setTableItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleMainPeopleChange = (newCount: number) => {
    setPeopleCount(newCount);
    setTableItems(prev => prev.map((item, index) => {
      if (index === 0 || item.peopleCount > 0) {
        return { ...item, peopleCount: newCount };
      }
      return item;
    }));
  };

  // Aplicar plantilla / preset predefinido
  const handleApplyPreset = (preset: QuotePreset) => {
    setServiceType(preset.serviceType);
    setIncludedMenu(preset.includedMenu);
    setPricePerPerson(preset.pricePerPerson);
    setFoodDetails(preset.foodDetails || "");
    setComplementDetails(preset.complementDetails || "");
    setIncludesDetails(preset.includesDetails || "");

    const currentGuests = typeof peopleCount === "number" ? peopleCount : 30;
    setTableItems([
      {
        id: `item-1`,
        description: preset.defaultDescription || preset.serviceType,
        serviceDays: 1,
        peopleCount: currentGuests,
        unitPrice: preset.pricePerPerson
      },
      {
        id: `item-2`,
        description: "Flete / traslado en zona metropolitana",
        serviceDays: 1,
        peopleCount: 0,
        unitPrice: 200
      }
    ]);
  };

  // Limpiar formulario a valores vacíos
  const handleResetForm = () => {
    if (!confirm("¿Deseas vaciar todos los campos del formulario?")) return;
    setClientName("");
    setClientPhone("");
    setEventType("");
    setEventDate("");
    setEventTime("");
    setEventLocation("");
    setPeopleCount("");
    setServiceType("");
    setIncludedMenu("");
    setPricePerPerson("");
    setFoodDetails("");
    setComplementDetails("");
    setIncludesDetails("");
    setTableItems([{ id: `item-1`, description: "", serviceDays: 1, peopleCount: 0, unitPrice: 0 }]);
  };

  // Guardar / Editar plantilla en base de datos (SOLO ADMIN)
  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset || !editingPreset.name?.trim() || !editingPreset.serviceType?.trim()) {
      alert("Por favor completa el nombre de la plantilla y el tipo de servicio.");
      return;
    }

    setIsSavingPreset(true);
    try {
      await api.saveQuotePreset(editingPreset);
      setEditingPreset(null);
      await loadPresetsFromDb();
    } catch (err: any) {
      alert(err.message || "Error al guardar la plantilla en la base de datos.");
    } finally {
      setIsSavingPreset(false);
    }
  };

  // Eliminar plantilla en base de datos (SOLO ADMIN)
  const handleDeletePreset = async (idPreset: number) => {
    if (!confirm("¿Estás seguro de eliminar esta plantilla de la base de datos?")) return;
    try {
      await api.deleteQuotePreset(idPreset);
      await loadPresetsFromDb();
    } catch (err: any) {
      alert(err.message || "Error al eliminar la plantilla.");
    }
  };

  // Guardar cotización como Pedido en el Sistema (SOLO ADMIN)
  const handleSaveAsOrder = async () => {
    if (!clientName.trim()) {
      alert("Por favor ingresa al menos el Nombre del Cliente para guardar el pedido.");
      return;
    }

    setIsSavingOrder(true);
    setOrderSavedSuccess(false);

    try {
      const notesDetails = [
        `Servicio: ${serviceType || "No especificado"} (${includedMenu || ""})`,
        `Horario: ${eventTime || "Por confirmar"}`,
        `Ubicación: ${eventLocation || "Por confirmar"}`,
        `Detalle menú: ${foodDetails ? foodDetails.substring(0, 150) + "..." : "N/A"}`,
        `Condiciones: ${includeIva ? "Incluye IVA" : "Subtotal neto"}`,
      ].filter(Boolean).join(" | ");

      let validEventDate = new Date().toISOString();
      const parsedDate = new Date(eventDate);
      if (!isNaN(parsedDate.getTime())) {
        validEventDate = parsedDate.toISOString();
      }

      const newOrder = {
        customerName: clientName.trim(),
        customerPhone: clientPhone.trim() || undefined,
        eventType: eventType.trim() || "Catering Evento",
        eventDate: validEventDate,
        guestCount: typeof peopleCount === "number" && peopleCount > 0 ? peopleCount : 1,
        status: "PENDIENTE" as const,
        isUrgent: false,
        sortPriority: 0,
        totalEstimated: total > 0 ? total : 0,
        notes: notesDetails
      };

      await api.saveOrder(newOrder);
      setOrderSavedSuccess(true);
      setTimeout(() => setOrderSavedSuccess(false), 4000);

      if (onOrderCreated) {
        onOrderCreated();
      }
    } catch (err: any) {
      console.error("Error al registrar pedido desde cotización:", err);
      alert(`No se pudo crear el pedido: ${err.message || "Error desconocido"}`);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Generar PDF
  const handleExportPDF = async () => {
    if (!pdfPage1Ref.current || !pdfPage2Ref.current) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter"
      });

      const options = {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FAF8F5"
      };

      // Página 1
      const canvas1 = await html2canvas(pdfPage1Ref.current, options);
      const imgData1 = canvas1.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData1, "JPEG", 0, 0, 612, 792);

      // Página 2
      pdf.addPage("letter", "portrait");
      const canvas2 = await html2canvas(pdfPage2Ref.current, options);
      const imgData2 = canvas2.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData2, "JPEG", 0, 0, 612, 792);

      const sanitizedName = clientName.trim().replace(/[^a-zA-Z0-9]/g, "_") || "Cliente";
      pdf.save(`Cotizacion_RoseCatering_${sanitizedName}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Hubo un error al generar el PDF. Por favor intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Barra de cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-boho-sand">
        <div>
          <div className="inline-flex items-center gap-2 bg-boho-terracotta/10 text-boho-terracotta text-xs font-semibold px-3 py-1 rounded-full mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Cotizador Oficial de Eventos
          </div>
          <h1 className="font-serif text-3xl font-bold text-boho-stone">Generador de Cotizaciones</h1>
          <p className="text-sm text-boho-muted">
            Gestiona plantillas rápidas desde la base de datos o personaliza los campos para emitir la cotización.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Botón vaciar */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetForm}
            className="text-xs text-boho-text border-boho-border bg-white hover:text-red-700 hover:bg-red-50"
            title="Limpiar formulario"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Limpiar
          </Button>

          {/* Selector de pestañas Formulario / Vista Previa */}
          <div className="bg-boho-surface p-1 rounded-lg border border-boho-border flex gap-1">
            <Button
              type="button"
              variant={activeTab === "editor" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("editor")}
              className={`text-xs ${activeTab === "editor" ? "bg-terracotta-600 text-white hover:bg-terracotta-700" : "text-boho-text hover:bg-boho-surface-hover"}`}
            >
              <FileText className="h-3.5 w-3.5 mr-1" /> Formulario
            </Button>
            <Button
              type="button"
              variant={activeTab === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("preview")}
              className={`text-xs ${activeTab === "preview" ? "bg-terracotta-600 text-white hover:bg-terracotta-700" : "text-boho-text hover:bg-boho-surface-hover"}`}
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> Vista Previa
            </Button>
          </div>

          {/* Botón Guardar como Pedido (SOLO ADMIN) */}
          {isAdmin && (
            <Button
              type="button"
              onClick={handleSaveAsOrder}
              disabled={isSavingOrder}
              className={`text-xs font-medium shadow-xs transition-all ${
                orderSavedSuccess 
                  ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                  : "bg-sage-600 text-white hover:bg-sage-700"
              }`}
            >
              {isSavingOrder ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Guardando pedido...
                </>
              ) : orderSavedSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1.5" /> ¡Pedido Guardado!
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 mr-1.5" /> Guardar como Pedido
                </>
              )}
            </Button>
          )}

          {/* Botón Descargar PDF */}
          <Button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-medium shadow-xs transition-all"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Descargar PDF Oficial
              </>
            )}
          </Button>
        </div>
      </div>

      {/* BARRA DE PRESETS / PLANTILLAS RÁPIDAS (DESDE BASE DE DATOS) */}
      <div className="mt-4 bg-boho-surface/80 p-3 rounded-lg border border-boho-sand flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-boho-terracotta shrink-0" />
          <span className="text-xs font-semibold text-boho-stone">Plantillas de BD:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {isLoadingPresets ? (
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" /> Cargando...
            </span>
          ) : (
            presets.map((preset) => (
              <button
                key={preset.idPreset}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs px-2.5 py-1 bg-white hover:bg-boho-warm border border-boho-sand rounded-md text-boho-stone transition-all shadow-2xs hover:border-boho-terracotta cursor-pointer font-medium"
              >
                {preset.name}
              </button>
            ))
          )}

          {/* Botón Administrar Plantillas (Solo Admin) */}
          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsManagingPresets(!isManagingPresets)}
              className="text-xs h-7 px-2.5 border border-terracotta-500 text-terracotta-600 bg-white hover:bg-terracotta-50 ml-1"
            >
              <Settings2 className="h-3.5 w-3.5 mr-1" />
              {isManagingPresets ? "Cerrar Gestor" : "Gestionar Plantillas"}
            </Button>
          )}
        </div>
      </div>

      {/* PANEL GESTOR DE PLANTILLAS (SOLO ADMIN) */}
      {isAdmin && isManagingPresets && (
        <Card className="mt-4 border-2 border-terracotta-500/40 bg-white shadow-md animate-in fade-in duration-200">
          <CardHeader className="py-3 px-4 bg-boho-surface/50 border-b border-boho-border flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-serif font-bold text-boho-text flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-terracotta-600" /> Catálogo de Plantillas en Base de Datos
            </CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingPreset({
                  name: "",
                  serviceType: "",
                  includedMenu: "",
                  pricePerPerson: 0,
                  foodDetails: "",
                  complementDetails: "",
                  includesDetails: "",
                  defaultDescription: "",
                  isActive: true
                });
              }}
              className="h-7 text-xs bg-terracotta-600 text-white hover:bg-terracotta-700 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nueva Plantilla
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Lista actual de plantillas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {presets.map((p) => (
                <div key={p.idPreset} className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-900">{p.name}</span>
                      <span className="text-[11px] font-bold text-boho-terracotta">${p.pricePerPerson}/persona</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{p.serviceType} • {p.includedMenu}</p>
                    {p.foodDetails && (
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{p.foodDetails}</p>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-200 flex justify-end gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingPreset(p)}
                      className="h-6 px-2 text-[11px] text-zinc-600 hover:text-boho-terracotta hover:bg-white"
                    >
                      <Edit2 className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletePreset(p.idPreset)}
                      className="h-6 px-2 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulario modal / colapsable para crear o editar plantilla */}
            {editingPreset && (
              <form onSubmit={handleSavePreset} className="mt-4 p-4 rounded-xl border border-boho-sand bg-boho-warm/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-boho-sand">
                  <h4 className="text-xs font-bold text-boho-stone">
                    {editingPreset.idPreset ? "Editar Plantilla" : "Crear Nueva Plantilla en Base de Datos"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingPreset(null)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700">Nombre del Botón / Preset *</label>
                    <Input
                      value={editingPreset.name || ""}
                      onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                      placeholder="Ej. 🍕 Pizza Bar Artesanal"
                      className="h-8 text-xs mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700">Tipo de Servicio *</label>
                    <Input
                      value={editingPreset.serviceType || ""}
                      onChange={(e) => setEditingPreset({ ...editingPreset, serviceType: e.target.value })}
                      placeholder="Ej. Pizza Bar"
                      className="h-8 text-xs mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700">Menú Incluido</label>
                    <Input
                      value={editingPreset.includedMenu || ""}
                      onChange={(e) => setEditingPreset({ ...editingPreset, includedMenu: e.target.value })}
                      placeholder="Ej. Pizza artesanal + complementos"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700">Precio Sugerido x Persona ($)</label>
                    <Input
                      type="number"
                      value={editingPreset.pricePerPerson ?? 0}
                      onChange={(e) => setEditingPreset({ ...editingPreset, pricePerPerson: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-zinc-700">Descripción en Desglose Económico</label>
                    <Input
                      value={editingPreset.defaultDescription || ""}
                      onChange={(e) => setEditingPreset({ ...editingPreset, defaultDescription: e.target.value })}
                      placeholder="Ej. Pizza bar artesanal por comensal"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700">Comida (Platillos)</label>
                    <textarea
                      rows={3}
                      value={editingPreset.foodDetails || ""}
                      onChange={(e) => setEditingPreset({ ...editingPreset, foodDetails: e.target.value })}
                      className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-boho-terracotta"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700">Complementos y Aderezos</label>
                    <textarea
                      rows={3}
                      value={editingPreset.complementDetails || ""}
                      onChange={(e) => setEditingPreset({ ...editingPreset, complementDetails: e.target.value })}
                      className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-boho-terracotta"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700">El Servicio Incluye</label>
                    <textarea
                      rows={3}
                      value={editingPreset.includesDetails || ""}
                      onChange={(e) => setEditingPreset({ ...editingPreset, includesDetails: e.target.value })}
                      className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-boho-terracotta"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-boho-sand">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPreset(null)}
                    className="text-xs h-7"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingPreset}
                    className="text-xs h-7 bg-boho-terracotta text-white hover:bg-terracotta-700"
                  >
                    {isSavingPreset ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" /> Guardar Plantilla
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selector de modo */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA FORMULARIO DE EDICIÓN */}
        <div className={`space-y-6 ${activeTab === "editor" ? "lg:col-span-7" : "lg:col-span-12 hidden lg:block lg:col-span-5"}`}>
          {/* Card 1: Datos Generales y Cliente */}
          <Card className="border border-boho-sand bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-boho-sand/40">
              <CardTitle className="text-base font-serif font-bold text-boho-stone flex items-center gap-2">
                <User className="h-4 w-4 text-boho-terracotta" /> Datos del Cliente y Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700">Nombre del Cliente *</label>
                <Input 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  placeholder="Ej. Pao González"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700">Teléfono</label>
                <Input 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)} 
                  placeholder="Ej. 8117603902"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700">Tipo de Evento</label>
                <Input 
                  value={eventType} 
                  onChange={(e) => setEventType(e.target.value)} 
                  placeholder="Ej. Social / Cumpleaños / Boda"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700">Fecha del Evento</label>
                <Input 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)} 
                  placeholder="Ej. 23 Octubre 2026"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700">Horario</label>
                <Input 
                  value={eventTime} 
                  onChange={(e) => setEventTime(e.target.value)} 
                  placeholder="Ej. 08:00 pm"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700">Número de Personas</label>
                <Input 
                  type="number" 
                  value={peopleCount === "" ? "" : peopleCount} 
                  onChange={(e) => {
                    const val = e.target.value;
                    handleMainPeopleChange(val === "" ? 0 : parseInt(val));
                  }} 
                  placeholder="Ej. 30"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">Ubicación del Evento</label>
                <Input 
                  value={eventLocation} 
                  onChange={(e) => setEventLocation(e.target.value)} 
                  placeholder="Ej. Calle sain alto #236 Col. Mitras centro, Monterrey NL"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700">Responsable Rosé Catering</label>
                <Input 
                  value={responsible} 
                  onChange={(e) => setResponsible(e.target.value)} 
                  placeholder="Ej. Linda Camacho"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700">Fecha de Emisión</label>
                <Input 
                  value={emissionDate} 
                  onChange={(e) => setEmissionDate(e.target.value)} 
                  placeholder="Ej. Octubre 2026"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Menú y Paquete */}
          <Card className="border border-boho-sand bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-boho-sand/40">
              <CardTitle className="text-base font-serif font-bold text-boho-stone flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-boho-terracotta" /> Menú y Detalles del Servicio (Hoja 1)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-zinc-700">Tipo de Servicio</label>
                  <Input 
                    value={serviceType} 
                    onChange={(e) => setServiceType(e.target.value)} 
                    placeholder="Ej. Pizza Bar"
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-zinc-700">Menú Incluido</label>
                  <Input 
                    value={includedMenu} 
                    onChange={(e) => setIncludedMenu(e.target.value)} 
                    placeholder="Ej. Pizza + complementos"
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-zinc-700">Precio x Persona ($)</label>
                  <Input 
                    type="number"
                    value={pricePerPerson === "" ? "" : pricePerPerson} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setPricePerPerson(val === "" ? "" : parseFloat(val));
                    }} 
                    placeholder="Ej. 200.00"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Comida (Platillos y Variedades)</label>
                  <textarea
                    rows={4}
                    value={foodDetails}
                    onChange={(e) => setFoodDetails(e.target.value)}
                    placeholder="Ej. Variedad de pizzas: pepperoni, hawaiana, jamón, champiñones..."
                    className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-boho-terracotta"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Complementos y Aderezos</label>
                  <textarea
                    rows={4}
                    value={complementDetails}
                    onChange={(e) => setComplementDetails(e.target.value)}
                    placeholder="Ej. Aderezos de la casa, queso parmesano, chile quebrado..."
                    className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-boho-terracotta"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700">El Servicio Incluye (Equipo, personal, decoración)</label>
                <textarea
                  rows={3}
                  value={includesDetails}
                  onChange={(e) => setIncludesDetails(e.target.value)}
                  placeholder="Ej. 1 hora de servicio, Personal atendiendo, Desechables (platos, cubiertos), Decoración temática..."
                  className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-boho-terracotta"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Tabla Económica / Desglose (Hoja 2) */}
          <Card className="border border-boho-sand bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-boho-sand/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-serif font-bold text-boho-stone flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-boho-terracotta" /> Desglose Económico (Hoja 2)
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleAddItem("Flete / traslado", 1, 0, 200)}
                  className="text-xs border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                >
                  + Flete
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleAddItem()}
                  className="text-xs border-boho-terracotta text-boho-terracotta hover:bg-boho-terracotta/5"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar Fila
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-zinc-200 rounded-md">
                  <thead className="bg-boho-warm text-boho-stone border-b border-zinc-200">
                    <tr>
                      <th className="p-2">Descripción</th>
                      <th className="p-2 text-center w-16">Días</th>
                      <th className="p-2 text-center w-20">Personas</th>
                      <th className="p-2 text-right w-24">Precio Unit.</th>
                      <th className="p-2 text-right w-24">Subtotal</th>
                      <th className="p-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {tableItems.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/50">
                        <td className="p-2">
                          <Input 
                            value={item.description} 
                            onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                            placeholder="Ej. Pizza bar"
                            className="h-7 text-xs" 
                          />
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number"
                            value={item.serviceDays || ""} 
                            onChange={(e) => handleUpdateItem(item.id, "serviceDays", parseInt(e.target.value) || 1)}
                            className="h-7 text-xs text-center" 
                            placeholder="1"
                          />
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number"
                            value={item.peopleCount > 0 ? item.peopleCount : ""} 
                            onChange={(e) => handleUpdateItem(item.id, "peopleCount", parseInt(e.target.value) || 0)}
                            className="h-7 text-xs text-center" 
                            placeholder="-"
                          />
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number"
                            value={item.unitPrice || ""} 
                            onChange={(e) => handleUpdateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs text-right" 
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2 text-right font-medium text-zinc-800">
                          ${calculateItemSubtotal(item).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen de totales */}
              <div className="bg-boho-surface p-4 rounded-lg border border-boho-sand space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-zinc-800">
                    ${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeIva} 
                      onChange={(e) => setIncludeIva(e.target.checked)}
                      className="rounded text-boho-terracotta focus:ring-boho-terracotta"
                    />
                    <span>Incluir IVA (16%):</span>
                  </label>
                  <span className="font-semibold text-zinc-800">
                    ${ivaAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-boho-sand pt-2 flex justify-between text-sm font-bold text-boho-stone">
                  <span>TOTAL COTIZADO:</span>
                  <span className="text-boho-terracotta">
                    ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Condiciones y notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Condiciones de Pago</label>
                  <textarea
                    rows={3}
                    value={paymentConditions}
                    onChange={(e) => setPaymentConditions(e.target.value)}
                    className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-boho-terracotta"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Notas Adicionales</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-boho-terracotta"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA VISTA PREVIA DEL PDF EXACTO (HOJAS 1 Y 2) */}
        <div className={`space-y-6 ${activeTab === "preview" ? "lg:col-span-12 block" : "lg:col-span-5 hidden lg:block"}`}>
          <div className="sticky top-6 space-y-4">
            <div className="bg-boho-surface border border-boho-border px-4 py-3 rounded-lg text-xs text-boho-text flex items-center justify-between">
              <span className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-terracotta-600" />
                Vista previa del formato oficial (Carta / 2 páginas)
              </span>
              <span className="text-boho-text-muted text-[11px]">Rosé Catering Monterrey</span>
            </div>

            {/* CONTENEDOR DE AMBAS PÁGINAS A ESCALA (Con scroll horizontal táctil en pantallas chicas) */}
            <div className="space-y-6 max-h-[85vh] overflow-y-auto overflow-x-auto p-2 sm:p-4 bg-zinc-100 rounded-xl border border-zinc-300 shadow-inner">
              
              {/* ===================== HOJA 1 ===================== */}
              <div 
                ref={pdfPage1Ref}
                style={{ width: "612pt", minHeight: "792pt" }}
                className="bg-[#FAF8F5] text-[#2C2724] p-8 sm:p-12 shadow-md relative mx-auto flex flex-col justify-between shrink-0"
              >
                <div>
                  {/* Encabezado */}
                  <div className="flex justify-between items-start border-b-2 border-[#D4A373]/40 pb-5">
                    <div>
                      <h1 className="font-serif text-3xl font-bold tracking-wider text-[#A25F4B]">ROSÉ CATERING</h1>
                      <p className="text-xs tracking-widest text-[#6E645E] uppercase mt-0.5">Experiencias Gastronómicas • Monterrey</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-block bg-[#A25F4B] text-white font-serif tracking-widest text-sm px-4 py-1 font-semibold rounded-sm">
                        COTIZACIÓN
                      </div>
                      <p className="text-[11px] text-[#6E645E] mt-2">
                        <span className="font-semibold text-[#2C2724]">Fecha de emisión:</span> {emissionDate || "—"}
                      </p>
                      <p className="text-[11px] text-[#6E645E]">
                        <span className="font-semibold text-[#2C2724]">Responsable:</span> {responsible || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Datos Cliente */}
                  <div className="mt-6 bg-white/70 p-4 rounded border border-[#E6DED6]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#A25F4B] mb-2 border-b border-[#E6DED6] pb-1">
                      DATOS CLIENTE:
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <div><span className="font-semibold text-[#2C2724]">Nombre:</span> {clientName || "—"}</div>
                      <div><span className="font-semibold text-[#2C2724]">Teléfono:</span> {clientPhone || "—"}</div>
                      <div><span className="font-semibold text-[#2C2724]">Tipo de evento:</span> {eventType || "—"}</div>
                      <div><span className="font-semibold text-[#2C2724]">Fecha de evento:</span> {eventDate || "—"}</div>
                      <div><span className="font-semibold text-[#2C2724]">Horario:</span> {eventTime || "—"}</div>
                      <div><span className="font-semibold text-[#2C2724]">Número de personas:</span> {peopleCount ? peopleCount : "—"}</div>
                      <div className="col-span-2">
                        <span className="font-semibold text-[#2C2724]">Ubicación:</span> {eventLocation || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Detalle del Servicio */}
                  <div className="mt-5">
                    <div className="flex justify-between items-center bg-[#A25F4B]/10 px-4 py-2 rounded-t border border-[#D4A373]/30">
                      <div>
                        <span className="text-xs font-bold text-[#A25F4B] uppercase tracking-wider">DETALLE DEL SERVICIO:</span>
                        <span className="text-xs font-semibold text-[#2C2724] ml-2">{serviceType || "—"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#6E645E] mr-2">Precio por persona:</span>
                        <span className="text-sm font-bold text-[#A25F4B]">
                          {typeof pricePerPerson === "number" ? `$${pricePerPerson.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/70 px-4 py-2 border-x border-b border-[#E6DED6] text-xs">
                      <span className="font-semibold text-[#2C2724]">Menú incluido:</span> {includedMenu || "—"}
                    </div>
                  </div>

                  {/* Comida y Complementos */}
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="bg-white/80 p-4 rounded border border-[#E6DED6]">
                      <h4 className="text-xs font-bold tracking-wider uppercase text-[#A25F4B] border-b border-[#E6DED6] pb-1.5 mb-2.5">
                        COMIDA
                      </h4>
                      <p className="text-xs text-[#2C2724] whitespace-pre-line leading-relaxed">
                        {foodDetails || "Por definir con el cliente."}
                      </p>
                    </div>

                    <div className="bg-white/80 p-4 rounded border border-[#E6DED6]">
                      <h4 className="text-xs font-bold tracking-wider uppercase text-[#A25F4B] border-b border-[#E6DED6] pb-1.5 mb-2.5">
                        COMPLEMENTOS
                      </h4>
                      <p className="text-xs text-[#2C2724] whitespace-pre-line leading-relaxed">
                        {complementDetails || "Por definir con el cliente."}
                      </p>
                    </div>
                  </div>

                  {/* Incluye */}
                  <div className="mt-5 bg-white/80 p-4 rounded border border-[#E6DED6]">
                    <h4 className="text-xs font-bold tracking-wider uppercase text-[#A25F4B] border-b border-[#E6DED6] pb-1.5 mb-2">
                      INCLUYE:
                    </h4>
                    <p className="text-xs text-[#2C2724] whitespace-pre-line leading-relaxed">
                      {includesDetails || "Por definir con el cliente."}
                    </p>
                  </div>
                </div>

                {/* Footer Hoja 1 */}
                <div className="mt-8 pt-4 border-t border-[#D4A373]/40 text-center text-[10px] text-[#6E645E]">
                  <p className="font-serif font-medium text-[#2C2724]">Calle Florencia #135, Urbivilla del rey, CP: 64102 • Monterrey, Nuevo León</p>
                  <p className="mt-0.5">Tel: 81 3584 2443 • Rosé Catering Monterrey</p>
                </div>
              </div>

              {/* ===================== HOJA 2 ===================== */}
              <div 
                ref={pdfPage2Ref}
                style={{ width: "612pt", minHeight: "792pt" }}
                className="bg-[#FAF8F5] text-[#2C2724] p-8 sm:p-12 shadow-md relative mx-auto flex flex-col justify-between shrink-0"
              >
                <div>
                  {/* Encabezado Hoja 2 */}
                  <div className="flex justify-between items-start border-b-2 border-[#D4A373]/40 pb-5">
                    <div>
                      <h1 className="font-serif text-3xl font-bold tracking-wider text-[#A25F4B]">ROSÉ CATERING</h1>
                      <p className="text-xs tracking-widest text-[#6E645E] uppercase mt-0.5">Desglose Económico • Monterrey</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-block bg-[#A25F4B] text-white font-serif tracking-widest text-sm px-4 py-1 font-semibold rounded-sm">
                        COTIZACIÓN
                      </div>
                      <p className="text-[11px] text-[#6E645E] mt-2">
                        <span className="font-semibold text-[#2C2724]">Fecha de emisión:</span> {emissionDate || "—"}
                      </p>
                      <p className="text-[11px] text-[#6E645E]">
                        <span className="font-semibold text-[#2C2724]">Responsable:</span> {responsible || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Datos Cliente Breve */}
                  <div className="mt-5 bg-white/70 px-4 py-2.5 rounded border border-[#E6DED6] flex justify-between items-center text-xs">
                    <div><span className="font-semibold text-[#2C2724]">Cliente:</span> {clientName || "—"}</div>
                    <div><span className="font-semibold text-[#2C2724]">Teléfono:</span> {clientPhone || "—"}</div>
                    <div><span className="font-semibold text-[#2C2724]">Fecha Evento:</span> {eventDate || "—"}</div>
                  </div>

                  {/* Tabla Genérica por Día */}
                  <div className="mt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#A25F4B] mb-2">
                      TABLA GENÉRICA (POR DÍA)
                    </h3>
                    <table className="w-full text-left text-xs bg-white rounded border border-[#E6DED6] overflow-hidden">
                      <thead className="bg-[#A25F4B] text-white">
                        <tr>
                          <th className="p-2.5">Descripción</th>
                          <th className="p-2.5 text-center w-20">Días de servicio</th>
                          <th className="p-2.5 text-center w-28">Cantidad de personas x día</th>
                          <th className="p-2.5 text-right w-24">Precio unitario</th>
                          <th className="p-2.5 text-right w-24">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6DED6]">
                        {tableItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50">
                            <td className="p-2.5 font-medium">{item.description || "—"}</td>
                            <td className="p-2.5 text-center">{item.serviceDays}</td>
                            <td className="p-2.5 text-center">{item.peopleCount > 0 ? item.peopleCount : "-"}</td>
                            <td className="p-2.5 text-right">${item.unitPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                            <td className="p-2.5 text-right font-semibold">
                              ${calculateItemSubtotal(item).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bloque Subtotal e Impuestos */}
                  <div className="mt-4 flex justify-end">
                    <div className="w-64 bg-white p-3 rounded border border-[#E6DED6] space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#6E645E]">Subtotal:</span>
                        <span className="font-medium">${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>
                      {includeIva && (
                        <div className="flex justify-between">
                          <span className="text-[#6E645E]">IVA (16%):</span>
                          <span className="font-medium">${ivaAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="border-t border-[#E6DED6] pt-1.5 flex justify-between font-bold text-sm text-[#A25F4B]">
                        <span>TOTAL COTIZADO:</span>
                        <span>${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Condiciones y Notas */}
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="bg-white/80 p-3.5 rounded border border-[#E6DED6]">
                      <h4 className="text-xs font-bold tracking-wider uppercase text-[#A25F4B] mb-1.5 border-b border-[#E6DED6] pb-1">
                        CONDICIONES:
                      </h4>
                      <p className="text-[11px] text-[#2C2724] whitespace-pre-line leading-relaxed">
                        {paymentConditions}
                      </p>
                    </div>

                    <div className="bg-white/80 p-3.5 rounded border border-[#E6DED6]">
                      <h4 className="text-xs font-bold tracking-wider uppercase text-[#A25F4B] mb-1.5 border-b border-[#E6DED6] pb-1">
                        NOTAS:
                      </h4>
                      <p className="text-[11px] text-[#2C2724] whitespace-pre-line leading-relaxed">
                        {notes}
                      </p>
                    </div>
                  </div>

                  {/* Firmas */}
                  <div className="mt-8 pt-6 border-t border-[#E6DED6] grid grid-cols-2 gap-8 text-center text-xs">
                    <div>
                      <div className="border-b border-[#2C2724] w-48 mx-auto pb-4"></div>
                      <p className="mt-1 font-semibold text-[#2C2724]">Nombre del cliente</p>
                      <p className="text-[10px] text-[#6E645E]">{clientName || "Nombre del cliente"}</p>
                    </div>
                    <div>
                      <div className="border-b border-[#2C2724] w-48 mx-auto pb-4"></div>
                      <p className="mt-1 font-semibold text-[#2C2724]">Fecha y firma</p>
                      <p className="text-[10px] text-[#6E645E]">Rosé Catering</p>
                    </div>
                  </div>
                </div>

                {/* Footer Hoja 2 */}
                <div className="mt-8 pt-4 border-t border-[#D4A373]/40 text-center text-[10px] text-[#6E645E]">
                  <p className="font-serif font-medium text-[#2C2724]">Calle Florencia #135, Urbivilla del rey, CP: 64102 • Monterrey, Nuevo León</p>
                  <p className="mt-0.5">Tel: 81 3584 2443 • Rosé Catering Monterrey</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
