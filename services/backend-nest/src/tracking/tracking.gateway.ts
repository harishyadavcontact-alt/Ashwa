import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class TrackingGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('subscribe')
  subscribe(@MessageBody() body: { driverId?: string; tripId?: string }, @ConnectedSocket() client: Socket) {
    if (body.driverId) client.join(`driver:${body.driverId}`);
    if (body.tripId) client.join(`trip:${body.tripId}`);
    return { ok: true };
  }

  broadcastLocation(payload: any) {
    this.server.to(`driver:${payload.driverId}`).emit('location', payload);
    if (payload.tripId) this.server.to(`trip:${payload.tripId}`).emit('location', payload);
  }
}
