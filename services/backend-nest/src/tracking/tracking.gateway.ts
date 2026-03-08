import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthUser, TrackingSubscribeSchema } from '@ashwa/shared';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';

@Injectable()
@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class TrackingGateway implements OnGatewayConnection {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const rawToken = client.handshake.auth?.token || client.handshake.headers.authorization;
    const token = typeof rawToken === 'string' ? rawToken.replace(/^Bearer\s+/i, '') : '';
    if (!token) {
      client.disconnect();
      throw new UnauthorizedException('Missing socket token');
    }

    client.data.user = this.jwtService.verify(token) as AuthUser & { sub?: string };
  }

  @SubscribeMessage('subscribe')
  async subscribe(
    @MessageBody() body: { driverId?: string; tripId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as AuthUser & { sub?: string };
    const subscription = TrackingSubscribeSchema.parse(body);
    const userId = user.userId || user.sub;

    if (subscription.driverId) {
      const allowed =
        user.role === 'DRIVER'
          ? subscription.driverId === userId
          : !!(await this.prisma.assignment.findFirst({
              where: {
                driverId: subscription.driverId,
                status: 'ACCEPTED',
                child: { parentId: userId },
              },
            }));
      if (!allowed) {
        throw new ForbiddenException('Driver room not allowed');
      }
      client.join(`driver:${subscription.driverId}`);
    }

    if (subscription.tripId) {
      const allowed =
        user.role === 'DRIVER'
          ? !!(await this.prisma.trip.findFirst({
              where: { id: subscription.tripId, routeTemplate: { driverId: userId } },
            }))
          : !!(await this.prisma.trip.findFirst({
              where: {
                id: subscription.tripId,
                stops: { some: { child: { parentId: userId } } },
              },
            }));
      if (!allowed) {
        throw new ForbiddenException('Trip room not allowed');
      }
      client.join(`trip:${subscription.tripId}`);

      const latestPing = await this.prisma.locationPing.findFirst({
        where: { tripId: subscription.tripId },
        orderBy: { timestamp: 'desc' },
      });
      if (latestPing) {
        client.emit('location', latestPing);
      }
    }

    return { ok: true };
  }

  broadcastLocation(payload: any) {
    this.server.to(`driver:${payload.driverId}`).emit('location', payload);
    if (payload.tripId) this.server.to(`trip:${payload.tripId}`).emit('location', payload);
  }
}
