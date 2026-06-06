import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

interface WSClient {
  ws: WebSocket;
  assignmentId?: string;
}

const clients = new Map<string, WSClient>();

let wss: WebSocketServer;

export function initWebSocket(server: any) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientId = Math.random().toString(36).slice(2);
    clients.set(clientId, { ws });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'subscribe' && msg.assignmentId) {
          const client = clients.get(clientId);
          if (client) client.assignmentId = msg.assignmentId;
          ws.send(JSON.stringify({ type: 'subscribed', assignmentId: msg.assignmentId }));
        }
      } catch (e) {}
    });

    ws.on('close', () => clients.delete(clientId));
    ws.on('error', () => clients.delete(clientId));

    ws.send(JSON.stringify({ type: 'connected', clientId }));
  });

  return wss;
}

export function notifyAssignment(assignmentId: string, payload: object) {
  const message = JSON.stringify({ ...payload, assignmentId });
  clients.forEach(({ ws, assignmentId: subId }) => {
    if (subId === assignmentId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export function broadcastToAll(payload: object) {
  const message = JSON.stringify(payload);
  clients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(message);
  });
}
