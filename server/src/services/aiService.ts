import OpenAI from 'openai';
import { config } from '../config.js';

const client = new OpenAI({
  apiKey: config.deepseekApiKey,
  baseURL: config.deepseekBaseUrl,
});

/**
 * Generate a 30-50 character Chinese story that naturally embeds all given words.
 */
export async function generateStory(words: string[]): Promise<string> {
  const wordList = words.join('、');

  const completion = await client.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 120,
    temperature: 0.85,
    messages: [
      {
        role: 'system',
        content: '你是一个创意故事生成 AI。只输出一段30-50字的中文短故事，不加引号，不加解释。故事必须自然地嵌入所有给定的词语，词语不做任何特殊标记，读起来像普通故事。',
      },
      {
        role: 'user',
        content: `将以下词语自然嵌入一段30-50字的中文短故事中，每个词都要用到：\n\n词语：${wordList}\n\n只输出故事：`,
      },
    ],
  });

  const story = completion.choices[0]?.message?.content?.trim() ?? words.join(' ');

  // Clean up
  return story
    .replace(/^["'「『]|["'」』]$/g, '')
    .replace(/\n/g, ' ')
    .trim();
}
