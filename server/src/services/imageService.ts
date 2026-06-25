import { config } from '../config.js';

interface WanxResponse {
  output?: {
    task_id: string;
    task_status: string;
    results?: Array<{ url: string }>;
  };
  code?: string;
  message?: string;
}

/**
 * Generate an image using 通义万相 (Tongyi Wanxiang) via Alibaba Cloud DashScope API.
 * Uses async task-based API: submit → poll → get result.
 */
export async function generateImage(prompt: string): Promise<string> {
  // Step 1: Submit the image generation task
  const submitRes = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.dashscopeApiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: 'wanx2.0-t2i-turbo',
        input: {
          prompt: `${prompt}，高质量，细节丰富，色彩鲜艳`,
          negative_prompt: '文字，水印，签名，模糊，低质量，丑陋，变形',
          size: '1024*1024',
        },
        parameters: {
          n: 1,
        },
      }),
    }
  );

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`通义万相提交失败: ${submitRes.status} ${errText}`);
  }

  const submitData: WanxResponse = await submitRes.json();
  if (submitData.code) {
    throw new Error(`通义万相错误: ${submitData.code} - ${submitData.message}`);
  }

  const taskId = submitData.output?.task_id;
  if (!taskId) {
    throw new Error('通义万相未返回 task_id');
  }

  // Step 2: Poll for result (max 60 seconds)
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2000);

    const pollRes = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.dashscopeApiKey}`,
        },
      }
    );

    if (!pollRes.ok) continue;

    const pollData: WanxResponse = await pollRes.json();

    if (pollData.output?.task_status === 'SUCCEEDED') {
      const imageUrl = pollData.output?.results?.[0]?.url;
      if (imageUrl) return imageUrl;
      throw new Error('通义万相生成成功但未返回图片 URL');
    }

    if (pollData.output?.task_status === 'FAILED') {
      throw new Error(`通义万相生成失败: ${pollData.message || '未知错误'}`);
    }
  }

  throw new Error('通义万相生成超时');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
