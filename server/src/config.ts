import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // DeepSeek API (OpenAI-compatible)
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',

  // 通义万相 (Alibaba Cloud DashScope)
  dashscopeApiKey: process.env.DASHSCOPE_API_KEY || '',

  game: {
    maxPlayers: 6,
    minPlayers: 3,
    wordTimeoutMs: 120_000,
    guessTimeoutMs: 300_000,
    generatingTimeoutMs: 60_000,
    roomInactiveMs: 30 * 60_000,
    disconnectGraceMs: 30_000,
    guessRateLimitMs: 3_000,
    winThreshold: 0.80,
  },
} as const;
