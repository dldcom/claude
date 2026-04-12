import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface DashboardClient { ws: WebSocket; classId: number; }
const clients: DashboardClient[] = [];

export function setupDashboardWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/dashboard' });
  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'register' && msg.class_id) {
          clients.push({ ws, classId: msg.class_id });
        }
      } catch {}
    });
    ws.on('close', () => {
      const idx = clients.findIndex(c => c.ws === ws);
      if (idx !== -1) clients.splice(idx, 1);
    });
  });
}

export function broadcastToClass(classId: number, data: object) {
  const message = JSON.stringify(data);
  clients
    .filter(c => c.classId === classId && c.ws.readyState === WebSocket.OPEN)
    .forEach(c => c.ws.send(message));
}
