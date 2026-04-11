import { Message } from '../types';
import { KEN_SYSTEM_PROMPT, KEN_GREETING_RESPONSES } from '../constants/ken-persona';
import { getApiKey, getKenPrompt } from './storage';

function isGreeting(text: string): boolean {
  const greetings = ['嗨', '你好', 'hi', 'hello', '哈囉', '安安', '早安', '午安', '晚安', 'hey', '嘿'];
  const lower = text.toLowerCase().trim();
  return greetings.some((g) => lower === g || lower === g + '!') || lower.length < 5;
}

export async function sendToKen(
  userMessage: string,
  history: Message[]
): Promise<{ content: string; narration: string }> {
  // 打招呼直接回
  if (history.length === 0 && isGreeting(userMessage)) {
    const resp = KEN_GREETING_RESPONSES[Math.floor(Math.random() * KEN_GREETING_RESPONSES.length)];
    const parts = resp.split('\n');
    return {
      narration: parts[0] || '',
      content: parts.slice(1).join('\n') || resp,
    };
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    return {
      narration: '（系統提示）',
      content: '請先到設定頁面輸入你的 API Key 才能跟 Ken 對話',
    };
  }

  const customPrompt = await getKenPrompt();
  const systemPrompt = customPrompt || KEN_SYSTEM_PROMPT;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map((m) => ({
      role: (m.role === 'ken' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.content + (m.narration ? `\n${m.narration}` : ''),
    })),
    { role: 'user' as const, content: userMessage },
  ];

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '(已讀)';

    // 分離敘事和對話
    const narrationMatch = text.match(/^(（[^）]+）.*?)[\n]+(「[^」]*」.*)$/s)
      || text.match(/^(.*?(?:。|）))[\n]+(「.+)/s);

    if (narrationMatch) {
      return {
        narration: narrationMatch[1].trim(),
        content: narrationMatch[2].trim(),
      };
    }

    return { narration: '', content: text };
  } catch (error: any) {
    return {
      narration: '（系統錯誤）',
      content: `無法連線：${error.message?.slice(0, 100)}`,
    };
  }
}
