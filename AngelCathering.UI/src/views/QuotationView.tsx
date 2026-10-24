import React, { useState, useRef } from "react";
import { 
  Calculator, 
  FileDown, 
  Plus, 
  Trash2, 
  User, 
  FileText,
  Sparkles,
  Eye,
  RefreshCw
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface QuoteItem {
  id: string;
  description: string;
  serviceDays: number;
  peopleCount: number;
  unitPrice: number;
}

export const QuotationView: React.FC = () => {
  // Datos Generales de la Cotización
  const [responsible, setResponsible] = useState("Linda Camacho");
  const [emissionDate, setEmissionDate] = useState("Octubre 2026");
  
  // Datos del Cliente
  const [clientName, setClientName] = useState("Pao");
  const [clientPhone, setClientPhone] = useState("8117603902");
  const [eventType, setEventType] = useState("Social");
  const [eventDate, setEventDate] = useState("23 Octubre 2026");
  const [eventTime, setEventTime] = useState("08:00 pm");
  const [eventLocation, setEventLocation] = useState("Calle sain alto #236 Col. Mitras centro, Monterrey NL");
  const [peopleCount, setPeopleCount] = useState<number>(30);

  // Detalle del Servicio (Página 1)
  const [serviceType, setServiceType] = useState("Pizza Bar");
  const [includedMenu, setIncludedMenu] = useState("Pizza + complementos");
  const [pricePerPerson, setPricePerPerson] = useState<number>(200);

  // Lista de Comida y Complementos
  const [foodDetails, setFoodDetails] = useState<string>(
    "Variedad de pizzas: pepperoni, hawaiana, jamón, champiñones, 2 quesos\n\nPasta (a elegir)\n\nEnsalada italiana"
  );
  const [complementDetails, setComplementDetails] = useState<string>(
    "Aderezos\n\nQueso parmesano\n\nChile quebrado"
  );

  // Incluye
  const [includesDetails, setIncludesDetails] = useState<string>(
    "1 hora de servicio\nPersonal atendiendo\nDesechables (platos, cubiertos)\nDecoración"
  );

  // Tabla Genérica por Día (Página 2)
  const [tableItems, setTableItems] = useState<QuoteItem[]>([
    {
      id: "item-1",
      description: "Pizza bar",
      serviceDays: 1,
      peopleCount: 30,
      unitPrice: 200
    },
    {
      id: "item-2",
      description: "Flete/ traslado",
      serviceDays: 1,
      peopleCount: 0,
      unitPrice: 200
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

  // Estado de exportación
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const pdfPage1Ref = useRef<HTMLDivElement>(null);
  const pdfPage2Ref = useRef<HTMLDivElement>(null);

  // Cálculos
  const calculateItemSubtotal = (item: QuoteItem) => {
    if (item.peopleCount > 0) {
      return item.serviceDays * item.peopleCount * item.unitPrice;
    }
    return item.serviceDays * item.unitPrice;
  };

  const subtotal = tableItems.reduce((acc, item) => acc + calculateItemSubtotal(item), 0);
  const ivaAmount = includeIva ? subtotal * 0.16 : 0;
  const total = subtotal + ivaAmount;

  // Manejo de ítems de la tabla
  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      description: "Servicio adicional",
      serviceDays: 1,
      peopleCount: 0,
      unitPrice: 0
    };
    setTableItems([...tableItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setTableItems(tableItems.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setTableItems(tableItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Sincronizar personas cuando se cambia el dato principal
  const handleMainPeopleChange = (newCount: number) => {
    setPeopleCount(newCount);
    setTableItems(tableItems.map(item => {
      if (item.peopleCount > 0) {
        return { ...item, peopleCount: newCount };
      }
      return item;
    }));
  };

  // Generar PDF
  const handleExportPDF = async () => {
    if (!pdfPage1Ref.current || !pdfPage2Ref.current) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter" // 612 x 792 pt
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

      // Descargar archivo
      const sanitizedName = clientName.replace(/[^a-zA-Z0-9]/g, "_") || "Cliente";
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
            <Sparkles className="h-3.5 w-3.5" /> Cotizador Formal de Eventos
          </div>
          <h1 className="font-serif text-3xl font-bold text-boho-stone">Generador de Cotizaciones</h1>
          <p className="text-sm text-boho-muted">
            Diseñado con la estructura oficial de Rosé Catering Monterrey.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-boho-warm p-1 rounded-lg border border-boho-sand flex gap-1">
            <Button
              type="button"
              variant={activeTab === "editor" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("editor")}
              className={`text-xs ${activeTab === "editor" ? "bg-boho-terracotta text-white" : "text-boho-stone"}`}
            >
              <FileText className="h-3.5 w-3.5 mr-1" /> Formulario
            </Button>
            <Button
              type="button"
              variant={activeTab === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("preview")}
              className={`text-xs ${activeTab === "preview" ? "bg-boho-terracotta text-white" : "text-boho-stone"}`}
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> Vista Previa
            </Button>
          </div>

          <Button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-boho-terracotta hover:bg-terracotta-700 text-white text-xs font-medium shadow-sm transition-all"
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
                <label className="text-xs font-semibold text-zinc-700">Nombre del Cliente</label>
                <Input 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  placeholder="Ej. Pao"
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
                  placeholder="Ej. Social / Boda / Corporativo"
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
                  value={peopleCount} 
                  onChange={(e) => handleMainPeopleChange(parseInt(e.target.value) || 0)} 
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
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700">Fecha de Emisión</label>
                <Input 
                  value={emissionDate} 
                  onChange={(e) => setEmissionDate(e.target.value)} 
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
                    value={pricePerPerson} 
                    onChange={(e) => setPricePerPerson(parseFloat(e.target.value) || 0)} 
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
                    className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-boho-terracotta"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Complementos y Aderezos</label>
                  <textarea
                    rows={4}
                    value={complementDetails}
                    onChange={(e) => setComplementDetails(e.target.value)}
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
                  className="w-full text-xs rounded-md border border-zinc-200 p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-boho-terracotta"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Tabla Económica / Desglose (Hoja 2) */}
          <Card className="border border-boho-sand bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-boho-sand/40 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-serif font-bold text-boho-stone flex items-center gap-2">
                <Calculator className="h-4 w-4 text-boho-terracotta" /> Desglose Económico (Hoja 2)
              </CardTitle>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={handleAddItem}
                className="text-xs border-boho-terracotta text-boho-terracotta hover:bg-boho-terracotta/5"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar Fila
              </Button>
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
                            className="h-7 text-xs" 
                          />
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number"
                            value={item.serviceDays} 
                            onChange={(e) => handleUpdateItem(item.id, "serviceDays", parseInt(e.target.value) || 1)}
                            className="h-7 text-xs text-center" 
                          />
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number"
                            value={item.peopleCount} 
                            onChange={(e) => handleUpdateItem(item.id, "peopleCount", parseInt(e.target.value) || 0)}
                            className="h-7 text-xs text-center" 
                            placeholder="-"
                          />
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number"
                            value={item.unitPrice} 
                            onChange={(e) => handleUpdateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs text-right" 
                          />
                        </td>
                        <td className="p-2 text-right font-medium text-zinc-800">
                          ${calculateItemSubtotal(item).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center">
                          {tableItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
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
            <div className="bg-boho-warm border border-boho-sand px-4 py-3 rounded-lg text-xs text-boho-stone flex items-center justify-between">
              <span className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-boho-terracotta" />
                Vista previa del formato oficial (Carta / 2 páginas)
              </span>
              <span className="text-boho-muted text-[11px]">Rosé Catering Monterrey</span>
            </div>

            {/* CONTENEDOR DE AMBAS PÁGINAS A ESCALA */}
            <div className="space-y-6 max-h-[85vh] overflow-y-auto p-3 bg-zinc-100 rounded-xl border border-zinc-300 shadow-inner">
              
              {/* ===================== HOJA 1 ===================== */}
              <div 
                ref={pdfPage1Ref}
                style={{ width: "612pt", minHeight: "792pt" }}
                className="bg-[#FAF8F5] text-[#2C2724] p-12 shadow-md relative mx-auto flex flex-col justify-between"
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
                        <span className="font-semibold text-[#2C2724]">Fecha de emisión:</span> {emissionDate}
                      </p>
                      <p className="text-[11px] text-[#6E645E]">
                        <span className="font-semibold text-[#2C2724]">Responsable:</span> {responsible}
                      </p>
                    </div>
                  </div>

                  {/* Datos Cliente */}
                  <div className="mt-6 bg-white/70 p-4 rounded border border-[#E6DED6]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#A25F4B] mb-2 border-b border-[#E6DED6] pb-1">
                      DATOS CLIENTE:
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <div><span className="font-semibold text-[#2C2724]">Nombre:</span> {clientName}</div>
                      <div><span className="font-semibold text-[#2C2724]">Teléfono:</span> {clientPhone}</div>
                      <div><span className="font-semibold text-[#2C2724]">Tipo de evento:</span> {eventType}</div>
                      <div><span className="font-semibold text-[#2C2724]">Fecha de evento:</span> {eventDate}</div>
                      <div><span className="font-semibold text-[#2C2724]">Horario:</span> {eventTime}</div>
                      <div><span className="font-semibold text-[#2C2724]">Número de personas:</span> {peopleCount}</div>
                      <div className="col-span-2">
                        <span className="font-semibold text-[#2C2724]">Ubicación:</span> {eventLocation}
                      </div>
                    </div>
                  </div>

                  {/* Detalle del Servicio */}
                  <div className="mt-5">
                    <div className="flex justify-between items-center bg-[#A25F4B]/10 px-4 py-2 rounded-t border border-[#D4A373]/30">
                      <div>
                        <span className="text-xs font-bold text-[#A25F4B] uppercase tracking-wider">DETALLE DEL SERVICIO:</span>
                        <span className="text-xs font-semibold text-[#2C2724] ml-2">{serviceType}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#6E645E] mr-2">Precio por persona:</span>
                        <span className="text-sm font-bold text-[#A25F4B]">
                          ${pricePerPerson.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/70 px-4 py-2 border-x border-b border-[#E6DED6] text-xs">
                      <span className="font-semibold text-[#2C2724]">Menú incluido:</span> {includedMenu}
                    </div>
                  </div>

                  {/* Comida y Complementos */}
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="bg-white/80 p-4 rounded border border-[#E6DED6]">
                      <h4 className="text-xs font-bold tracking-wider uppercase text-[#A25F4B] border-b border-[#E6DED6] pb-1.5 mb-2.5">
                        COMIDA
                      </h4>
                      <p className="text-xs text-[#2C2724] whitespace-pre-line leading-relaxed">
                        {foodDetails}
                      </p>
                    </div>

                    <div className="bg-white/80 p-4 rounded border border-[#E6DED6]">
                      <h4 className="text-xs font-bold tracking-wider uppercase text-[#A25F4B] border-b border-[#E6DED6] pb-1.5 mb-2.5">
                        COMPLEMENTOS
                      </h4>
                      <p className="text-xs text-[#2C2724] whitespace-pre-line leading-relaxed">
                        {complementDetails}
                      </p>
                    </div>
                  </div>

                  {/* Incluye */}
                  <div className="mt-5 bg-white/80 p-4 rounded border border-[#E6DED6]">
                    <h4 className="text-xs font-bold tracking-wider uppercase text-[#A25F4B] border-b border-[#E6DED6] pb-1.5 mb-2">
                      INCLUYE:
                    </h4>
                    <p className="text-xs text-[#2C2724] whitespace-pre-line leading-relaxed">
                      {includesDetails}
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
                className="bg-[#FAF8F5] text-[#2C2724] p-12 shadow-md relative mx-auto flex flex-col justify-between"
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
                        <span className="font-semibold text-[#2C2724]">Fecha de emisión:</span> {emissionDate}
                      </p>
                      <p className="text-[11px] text-[#6E645E]">
                        <span className="font-semibold text-[#2C2724]">Responsable:</span> {responsible}
                      </p>
                    </div>
                  </div>

                  {/* Datos Cliente Breve */}
                  <div className="mt-5 bg-white/70 px-4 py-2.5 rounded border border-[#E6DED6] flex justify-between items-center text-xs">
                    <div><span className="font-semibold text-[#2C2724]">Cliente:</span> {clientName}</div>
                    <div><span className="font-semibold text-[#2C2724]">Teléfono:</span> {clientPhone}</div>
                    <div><span className="font-semibold text-[#2C2724]">Fecha Evento:</span> {eventDate}</div>
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
                            <td className="p-2.5 font-medium">{item.description}</td>
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
                      <p className="text-[10px] text-[#6E645E]">{clientName}</p>
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
