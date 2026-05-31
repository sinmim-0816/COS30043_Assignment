import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, adjust this to your specific Vue frontend URL
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private activeConnections = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.activeConnections.set(userId, client.id);
      console.log(
        `User ${userId} established WebSocket linkage on socket: ${client.id}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.activeConnections.entries()) {
      if (socketId === client.id) {
        this.activeConnections.delete(userId);
        console.log(`User ${userId} closed connection channel.`);
        break;
      }
    }
  }

  sendNotificationToClient(userId: string, payload: any) {
    const socketId = this.activeConnections.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification_received', payload);
    }
  }
}
