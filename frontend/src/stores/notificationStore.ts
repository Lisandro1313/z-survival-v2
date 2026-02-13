import { create } from 'zustand';
import ApiService from '../services/api';

export interface Notification {
  id: string;
  playerId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'trade' | 'combat' | 'social' | 'system' | 'radio' | 'events';
  priority: 'low' | 'normal' | 'high' | 'critical';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  expiresAt: number;
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  fetchUnread: () => Promise<void>;
  updateUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  handleWebSocketNotification: (data: any) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await ApiService.notifications.getAll({ limit: 50 });
      set({ 
        notifications: response.data.notifications,
        unreadCount: response.data.unreadCount,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      set({ 
        error: error.response?.data?.error || 'Error al cargar notificaciones',
        isLoading: false 
      });
    }
  },

  fetchUnread: async () => {
    try {
      const response = await ApiService.notifications.getUnread(20);
      set({ notifications: response.data.notifications });
    } catch (error: any) {
      console.error('Error fetching unread notifications:', error);
    }
  },

  updateUnreadCount: async () => {
    try {
      const response = await ApiService.notifications.getCount();
      set({ unreadCount: response.data.count });
    } catch (error: any) {
      console.error('Error updating unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await ApiService.notifications.markAsRead(notificationId);
      
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await ApiService.notifications.markAllAsRead();
      
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error: any) {
      console.error('Error marking all as read:', error);
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await ApiService.notifications.delete(notificationId);
      
      set(state => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
    }
  },

  clearAll: async () => {
    try {
      await ApiService.notifications.clearAll();
      set({ notifications: [], unreadCount: 0 });
    } catch (error: any) {
      console.error('Error clearing all notifications:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  handleWebSocketNotification: (data: any) => {
    switch (data.type) {
      case 'notification:new':
        get().addNotification(data.notification);
        break;
      
      case 'notification:read':
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === data.notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
        break;
      
      case 'notification:read_all':
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }));
        break;
    }
  },
}));
