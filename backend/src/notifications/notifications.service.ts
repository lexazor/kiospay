import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class NotificationsService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitBalanceUpdated(userId: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit('balance:updated', payload);
  }

  emitDepositStatus(userId: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit('deposit:status', payload);
  }

  emitOrderStatus(userId: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit('order:status', payload);
  }

  emitAdminDepositNew(payload: unknown) {
    this.server?.to('admin').emit('admin:deposit_new', payload);
  }
}