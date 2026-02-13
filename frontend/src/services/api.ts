/**
 * API Service
 * Wrapper para requests HTTP con autenticación JWT
 */

import { getAccessToken, useAuthStore, isTokenExpiringSoon } from '../stores/authStore';

const API_BASE_URL = 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Hace un request HTTP con manejo automático de JWT
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...fetchOptions } = options;

  // Preparar headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers
  };

  // Agregar JWT si es necesario
  if (requiresAuth) {
    let accessToken = getAccessToken();

    // Si el token está próximo a expirar, renovarlo
    if (accessToken && isTokenExpiringSoon(accessToken)) {
      const refreshed = await useAuthStore.getState().refreshAccessToken();
      if (refreshed) {
        accessToken = getAccessToken();
      }
    }

    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    } else {
      throw new Error('No access token available');
    }
  }

  // Hacer request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: requestHeaders
  });

  // Manejar errores
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    
    // Si es 401, intentar refresh
    if (response.status === 401 && requiresAuth) {
      const refreshed = await useAuthStore.getState().refreshAccessToken();
      if (refreshed) {
        // Reintentar request con nuevo token
        return apiRequest(endpoint, options);
      } else {
        // Logout si refresh falló
        useAuthStore.getState().logout();
        throw new Error('Session expired, please login again');
      }
    }
    
    throw new Error(error.error || error.message || 'Request failed');
  }

  return await response.json();
}

// ====================================
// API Methods
// ====================================

export const api = {
  // Auth (no requieren autenticación)
  auth: {
    register: (username: string, password: string) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ usuario: username, password }),
        requiresAuth: false
      }),

    login: (username: string, password: string) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usuario: username, password }),
        requiresAuth: false
      }),

    refresh: (refreshToken: string) =>
      apiRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        requiresAuth: false
      })
  },

  // World (protegidas con JWT)
  world: {
    getState: () => apiRequest('/world'),
    getNodes: () => apiRequest('/world/nodes'),
    getNode: (nodeId: string) => apiRequest(`/world/nodes/${nodeId}`)
  },

  // Player (protegidas con JWT)
  player: {
    getOnline: () => apiRequest('/player/list/online'),
    getInfo: (playerId: string) => apiRequest(`/player/${playerId}`)
  },

  // Characters (protegidas con JWT)
  character: {
    create: (data: any) =>
      apiRequest('/auth/character/create', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    list: (userId: number) =>
      apiRequest(`/auth/characters/${userId}`),

    load: (characterId: number) =>
      apiRequest('/auth/character/load', {
        method: 'POST',
        body: JSON.stringify({ personajeId: characterId })
      })
  },

  // Trading (protegidas con JWT)
  trade: {
    create: (targetId: number, offeredItems: any[], requestedItems: any[]) =>
      apiRequest('/trade/create', {
        method: 'POST',
        body: JSON.stringify({ targetId, offeredItems, requestedItems })
      }),

    respond: (tradeId: number, action: 'accept' | 'reject' | 'counter', counterOffer?: any) =>
      apiRequest(`/trade/${tradeId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action, counterOffer })
      }),

    confirm: (tradeId: number) =>
      apiRequest(`/trade/${tradeId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({})
      }),

    cancel: (tradeId: number) =>
      apiRequest(`/trade/${tradeId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({})
      }),

    getActive: () =>
      apiRequest('/trade/active'),

    getHistory: (limit: number = 20) =>
      apiRequest(`/trade/history?limit=${limit}`),

    getStats: () =>
      apiRequest('/trade/stats'),

    get: (tradeId: number) =>
      apiRequest(`/trade/${tradeId}`)
  },

  // Notifications (protegidas con JWT)
  notifications: {
    getAll: (params?: { category?: string; unreadOnly?: boolean; limit?: number; offset?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const query = queryParams.toString();
      return apiRequest(`/notifications${query ? '?' + query : ''}`);
    },

    getUnread: (limit?: number) => {
      const query = limit ? `?limit=${limit}` : '';
      return apiRequest(`/notifications/unread${query}`);
    },

    getCount: (category?: string) => {
      const query = category ? `?category=${category}` : '';
      return apiRequest(`/notifications/count${query}`);
    },

    markAsRead: (notificationId: string) =>
      apiRequest(`/notifications/${notificationId}/read`, {
        method: 'POST',
        body: JSON.stringify({})
      }),

    markAllAsRead: () =>
      apiRequest('/notifications/read-all', {
        method: 'POST',
        body: JSON.stringify({})
      }),

    delete: (notificationId: string) =>
      apiRequest(`/notifications/${notificationId}`, {
        method: 'DELETE'
      }),

    clearAll: () =>
      apiRequest('/notifications', {
        method: 'DELETE'
      }),

    getByCategory: (category: string) =>
      apiRequest(`/notifications/category/${category}`),

    getStats: () =>
      apiRequest('/notifications/stats')
  }
};

export default api;
