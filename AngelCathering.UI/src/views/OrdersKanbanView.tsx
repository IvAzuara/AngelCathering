import React, { useEffect, useState } from "react";
import { api, type Order } from "@/services/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Flame, Calendar, Users, DollarSign, Phone, 
  ArrowRight, ArrowLeft, CheckCircle2, XCircle, Trash2, Edit2,
  FileSpreadsheet
} from "lucide-react";

interface OrdersKanbanViewProps {
  onOpenInQuotation?: (order: Order) => void;
}

export const OrdersKanbanView: React.FC<OrdersKanbanViewProps> = ({ onOpenInQuotation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modal formulario de creación/edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Partial<Order> | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        api.getActiveOrders(),
        api.getHistoryOrders(),
      ]);
      setOrders(active);
      setHistoryOrders(history);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(id, newStatus);
      await loadOrders();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el estado del pedido.");
    }
  };

  const handleToggleUrgent = async (order: Order) => {
    try {
      await api.updateOrderStatus(order.idOrder, order.status, !order.isUrgent);
      await loadOrders();
    } catch (err) {
      console.error(err);
      alert("Error al cambiar la urgencia.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Deseas eliminar definitivamente este pedido?")) return;
    try {
      await api.deleteOrder(id);
      await loadOrders();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar pedido.");
    }
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder?.customerName || !editingOrder?.eventDate) {
      alert("Por favor completa los campos requeridos.");
      return;
    }

    try {
      await api.saveOrder(editingOrder);
      setIsModalOpen(false);
      setEditingOrder(null);
      await loadOrders();
    } catch (err) {
      console.error(err);
      alert("Error al guardar el pedido.");
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "PENDIENTE");
  const inProgressOrders = orders.filter((o) => o.status === "EN_PROCESO");

  return (
    <div className="space-y-6">
      {/* Barra de cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-zinc-200">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Gestión de Pedidos &amp; Servicios</h2>
          <p className="text-sm text-zinc-500">
            Control visual de pedidos de catering, eventos en proceso, prioridades urgentes e histórico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showHistory ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Ver Tablero Activo" : `Ver Histórico (${historyOrders.length})`}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingOrder({
                customerName: "",
                customerPhone: "",
                customerEmail: "",
                eventType: "Banquete de Bodas",
                eventDate: new Date().toISOString().split("T")[0],
                guestCount: 50,
                status: "PENDIENTE",
                isUrgent: false,
                sortPriority: 0,
                totalEstimated: 0,
                notes: "",
              });
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Nuevo Pedido
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2" />
          <p>Cargando pedidos...</p>
        </div>
      ) : showHistory ? (
        /* VISTA DE HISTÓRICO */
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-zinc-800">Histórico de Pedidos Terminados</h3>
          {historyOrders.length === 0 ? (
            <p className="text-zinc-500 text-sm py-8 text-center">No hay pedidos en el histórico aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Evento / Fecha</th>
                    <th className="py-3 px-4">Invitados</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {historyOrders.map((o) => (
                    <tr key={o.idOrder} className="hover:bg-zinc-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900">{o.customerName}</div>
                        <div className="text-xs text-zinc-400">{o.customerPhone || "Sin teléfono"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-800">{o.eventType}</div>
                        <div className="text-xs text-zinc-500">{new Date(o.eventDate).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-4">{o.guestCount} personas</td>
                      <td className="py-3 px-4 font-semibold text-zinc-900">${Number(o.totalEstimated).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={o.status === "COMPLETADO" ? "success" : "secondary"}>
                          {o.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(o.idOrder, "PENDIENTE")}
                          title="Reactivar pedido"
                        >
                          Reactivar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* VISTA KANBAN (PENDIENTES vs EN PROCESO) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna 1: Pendientes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-amber-400">
              <span className="font-bold text-zinc-800 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-400" /> Pendientes
              </span>
              <Badge variant="warning">{pendingOrders.length}</Badge>
            </div>

            <div className="space-y-3">
              {pendingOrders.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-sm">
                  Sin pedidos pendientes
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <OrderCard
                    key={order.idOrder}
                    order={order}
                    onToggleUrgent={() => handleToggleUrgent(order)}
                    onAdvance={() => handleStatusChange(order.idOrder, "EN_PROCESO")}
                    onEdit={() => {
                      setEditingOrder(order);
                      setIsModalOpen(true);
                    }}
                    onDelete={() => handleDelete(order.idOrder)}
                    onOpenInQuotation={onOpenInQuotation ? () => onOpenInQuotation(order) : undefined}
                  />
                ))
              )}
            </div>
          </div>

          {/* Columna 2: En Proceso */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-indigo-500">
              <span className="font-bold text-zinc-800 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-indigo-500" /> En Proceso
              </span>
              <Badge variant="default">{inProgressOrders.length}</Badge>
            </div>

            <div className="space-y-3">
              {inProgressOrders.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-sm">
                  Sin pedidos en preparación
                </div>
              ) : (
                inProgressOrders.map((order) => (
                  <OrderCard
                    key={order.idOrder}
                    order={order}
                    isInProgress
                    onToggleUrgent={() => handleToggleUrgent(order)}
                    onBack={() => handleStatusChange(order.idOrder, "PENDIENTE")}
                    onComplete={() => handleStatusChange(order.idOrder, "COMPLETADO")}
                    onCancel={() => handleStatusChange(order.idOrder, "CANCELADO")}
                    onEdit={() => {
                      setEditingOrder(order);
                      setIsModalOpen(true);
                    }}
                    onDelete={() => handleDelete(order.idOrder)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal / Dialog para Crear / Editar Pedido */}
      {isModalOpen && editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingOrder.idOrder ? "Editar Pedido" : "Registrar Pedido Manual"}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSaveOrder}>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Nombre del Cliente *</label>
                  <Input
                    required
                    value={editingOrder.customerName || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
                    placeholder="Ej. María González"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Teléfono / WhatsApp</label>
                    <Input
                      value={editingOrder.customerPhone || ""}
                      onChange={(e) => setEditingOrder({ ...editingOrder, customerPhone: e.target.value })}
                      placeholder="+52 55 ..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Email</label>
                    <Input
                      type="email"
                      value={editingOrder.customerEmail || ""}
                      onChange={(e) => setEditingOrder({ ...editingOrder, customerEmail: e.target.value })}
                      placeholder="cliente@correo.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Tipo de Evento</label>
                    <Input
                      value={editingOrder.eventType || ""}
                      onChange={(e) => setEditingOrder({ ...editingOrder, eventType: e.target.value })}
                      placeholder="Boda, XV Años, Empresarial"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Fecha del Evento *</label>
                    <Input
                      type="date"
                      required
                      value={editingOrder.eventDate ? new Date(editingOrder.eventDate).toISOString().split("T")[0] : ""}
                      onChange={(e) => setEditingOrder({ ...editingOrder, eventDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Número de Invitados</label>
                    <Input
                      type="number"
                      min="1"
                      value={editingOrder.guestCount || 1}
                      onChange={(e) => setEditingOrder({ ...editingOrder, guestCount: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-700">Monto Estimado ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingOrder.totalEstimated || 0}
                      onChange={(e) => setEditingOrder({ ...editingOrder, totalEstimated: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isUrgent"
                    checked={editingOrder.isUrgent || false}
                    onChange={(e) => setEditingOrder({ ...editingOrder, isUrgent: e.target.checked })}
                    className="h-4 w-4 rounded text-red-600 focus:ring-red-500 border-zinc-300"
                  />
                  <label htmlFor="isUrgent" className="text-sm font-semibold text-red-600 cursor-pointer flex items-center gap-1">
                    <Flame className="h-4 w-4" /> Marcar como Pedido URGENTE
                  </label>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">Notas / Detalles Especiales</label>
                  <Textarea
                    value={editingOrder.notes || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                    placeholder="Alergias, menú especial, horario de montaje..."
                  />
                </div>
              </CardContent>
              <div className="p-4 border-t border-zinc-100 flex justify-end gap-2 bg-zinc-50 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar Pedido
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// Tarjeta Individual de Pedido
interface OrderCardProps {
  order: Order;
  isInProgress?: boolean;
  onToggleUrgent: () => void;
  onAdvance?: () => void;
  onBack?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenInQuotation?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isInProgress,
  onToggleUrgent,
  onAdvance,
  onBack,
  onComplete,
  onCancel,
  onEdit,
  onDelete,
  onOpenInQuotation,
}) => {
  const isOnlineRequest = order.notes?.includes("[SOLICITUD EN LÍNEA]");

  return (
    <Card className={`border shadow-xs transition-all ${
      order.isUrgent 
        ? 'border-red-400 bg-red-50/30 ring-1 ring-red-400' 
        : isOnlineRequest 
          ? 'border-terracotta-300 bg-terracotta-50/20' 
          : 'border-zinc-200 bg-white'
    }`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-900">{order.customerName}</span>
              {order.isUrgent && (
                <Badge variant="urgent" className="gap-0.5">
                  <Flame className="h-3 w-3 fill-red-600" /> URGENTE
                </Badge>
              )}
              {isOnlineRequest && (
                <span className="text-[10px] bg-terracotta-100 text-terracotta-800 font-semibold px-2 py-0.5 rounded-full border border-terracotta-200">
                  Web
                </span>
              )}
            </div>
            <div className="text-xs font-medium text-terracotta-700 mt-0.5">{order.eventType}</div>
          </div>
          <div className="flex items-center gap-1">
            {onOpenInQuotation && (
              <button
                onClick={onOpenInQuotation}
                title="Abrir y cotizar formalmente en PDF"
                className="p-1 rounded hover:bg-terracotta-100 text-terracotta-600 hover:text-terracotta-800"
              >
                <FileSpreadsheet className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onToggleUrgent}
              title={order.isUrgent ? "Quitar urgencia" : "Marcar urgente"}
              className={`p-1 rounded hover:bg-zinc-100 text-xs ${order.isUrgent ? 'text-red-600' : 'text-zinc-400'}`}
            >
              <Flame className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-1 space-y-2 text-xs text-zinc-600">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            {new Date(order.eventDate).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-zinc-400" />
            {order.guestCount} pax
          </span>
          {order.customerPhone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-zinc-400" />
              {order.customerPhone}
            </span>
          )}
          <span className="flex items-center gap-1 font-semibold text-zinc-800">
            <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
            ${Number(order.totalEstimated).toFixed(2)}
          </span>
        </div>

        {order.notes && (
          <p className="bg-zinc-50 p-2 rounded text-zinc-600 text-xs italic border border-zinc-100">
            {order.notes}
          </p>
        )}

        {/* Acciones de Flujo de Estado */}
        <div className="pt-2 flex items-center justify-between border-t border-zinc-100 gap-2">
          {!isInProgress ? (
            <Button size="sm" className="w-full text-xs h-7" onClick={onAdvance}>
              Iniciar Preparación <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <div className="flex items-center gap-1 w-full justify-between">
              <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={onBack}>
                <ArrowLeft className="h-3 w-3 mr-1" /> Regresar
              </Button>
              <div className="flex gap-1">
                <Button size="sm" variant="destructive" className="text-xs h-7 px-2" onClick={onCancel}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
                </Button>
                <Button size="sm" className="text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onComplete}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Terminado
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
