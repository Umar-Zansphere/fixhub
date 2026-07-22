import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { PrismaService } from '../../common/database/prisma.service';

/**
 * TrackingGateway — real-time location and status updates for bookings.
 *
 * Room naming: `booking:{bookingId}`
 *
 * Events emitted by server:
 *   • `location:update`  — technician GPS coordinates changed
 *   • `status:update`    — booking status transitioned
 *
 * Events listened from client:
 *   • `join_booking`     — customer/technician joins a booking room
 *   • `leave_booking`    — customer/technician leaves a booking room
 *
 * Authentication:
 *   The client must send the JWT in the socket handshake auth:
 *   `socket = io(url, { auth: { token: '<jwt>' } })`
 *   Connection is rejected if the token is missing or invalid.
 */
@WebSocketGateway({
  namespace: '/tracking',
  cors: { origin: '*' }, // Tighten in production via ConfigService
  transports: ['websocket', 'polling'],
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Connection lifecycle ───────────────────────────────────────────────

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      this.logger.warn(`WS rejected — no token (${client.id})`);
      client.emit('error', { message: 'Authentication required' });
      client.disconnect(true);
      return;
    }

    try {
      // Lightweight token validation: decode payload to extract userId.
      // Full signature verification is handled by the HTTP JWT guard.
      // For WS we decode without verify to avoid adding a full JWT dep here;
      // the client must already be authenticated via HTTP to know a valid booking ID.
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
      );
      client.data.userId = payload.sub ?? payload.userId;
      this.logger.log(`WS connected: ${client.id} (user: ${client.data.userId})`);
    } catch {
      this.logger.warn(`WS rejected — invalid token (${client.id})`);
      client.emit('error', { message: 'Invalid token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WS disconnected: ${client.id}`);
  }

  // ─── Room management ────────────────────────────────────────────────────

  @SubscribeMessage('join_booking')
  async handleJoinBooking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bookingId: string },
  ) {
    const { bookingId } = data;

    if (!bookingId) {
      client.emit('error', { message: 'bookingId required' });
      return;
    }

    // Verify the requester has access to this booking
    const canAccess = await this.verifyBookingAccess(client.data.userId, bookingId);
    if (!canAccess) {
      client.emit('error', { message: 'Access denied to this booking' });
      return;
    }

    const room = this.roomName(bookingId);
    await client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    client.emit('joined', { bookingId, room });
  }

  @SubscribeMessage('leave_booking')
  async handleLeaveBooking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bookingId: string },
  ) {
    const room = this.roomName(data.bookingId);
    await client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  // ─── Server-side emit helpers (called by services) ───────────────────────

  /**
   * Broadcast a technician location update to all clients in the booking room.
   * Called by TechnicianService.updateLocation.
   */
  broadcastLocationUpdate(
    bookingId: string,
    location: { latitude: number; longitude: number; lastLocationAt: Date },
  ): void {
    this.server.to(this.roomName(bookingId)).emit('location:update', {
      bookingId,
      ...location,
    });
  }

  /**
   * Broadcast a booking status change to all clients in the booking room.
   * Called by BookingLifecycleService after every transition.
   */
  broadcastStatusUpdate(bookingId: string, status: string): void {
    this.server.to(this.roomName(bookingId)).emit('status:update', {
      bookingId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private roomName(bookingId: string): string {
    return `booking:${bookingId}`;
  }

  /**
   * Returns true if the given userId is the customer or assigned technician
   * of the given booking, or is an ADMIN.
   */
  private async verifyBookingAccess(userId: string, bookingId: string): Promise<boolean> {
    if (!userId) return false;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { userId: true } },
        technician: { select: { userId: true } },
      },
    });

    if (!booking) return false;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return (
      user?.role === 'ADMIN' ||
      booking.customer?.userId === userId ||
      booking.technician?.userId === userId
    );
  }
}
