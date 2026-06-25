import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { createRoom, joinRoom } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!playerName.trim()) {
      setError('请输入你的昵称');
      return;
    }
    createRoom(playerName.trim());
    // Navigate after a short delay to allow socket event to fire
    setTimeout(() => {
      navigate('/room/new');
    }, 500);
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('请输入你的昵称');
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length !== 6) {
      setError('请输入6位房间码');
      return;
    }
    joinRoom(roomCode.trim(), playerName.trim());
    setTimeout(() => {
      navigate(`/room/${roomCode.trim().toUpperCase()}`);
    }, 500);
  };

  return (
    <div className="home-page">
      <div className="home-card">
        <h1 className="home-title">🎨 AI 猜图游戏</h1>
        <p className="home-subtitle">出词 · AI 造句 · AI 生图 · 看图猜句</p>

        <div className="home-steps">
          <div className="step">1️⃣ 每人出一个词</div>
          <div className="step">2️⃣ AI 把词组成一句话并生成图片</div>
          <div className="step">3️⃣ 看图猜原句，最接近的获胜！</div>
        </div>

        {mode === 'idle' && (
          <div className="home-buttons">
            <button className="btn btn-primary" onClick={() => setMode('create')}>
              创建房间
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')}>
              加入房间
            </button>
          </div>
        )}

        {(mode === 'create' || mode === 'join') && (
          <div className="home-form">
            <div className="form-group">
              <label>你的昵称</label>
              <input
                type="text"
                placeholder="输入昵称..."
                value={playerName}
                onChange={e => { setPlayerName(e.target.value); setError(''); }}
                maxLength={20}
                autoFocus
              />
            </div>

            {mode === 'join' && (
              <div className="form-group">
                <label>房间码</label>
                <input
                  type="text"
                  placeholder="输入6位房间码"
                  value={roomCode}
                  onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
                  maxLength={6}
                  className="room-code-input"
                />
              </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <div className="home-buttons">
              <button className="btn btn-primary" onClick={mode === 'create' ? handleCreate : handleJoin}>
                {mode === 'create' ? '🎮 创建房间' : '🚪 加入房间'}
              </button>
              <button className="btn btn-ghost" onClick={() => { setMode('idle'); setError(''); }}>
                返回
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
