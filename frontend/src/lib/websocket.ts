'use client';

import { io, type Socket } from 'socket.io-client';
import { APP_CONFIG } from './config';

let socket: Socket | null = null;

export function getSocket(accessToken?: string) {
  if (socket) {
    return socket;
  }

  socket = io(APP_CONFIG.backendUrl, {
    transports: ['websocket'],
    autoConnect: true,
    auth: accessToken ? { token: accessToken } : undefined,
    withCredentials: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
}