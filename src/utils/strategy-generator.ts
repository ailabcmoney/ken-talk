import { Message } from '../types';
import { getApiKey } from './storage';

export interface PowerPhrase {
  phrase: string;
  effect: string;
  level: 'critical' | 'high' | 'medium';
}

export interface DangerPhrase {
  phrase: string;
  consequence: string;
}

export interface StrategyData {
  title: string;
  summary: string;
  // Ken 最在意什麼
  kenCoreCaresAbout: string;
  kenCoreCaresWhy: string;
  // Ken 看這件事的角度
  kenMindset: { angle: string; detail: string }[];
  // 公司 / 事業目標對齊
  companyGoals: { goal: string; status: 'aligned' | 'partial' | 'misaligned'; note: string }[];
  // Ken 可能會問的問題 + 建議回答
  qaCards: { question: string; intent: string; answer: string; keyPoint: string }[];
  // 隱藏風險
  hiddenRisks: { risk: string; severity: 'high' | 'medium' | 'low'; mitigation: string }[];
  // 該做 vs 不該做
  dosAndDonts: { do: string; dont: string }[];
  // 特殊觀點 — Ken 可能會提出的獨特思維
  uniquePerspectives: { perspective: string; explanation: string }[];
  // 可延伸討論的議題
  extendedTopics: { topic: string; why: string }[];
  // 建議話術 — 完整腳本
  scripts: {
    opening: string;
    keyTransitions: string[];
    closing: string;
  };
  // 超重要的金句 — 講出來就能推進
  powerPhrases: PowerPhrase[];
  // 地雷句 — 講了會被唸
  dangerPhrases: DangerPhrase[];
  // 用戶故事
  userStory: {
    scenario: string;    // 情境描述
    painPoint: string;   // 用戶痛點
    solution: string;    // 我們怎麼解決
    outcome: string;     // 成果
  };
  // 為什麼我們做得好 + 護城河
  moat: {
    whyUs: string[];         // 為什麼是我們
    whyNow: string[];        // 為什麼是現在
    competitiveEdge: string; // 核心護城河
    hardToReplicate: string; // 別人為什麼做不到
  };
}

