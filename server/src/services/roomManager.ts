import { config } from '../config.js';
import type { RoomState, Player, PlayerPublic } from '../types/game.js';
import { GamePhase } from '../types/game.js';
import { generateRoomCode } from '../utils/idGenerator.js';

const rooms = new Map<string, RoomState>();

function playerToPublic(p: Player, room: RoomState): PlayerPublic {
  return {
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    isConnected: p.isConnected,
    isEliminated: p.isEliminated,
    hasSubmittedWord: room.submittedWords.has(p.id),
    score: p.score,
  };
}

export function createRoom(socketId: string, playerName: string): RoomState {
  const code = generateRoomCode();
  const player: Player = {
    id: socketId, name: playerName, isHost: true,
    isConnected: true, isEliminated: false, score: 0, joinedAt: Date.now(),
  };
  const players = new Map<string, Player>();
  players.set(socketId, player);

  const room: RoomState = {
    code, phase: GamePhase.LOBBY, players, hostSocketId: socketId,
    submittedWords: new Map(), story: '', guesses: [],
    eliminatedPlayers: new Set(), currentRound: 0, roundSubmitted: new Set(),
    pendingRoundGuesses: [],
    currentGame: 1, totalGames: 3,
    createdAt: Date.now(), phaseStartedAt: Date.now(),
    settings: {
      maxPlayers: config.game.maxPlayers, minPlayers: config.game.minPlayers,
      wordTimeoutMs: config.game.wordTimeoutMs, guessTimeoutMs: config.game.guessTimeoutMs,
    },
    timers: { disconnectGrace: new Map() },
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code);
}

export function joinRoom(
  socketId: string, roomCode: string, playerName: string
): { room: RoomState; player: Player } | { error: string } {
  const room = rooms.get(roomCode);
  if (!room) return { error: '房间不存在' };

  if (room.phase !== GamePhase.LOBBY && room.phase !== GamePhase.FINISHED) {
    const existing = room.players.get(socketId);
    if (!existing) return { error: '游戏已开始，无法加入' };
    existing.isConnected = true;
    const gt = room.timers.disconnectGrace?.get(socketId);
    if (gt) { clearTimeout(gt); room.timers.disconnectGrace?.delete(socketId); }
    return { room, player: existing };
  }

  if (room.players.size >= room.settings.maxPlayers) return { error: '房间已满' };

  for (const p of room.players.values()) {
    if (p.name === playerName && p.isConnected) return { error: '昵称已被使用' };
  }

  const existing = room.players.get(socketId);
  if (existing) {
    existing.isConnected = true; existing.name = playerName;
    const gt = room.timers.disconnectGrace?.get(socketId);
    if (gt) { clearTimeout(gt); room.timers.disconnectGrace?.delete(socketId); }
    return { room, player: existing };
  }

  const player: Player = {
    id: socketId, name: playerName, isHost: false,
    isConnected: true, isEliminated: false, score: 0, joinedAt: Date.now(),
  };
  room.players.set(socketId, player);
  return { room, player };
}

export function leaveRoom(socketId: string, roomCode: string): Player | null {
  const room = rooms.get(roomCode);
  if (!room) return null;
  const player = room.players.get(socketId);
  if (!player) return null;

  room.players.delete(socketId);
  room.submittedWords.delete(socketId);
  room.eliminatedPlayers.delete(socketId);

  if (socketId === room.hostSocketId && room.players.size > 0) {
    const next = room.players.values().next().value as Player;
    if (next) { next.isHost = true; room.hostSocketId = next.id; }
  }

  if (room.players.size === 0) {
    clearRoomTimers(room);
    rooms.delete(roomCode);
  }
  return player;
}

export function handleDisconnect(
  socketId: string, roomCode: string
): { player: Player; roomEmpty: boolean; shouldAbort: boolean } {
  const room = rooms.get(roomCode);
  const player = room?.players.get(socketId);
  if (!room || !player) return { player: null as any, roomEmpty: true, shouldAbort: false };

  player.isConnected = false;
  const gt = setTimeout(() => leaveRoom(socketId, roomCode), config.game.disconnectGraceMs);
  if (!room.timers.disconnectGrace) room.timers.disconnectGrace = new Map();
  room.timers.disconnectGrace.set(socketId, gt);

  const connected = [...room.players.values()].filter(p => p.isConnected).length;
  const shouldAbort =
    room.phase !== GamePhase.LOBBY && room.phase !== GamePhase.FINISHED &&
    connected < room.settings.minPlayers;

  return { player, roomEmpty: room.players.size === 0, shouldAbort };
}

export function getRoomPlayers(room: RoomState): PlayerPublic[] {
  return [...room.players.values()].map(p => playerToPublic(p, room));
}

export function getConnectedPlayers(room: RoomState): Player[] {
  return [...room.players.values()].filter(p => p.isConnected);
}

export function clearRoomTimers(room: RoomState): void {
  if (room.timers.wordTimeout) clearTimeout(room.timers.wordTimeout);
  if (room.timers.guessTimeout) clearTimeout(room.timers.guessTimeout);
  if (room.timers.generatingTimeout) clearTimeout(room.timers.generatingTimeout);
  if (room.timers.disconnectGrace) {
    for (const t of room.timers.disconnectGrace.values()) clearTimeout(t);
    room.timers.disconnectGrace.clear();
  }
}

export function resetRoom(room: RoomState): void {
  clearRoomTimers(room);
  room.phase = GamePhase.LOBBY;
  room.submittedWords = new Map();
  room.story = '';
  room.guesses = [];
  room.eliminatedPlayers = new Set();
  room.currentRound = 0;
  room.roundSubmitted = new Set();
  room.pendingRoundGuesses = [];
  room.currentGame = 1;
  room.phaseStartedAt = Date.now();
  room.timers = { disconnectGrace: new Map() };
  for (const p of room.players.values()) {
    p.word = undefined;
    p.isEliminated = false;
    p.isConnected = true;
  }
}

export function findRoomBySocketId(socketId: string): { code: string; room: RoomState } | undefined {
  for (const [code, room] of rooms) {
    if (room.players.has(socketId)) return { code, room };
  }
  return undefined;
}

export function startRoomCleanup(): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (now - room.createdAt > config.game.roomInactiveMs) {
        clearRoomTimers(room);
        rooms.delete(code);
      }
    }
  }, 5 * 60_000);
}
