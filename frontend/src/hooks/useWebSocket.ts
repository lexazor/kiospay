'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/websocket';

interface UseWebSocketHandlers {
  onDepositStatus?: (payload: unknown) => void;
  onOrderStatus?: (payload: unknown) => void;
  onAdminDepositNew?: (payload: unknown) => void;
}

export function useWebSocket(handlers: UseWebSocketHandlers) {
  useEffect(() => {
    const socket = getSocket();

    if (handlers.onDepositStatus) {
      socket.on('deposit:status', handlers.onDepositStatus);
    }

    if (handlers.onOrderStatus) {
      socket.on('order:status', handlers.onOrderStatus);
    }

    if (handlers.onAdminDepositNew) {
      socket.on('admin:deposit_new', handlers.onAdminDepositNew);
    }

    return () => {
      if (handlers.onDepositStatus) {
        socket.off('deposit:status', handlers.onDepositStatus);
      }

      if (handlers.onOrderStatus) {
        socket.off('order:status', handlers.onOrderStatus);
      }

      if (handlers.onAdminDepositNew) {
        socket.off('admin:deposit_new', handlers.onAdminDepositNew);
      }
    };
  }, [handlers.onAdminDepositNew, handlers.onDepositStatus, handlers.onOrderStatus]);
}