const STRATEGY_PROMPT = `你是 CMoney 內部的資深溝通顧問，專門幫員工分析如何跟老闆 Ken（李岳能）溝通。你對 Ken 非常了解。

## Ken 的完整特質
- INTJ，重視長線思維和價值觀，台大土木系畢業，創業 22 年
- 每件事要有觀察→假設→驗證→行動，沒有這個過程就會要求補上
- 在意護城河、為什麼是我們做、為什麼是現在、憑什麼我們會成功
- 完全不在意工程難度、成本、預算（尤其 MVP），只在意決策有沒有料
- 喜歡小規模測試，用最極致方式驗證，如果連這樣都不行就不用做了
- 偷偷觀察報告者有沒有使命感，有的話信任值加分
- 會確認每個人背後的隱含假設，到底在怕什麼
- 對只有觀點沒有事實的人會不耐煩，會問「有具體案例嗎？」
- 不喜歡列點說明，喜歡用比喻和感覺
- 在意產品對用戶的細微影響，能不讓用戶做就不要
- 討厭金錢或獎金的獎勵機制，重點是創造價值
- 異於常人的想法：AI 淘汰沒洞見的人、工作是最高級娛樂、掌握終端用戶就能稱王、大部分人的需求是解決無聊

## CMoney 的事業結構
- 金融事業群（最大，最會賺錢）：作者組、Money錢、同學會、大眾、法人組
- 消費事業群：發票載具（月活百萬）、簡單記帳等
- 社群事業群：瓦基、英文知識王、故事超人等
- X實驗室：打造非金融新創，目標億萬級用戶應用
- Ken 不在意每個專案都賺錢，在意長線布局和不同領域放線

## 重要人物
- 文昌：技術主管，工程/資源問題找他
- 建文：產品長，最信任的主管之一
- 宏鈞：金融事業群 BU head，最信任的主管之一
- Hubert：金融事業群 ToC BU head
- Jason Chou：AI team 主管

根據以下討論內容，產出完整的溝通策略報告：

討論內容：
{{conversation}}

回傳 JSON 格式：
{
  "title": "溝通策略標題（15字內）",
  "summary": "一段話總結核心議題和建議方向（80-120字）",
  "kenCoreCaresAbout": "Ken 最在意這件事的什麼（一句話，20-30字）",
  "kenCoreCaresWhy": "為什麼他最在意這個（30-50字）",
  "kenMindset": [
    { "angle": "角度名稱（5字內）", "detail": "詳細說明 Ken 從這個角度怎麼看（30-50字）" }
  ],
  "companyGoals": [
    { "goal": "相關的公司/事業目標", "status": "aligned/partial/misaligned", "note": "對齊程度說明（20-30字）" }
  ],
  "qaCards": [
    {
      "question": "Ken 會問的問題（自然口吻）",
      "intent": "他問這題背後的意圖（15-20字）",
      "answer": "建議的完整回答（50-80字，要有事實和案例）",
      "keyPoint": "回答時最關鍵的一句話（20字內）"
    }
  ],
  "hiddenRisks": [
    { "risk": "風險描述（20-30字）", "severity": "high/medium/low", "mitigation": "建議的應對方式（20-30字）" }
  ],
  "dosAndDonts": [
    { "do": "該做的事（完整描述，20字）", "dont": "不該做的事（完整描述，20字）" }
  ],
  "uniquePerspectives": [
    { "perspective": "Ken 可能提出的獨特觀點（15字內）", "explanation": "這個觀點的具體內容和為什麼他會這樣想（40-60字）" }
  ],
  "extendedTopics": [
    { "topic": "可延伸的議題（10字內）", "why": "為什麼值得延伸討論（30-40字）" }
  ],
  "scripts": {
    "opening": "建議的開場白完整話術（60-100字，自然口吻）",
    "keyTransitions": ["中間關鍵轉折的話術1（30-50字）", "話術2", "話術3"],
    "closing": "建議的收尾話術（60-100字）"
  },
  "powerPhrases": [
    { "phrase": "講出來就能推進的金句（15-25字）", "effect": "為什麼這句有效（20字）", "level": "critical/high/medium" }
  ],
  "dangerPhrases": [
    { "phrase": "講了會被唸的話（15-25字）", "consequence": "講了之後 Ken 的反應（20字）" }
  ],
  "userStory": {
    "scenario": "一個具體、合理的用戶使用情境（50-80字，要像在講故事）",
    "painPoint": "這個用戶遇到的真實痛點（30-50字）",
    "solution": "我們的方案怎麼幫到他（30-50字）",
    "outcome": "使用後的具體成果（20-30字，要有數據）"
  },
  "moat": {
    "whyUs": ["為什麼是我們公司做這件事（完整論述，每條 30-40 字）", "第二個理由", "第三個理由"],
    "whyNow": ["為什麼是現在做（完整論述，每條 30-40 字）", "第二個理由"],
    "competitiveEdge": "我們的核心護城河是什麼（50-80字）",
    "hardToReplicate": "別人為什麼做不到或做不好（50-80字）"
  }
}

要求：
- kenMindset 至少 3 個角度
- companyGoals 至少 2 個
- qaCards 至少 5 組
- hiddenRisks 至少 3 個
- dosAndDonts 至少 4 組
- uniquePerspectives 至少 2 個
- extendedTopics 至少 3 個
- keyTransitions 至少 3 句
- powerPhrases 至少 5 句（至少 2 句 critical）
- dangerPhrases 至少 4 句

只回傳 JSON，不要其他文字。`;

export async function generateStrategy(messages: Message[]): Promise<StrategyData> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('請先設定 API Key');

  const conversation = messages
    .map((m) => `${m.role === 'ken' ? 'Ken' : '我'}：${m.content}`)
    .join('\n');

  const prompt = STRATEGY_PROMPT.replace('{{conversation}}', conversation);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: '你是 CMoney 內部的資深溝通顧問。回傳 JSON 格式的溝通策略報告。' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error('AI 生成失敗');

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('無法解析溝通策略');

  return JSON.parse(jsonMatch[0]);
}
