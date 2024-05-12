// pages/api/hello-ws.ts
import { NextApiRequest, NextApiResponse } from 'next';
import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (res?.socket?.server?.wss) {
    res.end();
    return;
  }

  res.socket.server.wss = wss;

  wss.on('connection', (ws) => {
    const sendHello = () => {
      ws.send('Hello');
    };

    const interval = setInterval(sendHello, 2000);

    ws.on('close', () => {
      clearInterval(interval);
    });
  });
}
