import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';
import { NotificationsService } from '../notifications.service';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.notificationsService.setServer(server);
  }

  async handleConnection(client: Socket) {
    try {
      const raw =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.headers.authorization as string | undefined)?.replace(
          /^Bearer\s+/i,
          '',
        );

      if (!raw) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(raw, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      client.data.user = payload;
      client.join(`user:${payload.sub}`);

      if (payload.role === 'ADMIN') {
        client.join('admin');
      }
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    client.emit('pong', { at: new Date().toISOString(), body });
  }
}