import React from 'react';
import { useGame } from '../../context/GameContext';
import StoryDisplay from './StoryDisplay';
import HintsPanel from './HintsPanel';
import SurvivorBoard from './SurvivorBoard';
import IdentityGuessInput from './IdentityGuessInput';
import GuessFeed from './GuessFeed';

export default function GuessingPhase() {
  const { state } = useGame();

  return (
    <div className="phase guessing-phase">
      <div className="phase-header">
        <h2>
          🔍 第 {state.currentGame}/{state.totalGames} 局 · 第 {state.currentRound} 轮
        </h2>
        <p>故事中藏着每个人的词，猜出谁出了哪个词——同时藏好自己的词不被发现</p>
      </div>

      <StoryDisplay story={state.story} />

      <HintsPanel storyLength={state.storyLength} />

      <SurvivorBoard
        players={state.players}
        currentPlayerId={state.playerId}
      />

      <IdentityGuessInput />

      <GuessFeed />
    </div>
  );
}
