const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface MenuItem {
  idItem: number;
  idCategory: number;
  categoryName: string;
  title: string;
  description?: string;
  price: number;
  unitLabel: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface MenuCategory {
  idCategory: number;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  items: MenuItem[];
}

export interface Order {
  idOrder: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  status: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
  isUrgent: boolean;
  sortPriority: number;
  totalEstimated: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Menu público
  getPublicMenu: async (): Promise<MenuCategory[]> => {
    const res = await fetch(`${BASE_URL}/api/menu/public`);
    if (!res.ok) throw new Error('Error al cargar menú');
    return res.json();
  },

  // Auth
  login: async (username: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    return res.json();
  },

  // Menu Admin
  getMenuItems: async (): Promise<MenuItem[]> => {
    const res = await fetch(`${BASE_URL}/api/menu/items`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error al obtener platillos');
    return res.json();
  },

  getCategories: async (): Promise<MenuCategory[]> => {
    const res = await fetch(`${BASE_URL}/api/menu/categories`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error al obtener categorías');
    return res.json();
  },

  saveMenuItem: async (item: Partial<MenuItem>) => {
    const isUpdate = !!item.idItem;
    const url = isUpdate ? `${BASE_URL}/api/menu/items/${item.idItem}` : `${BASE_URL}/api/menu/items`;
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Error al guardar platillo');
    return res.status === 204 ? null : res.json();
  },

  deleteMenuItem: async (id: number) => {
    const res = await fetch(`${BASE_URL}/api/menu/items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error al eliminar platillo');
  },

  // Pedidos
  getActiveOrders: async (): Promise<Order[]> => {
    const res = await fetch(`${BASE_URL}/api/orders/active`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error al obtener pedidos activos');
    return res.json();
  },

  getHistoryOrders: async (): Promise<Order[]> => {
    const res = await fetch(`${BASE_URL}/api/orders/history`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error al obtener historial');
    return res.json();
  },

  saveOrder: async (order: Partial<Order>) => {
    const isUpdate = !!order.idOrder;
    const url = isUpdate ? `${BASE_URL}/api/orders/${order.idOrder}` : `${BASE_URL}/api/orders`;
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error('Error al guardar pedido');
    return res.status === 204 ? null : res.json();
  },

  updateOrderStatus: async (id: number, status: string, isUrgent?: boolean, sortPriority?: number) => {
    const res = await fetch(`${BASE_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, isUrgent, sortPriority }),
    });
    if (!res.ok) throw new Error('Error al actualizar estado');
  },

  deleteOrder: async (id: number) => {
    const res = await fetch(`${BASE_URL}/api/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error al eliminar pedido');
  },
};
