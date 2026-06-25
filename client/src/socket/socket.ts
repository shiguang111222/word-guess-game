import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
  transports: ['websocket'],
});

export default socket;
