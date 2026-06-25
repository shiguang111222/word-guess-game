import { tokenize, levenshteinDistance } from '../utils/textNormalizer.js';
import { config } from '../config.js';

export interface SimilarityResult {
  overlapRatio: number;
  editRatio: number;
  combinedScore: number;
  isWinner: boolean;
}

/**
 * Calculate similarity between a guess and the target sentence.
 * Hybrid score: 60% word overlap + 40% word-order edit distance.
 *
 * overlapRatio: how many target words appear in the guess
 * editRatio: how similar the word sequence is (normalized Levenshtein)
 * combinedScore: weighted average, >= WIN_THRESHOLD means winner
 */
export function calculateSimilarity(guess: string, target: string): SimilarityResult {
  const targetWords = tokenize(target);
  const guessWords = tokenize(guess);

  if (targetWords.length === 0) {
    return { overlapRatio: 0, editRatio: 0, combinedScore: 0, isWinner: false };
  }

  // Metric A: Word overlap ratio (how many target words captured)
  const targetSet = new Set(targetWords);
  const guessSet = new Set(guessWords);
  let intersection = 0;
  for (const w of guessSet) {
    if (targetSet.has(w)) intersection++;
  }
  const overlapRatio = intersection / targetWords.length;

  // Metric B: Word-level edit distance (word order)
  const editDist = levenshteinDistance(targetWords, guessWords);
  const maxLen = Math.max(targetWords.length, guessWords.length);
  const editRatio = maxLen > 0 ? 1 - editDist / maxLen : 0;

  // Combined score
  const combinedScore = 0.6 * overlapRatio + 0.4 * editRatio;

  return {
    overlapRatio: Math.round(overlapRatio * 100) / 100,
    editRatio: Math.round(editRatio * 100) / 100,
    combinedScore: Math.round(combinedScore * 100) / 100,
    isWinner: combinedScore >= config.game.winThreshold,
  };
}
