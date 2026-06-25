import React from 'react';
import { useGame } from '../../context/GameContext';

export default function RoomHeader() {
  const { state } = useGame();

  const copyRoomCode = () => {
    navigator.clipboard.writeText(state.roomCode).catch(() => {});
  };

  const shareLink = () => {
    const link = `${window.location.origin}/room/${state.roomCode}`;
    navigator.clipboard.writeText(link).catch(() => {});
  };

  return (
    <header className="room-header">
      <div className="room-header-info">
        <span className="room-code-label">房间码</span>
        <span className="room-code-value" onClick={copyRoomCode} title="点击复制房间码">
          {state.roomCode}
        </span>
        <span className="player-count">
          👥 {state.players.filter(p => p.isConnected).length}/{state.players.length}
        </span>
      </div>
      <button className="btn btn-small" onClick={shareLink}>
        📋 复制邀请链接
      </button>
    </header>
  );
}
