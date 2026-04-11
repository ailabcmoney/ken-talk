import PptxGenJS from 'pptxgenjs';
import { Message, PresentationData, SlideContent } from '../types';
import { getApiKey, getPptPrompt } from './storage';
import { DEFAULT_PPT_PROMPT } from '../constants/ppt-prompt';

// 品牌色系（參考 business-presentation 規範）
const C = {
  // 主色
  red: 'C00000',
  darkRed: 'A61C00',
  // 文字
  black: '1C1C1B',
  darkGray: '4A4A4A',
  gray: '7F7F7F',
  lightGray: 'BFBFBF',
  bgGray: 'F5F5F5',
  white: 'FFFFFF',
  // 強調
  blue: '2F5496',
  teal: '2EAAAA',
  green: '548235',
  orange: 'ED7D31',
  purple: '6C63FF',
};

// 陰影設定
const SHADOW = { type: 'outer' as const, blur: 4, offset: 2, opacity: 0.15, color: '000000' };
const ACCENT_COLORS = [C.red, C.blue, C.teal, C.green, C.orange, C.purple];

export async function generatePresentationData(
  messages: Message[],
  title: string
): Promise<PresentationData> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('請先設定 API Key');

  const conversation = messages
    .map((m) => `${m.role === 'ken' ? 'Ken' : '我'}：${m.content}`)
    .join('\n');

  // 強制使用最新 prompt：如果舊 prompt 不含 "matrix"，代表是舊版，直接忽略
  const customPptPrompt = await getPptPrompt();
  const isOldPrompt = customPptPrompt && !customPptPrompt.includes('matrix');
  const promptTemplate = (isOldPrompt ? null : customPptPrompt) || DEFAULT_PPT_PROMPT;
  const finalPrompt = promptTemplate.replace('{{conversation}}', conversation);

  console.log('[KenTalk] Using prompt length:', finalPrompt.length, 'hasMatrix:', finalPrompt.includes('matrix'));

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
        { role: 'system', content: '你是一位頂級商務簡報設計師。你必須回傳 JSON 格式的簡報結構。每頁 slide 必須包含 layout 欄位。' },
        { role: 'user', content: finalPrompt },
      ],
    }),
  });

  if (!res.ok) throw new Error('AI 生成失敗');

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('無法解析簡報內容');

  const parsed = JSON.parse(jsonMatch[0]);

  console.log('[KenTalk] AI returned slides:', parsed.slides?.length, 'layouts:', parsed.slides?.map((s: any) => s.layout || 'MISSING'));

  // 自動推斷 layout（防呆：如果 AI 沒給 layout 欄位）
  if (parsed.slides) {
    parsed.slides = parsed.slides.map((slide: any) => {
      if (!slide.layout) {
        if (slide.table) slide.layout = 'table';
        else if (slide.flow) slide.layout = 'flow';
        else if (slide.icons) slide.layout = 'icons';
        else if (slide.timeline) slide.layout = 'timeline';
        else if (slide.compare) slide.layout = 'compare';
        else if (slide.bigNumber) slide.layout = 'bigNumber';
        else if (slide.quote) slide.layout = 'quote';
        else if (slide.matrix) slide.layout = 'matrix';
        else if (slide.kpis) slide.layout = 'kpis';
        else if (slide.beforeAfter) slide.layout = 'beforeAfter';
        else if (slide.pyramid) slide.layout = 'pyramid';
        else slide.layout = 'bullets';
      }
      return slide;
    });
  }

  return { ...parsed, discussionId: title };
}

// 標題欄（紅色頂線 + 結論式標題 + 副標題 + 分隔線）
function addSlideTitle(s: any, title: string, pptx: PptxGenJS, subtitle?: string) {
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.06,
    fill: { color: C.red },
  });
  s.addText(title, {
    x: 0.6, y: 0.15, w: '85%', h: 0.55,
    fontSize: 22, bold: true, color: C.black,
    fontFace: 'Microsoft JhengHei',
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.6, y: 0.65, w: '85%', h: 0.35,
      fontSize: 12, color: C.gray,
      fontFace: 'Microsoft JhengHei',
    });
  }
  s.addShape(pptx.ShapeType.line, {
    x: 0.6, y: subtitle ? 1.05 : 0.85, w: 11.5, h: 0,
    line: { color: C.lightGray, width: 1 },
  });
}

// 底部 Insight 欄
function addInsightBar(s: any, text: string, pptx: PptxGenJS) {
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 4.65, w: '100%', h: 0.6,
    fill: { color: C.bgGray },
  });
  s.addText(`💡 ${text}`, {
    x: 0.6, y: 4.7, w: '85%', h: 0.5,
    fontSize: 11, italic: true, color: C.darkGray,
  });
}

function renderBullets(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const bullets = slide.bullets || [];
  const bulletText = bullets.map((b, i) => ({
    text: b,
    options: {
      bullet: { code: '25CF', color: ACCENT_COLORS[i % ACCENT_COLORS.length] },
      color: C.darkGray, fontSize: 16,
    },
  }));
  s.addText(bulletText as any, {
    x: 0.8, y: 1.3, w: '80%', h: 3,
    fontSize: 16, color: C.darkGray, lineSpacingMultiple: 1.8,
    fontFace: 'Microsoft JhengHei',
  });
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderTable(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const table = slide.table;
  if (!table) return;

  const headerRow = table.headers.map((h) => ({
    text: h,
    options: {
      bold: true, color: C.white, fill: { color: C.red },
      align: 'center' as const, fontSize: 13,
      border: { type: 'solid' as const, pt: 0.5, color: C.lightGray },
      fontFace: 'Microsoft JhengHei',
    },
  }));

  const dataRows = table.rows.map((row, ri) =>
    row.map((cell) => ({
      text: cell,
      options: {
        color: C.darkGray, fill: { color: ri % 2 === 0 ? C.white : C.bgGray },
        align: 'center' as const, fontSize: 12,
        border: { type: 'solid' as const, pt: 0.5, color: C.lightGray },
        fontFace: 'Microsoft JhengHei',
      },
    }))
  );

  s.addTable([headerRow, ...dataRows] as any, {
    x: 0.6, y: 1.3, w: 11.5,
    colW: Array(table.headers.length).fill(11.5 / table.headers.length),
    rowH: 0.45,
    margin: 6,
    shadow: SHADOW,
  });
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderFlow(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const nodes = slide.flow || [];
  const count = nodes.length;
  const totalW = 11;
  const nodeW = Math.min(1.8, (totalW - (count - 1) * 0.4) / count);
  const gap = count > 1 ? (totalW - nodeW * count) / (count - 1) : 0;
  const startX = 0.8;
  const y = 2.2;

  nodes.forEach((node, i) => {
    const x = startX + i * (nodeW + gap);
    const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
    const isTerminal = node.type === 'start' || node.type === 'end';
    const isDiamond = node.type === 'decision';

    // Card background
    s.addShape(isDiamond ? pptx.ShapeType.diamond : pptx.ShapeType.roundRect, {
      x, y: isDiamond ? y - 0.15 : y,
      w: nodeW, h: isDiamond ? 1.3 : 1,
      fill: { color: isTerminal ? accent : C.white },
      line: { color: accent, width: 2 },
      rectRadius: 0.12,
      shadow: SHADOW,
    });

    // Step number
    if (!isDiamond) {
      s.addShape(pptx.ShapeType.ellipse, {
        x: x + nodeW / 2 - 0.15, y: y - 0.15,
        w: 0.3, h: 0.3,
        fill: { color: accent },
      });
      s.addText(`${i + 1}`, {
        x: x + nodeW / 2 - 0.15, y: y - 0.15,
        w: 0.3, h: 0.3,
        fontSize: 9, bold: true, color: C.white, align: 'center', valign: 'middle',
      });
    }

    s.addText(node.label, {
      x, y: isDiamond ? y - 0.15 : y,
      w: nodeW, h: isDiamond ? 1.3 : 1,
      fontSize: 11, color: isTerminal ? C.white : C.darkGray,
      align: 'center', valign: 'middle',
      fontFace: 'Microsoft JhengHei',
    });

    // Arrow
    if (i < count - 1) {
      const arrowX = x + nodeW;
      const arrowW = gap;
      if (arrowW > 0.1) {
        s.addShape(pptx.ShapeType.line, {
          x: arrowX + 0.05, y: y + 0.5,
          w: arrowW - 0.1, h: 0,
          line: { color: C.red, width: 2, endArrowType: 'triangle' },
        });
      }
    }
  });
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderIcons(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const icons = slide.icons || [];
  const cols = Math.min(icons.length, 4);
  const colW = 10.5 / cols;
  const startX = 1;

  icons.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * colW;
    const y = 1.5 + row * 2;
    const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];

    // Card
    s.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.1, y, w: colW - 0.3, h: 1.7,
      fill: { color: C.white },
      line: { color: C.bgGray, width: 1 },
      rectRadius: 0.1,
      shadow: SHADOW,
    });

    // Top accent bar
    s.addShape(pptx.ShapeType.rect, {
      x: x + 0.1, y, w: colW - 0.3, h: 0.05,
      fill: { color: accent },
    });

    // emoji
    s.addText(item.icon, {
      x: x + 0.1, y: y + 0.15, w: colW - 0.3, h: 0.5,
      fontSize: 28, align: 'center',
    });

    // 標題
    s.addText(item.title, {
      x: x + 0.2, y: y + 0.7, w: colW - 0.5, h: 0.35,
      fontSize: 13, bold: true, color: C.black, align: 'center',
      fontFace: 'Microsoft JhengHei',
    });

    // 描述
    s.addText(item.desc, {
      x: x + 0.2, y: y + 1.05, w: colW - 0.5, h: 0.5,
      fontSize: 10, color: C.gray, align: 'center', lineSpacingMultiple: 1.2,
      fontFace: 'Microsoft JhengHei',
    });
  });
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderTimeline(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const items = slide.timeline || [];
  const count = items.length;
  const lineY = 2.6;
  const startX = 1.2;
  const endX = 11.8;
  const lineW = endX - startX;

  // 主線
  s.addShape(pptx.ShapeType.line, {
    x: startX, y: lineY, w: lineW, h: 0,
    line: { color: C.red, width: 3 },
  });

  items.forEach((item, i) => {
    const x = startX + (i / Math.max(count - 1, 1)) * lineW;
    const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
    const above = i % 2 === 0;

    // 節點圓點
    s.addShape(pptx.ShapeType.ellipse, {
      x: x - 0.18, y: lineY - 0.18, w: 0.36, h: 0.36,
      fill: { color: accent },
      shadow: SHADOW,
    });
    s.addText(`${i + 1}`, {
      x: x - 0.18, y: lineY - 0.18, w: 0.36, h: 0.36,
      fontSize: 9, bold: true, color: C.white, align: 'center', valign: 'middle',
    });

    // 連接線
    s.addShape(pptx.ShapeType.line, {
      x, y: above ? lineY - 1 : lineY + 0.25,
      w: 0, h: 0.8,
      line: { color: C.lightGray, width: 1, dashType: 'dash' },
    });

    // Labels
    const labelY = above ? lineY - 1.6 : lineY + 1.1;
    s.addText(item.time, {
      x: x - 0.7, y: labelY, w: 1.4, h: 0.3,
      fontSize: 10, bold: true, color: accent, align: 'center',
      fontFace: 'Microsoft JhengHei',
    });
    s.addText(item.label, {
      x: x - 0.7, y: labelY + 0.28, w: 1.4, h: 0.3,
      fontSize: 10, color: C.darkGray, align: 'center',
      fontFace: 'Microsoft JhengHei',
    });
  });
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderCompare(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const columns = slide.compare || [];
  const count = columns.length;
  const totalW = 11;
  const colW = (totalW - (count - 1) * 0.3) / count;
  const startX = 0.8;

  columns.forEach((col, i) => {
    const x = startX + i * (colW + 0.3);
    const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];

    // Card
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: colW, h: 3.2,
      fill: { color: C.white },
      line: { color: C.bgGray, width: 1 },
      rectRadius: 0.12,
      shadow: SHADOW,
    });

    // Header
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: colW, h: 0.55,
      fill: { color: accent },
      rectRadius: 0.12,
    });
    // Flat bottom corners of header
    s.addShape(pptx.ShapeType.rect, {
      x, y: 1.6, w: colW, h: 0.25,
      fill: { color: accent },
    });

    s.addText(col.title, {
      x, y: 1.3, w: colW, h: 0.55,
      fontSize: 14, bold: true, color: C.white, align: 'center', valign: 'middle',
      fontFace: 'Microsoft JhengHei',
    });

    col.items.forEach((item, j) => {
      s.addText(`• ${item}`, {
        x: x + 0.2, y: 2.1 + j * 0.4, w: colW - 0.4, h: 0.35,
        fontSize: 11, color: C.darkGray,
        fontFace: 'Microsoft JhengHei',
      });
    });
  });
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderBigNumber(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const bn = slide.bigNumber;
  if (!bn) return;

  // Number card
  s.addShape(pptx.ShapeType.roundRect, {
    x: 2.5, y: 1.5, w: 8, h: 2.5,
    fill: { color: C.white },
    line: { color: C.bgGray, width: 1 },
    rectRadius: 0.15,
    shadow: SHADOW,
  });

  s.addText(bn.number, {
    x: 2.5, y: 1.5, w: 8, h: 1.5,
    fontSize: 72, bold: true, color: C.red, align: 'center', valign: 'middle',
  });
  s.addText(bn.label, {
    x: 2.5, y: 2.9, w: 8, h: 0.5,
    fontSize: 20, color: C.black, align: 'center',
    fontFace: 'Microsoft JhengHei',
  });
  if (bn.sub) {
    s.addText(bn.sub, {
      x: 2.5, y: 3.4, w: 8, h: 0.4,
      fontSize: 13, color: C.teal, align: 'center',
      fontFace: 'Microsoft JhengHei',
    });
  }
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderQuote(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const q = slide.quote;
  if (!q) return;

  // Quote card
  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.5, y: 1.5, w: 10, h: 2.8,
    fill: { color: C.white },
    line: { color: C.bgGray, width: 1 },
    rectRadius: 0.15,
    shadow: SHADOW,
  });

  // Left red accent
  s.addShape(pptx.ShapeType.rect, {
    x: 1.5, y: 1.5, w: 0.08, h: 2.8,
    fill: { color: C.red },
  });

  // 大引號
  s.addText('\u201C', {
    x: 2, y: 1.5, w: 0.8, h: 0.8,
    fontSize: 60, color: C.red, fontFace: 'Georgia',
  });

  s.addText(q.text, {
    x: 2.5, y: 2, w: 8.5, h: 1.5,
    fontSize: 22, italic: true, color: C.black,
    lineSpacingMultiple: 1.4,
    fontFace: 'Microsoft JhengHei',
  });

  if (q.author) {
    s.addText(`— ${q.author}`, {
      x: 2.5, y: 3.5, w: 8.5, h: 0.5,
      fontSize: 14, color: C.red, align: 'right',
      fontFace: 'Microsoft JhengHei',
    });
  }
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderMatrix(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const cells = slide.matrix || [];
  const cols = cells.length <= 4 ? 2 : 3;
  const rows = Math.ceil(cells.length / cols);
  const colW = 11 / cols - 0.2;
  const rowH = rows === 1 ? 2.8 : 3 / rows;

  cells.forEach((cell, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 0.6 + col * (colW + 0.3);
    const y = 1.2 + row * (rowH + 0.15);
    const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];

    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: colW, h: rowH,
      fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
      rectRadius: 0.1, shadow: SHADOW,
    });
    s.addShape(pptx.ShapeType.rect, { x, y, w: colW, h: 0.05, fill: { color: accent } });

    s.addText(cell.icon, { x, y: y + 0.12, w: colW, h: 0.45, fontSize: 26, align: 'center' });
    s.addText(cell.title, {
      x: x + 0.15, y: y + 0.55, w: colW - 0.3, h: 0.3,
      fontSize: 13, bold: true, color: C.black, align: 'center', fontFace: 'Microsoft JhengHei',
    });
    s.addText(cell.desc, {
      x: x + 0.15, y: y + 0.85, w: colW - 0.3, h: rowH - 1,
      fontSize: 10, color: C.gray, align: 'center', fontFace: 'Microsoft JhengHei', lineSpacingMultiple: 1.3,
    });
  });
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderKpis(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const kpis = slide.kpis || [];
  const count = kpis.length;
  const cardW = (11.5 - (count - 1) * 0.3) / count;

  kpis.forEach((kpi, i) => {
    const x = 0.6 + i * (cardW + 0.3);
    const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];

    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: cardW, h: 2.8,
      fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
      rectRadius: 0.12, shadow: SHADOW,
    });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.3, w: cardW, h: 0.06, fill: { color: accent } });

    // Trend arrow
    const trendIcon = kpi.trend === 'up' ? '▲' : kpi.trend === 'down' ? '▼' : '●';
    const trendColor = kpi.trend === 'up' ? C.green : kpi.trend === 'down' ? C.red : C.gray;
    s.addText(trendIcon, {
      x: x + cardW - 0.5, y: 1.4, w: 0.4, h: 0.3,
      fontSize: 14, color: trendColor, align: 'center',
    });

    s.addText(kpi.number, {
      x, y: 1.6, w: cardW, h: 1,
      fontSize: 44, bold: true, color: accent, align: 'center', valign: 'middle',
    });
    s.addText(kpi.label, {
      x, y: 2.7, w: cardW, h: 0.4,
      fontSize: 14, bold: true, color: C.black, align: 'center', fontFace: 'Microsoft JhengHei',
    });
    if (kpi.sub) {
      s.addText(kpi.sub, {
        x, y: 3.15, w: cardW, h: 0.35,
        fontSize: 11, color: C.gray, align: 'center', fontFace: 'Microsoft JhengHei',
      });
    }
  });
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderBeforeAfter(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const ba = slide.beforeAfter;
  if (!ba) return;

  // Before card
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 1.2, w: 5.7, h: 3.2,
    fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
    rectRadius: 0.12, shadow: SHADOW,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 1.2, w: 5.7, h: 0.5,
    fill: { color: C.gray }, rectRadius: 0.12,
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.5, w: 5.7, h: 0.2, fill: { color: C.gray } });
  s.addText('😞  Before', {
    x: 0.6, y: 1.2, w: 5.7, h: 0.5,
    fontSize: 14, bold: true, color: C.white, align: 'center', valign: 'middle',
  });
  ba.before.forEach((item, j) => {
    s.addText(`✕  ${item}`, {
      x: 1, y: 1.9 + j * 0.5, w: 5, h: 0.4,
      fontSize: 12, color: C.darkGray, fontFace: 'Microsoft JhengHei',
    });
  });

  // Arrow
  s.addText('→', {
    x: 6.1, y: 2.4, w: 0.6, h: 0.5,
    fontSize: 28, color: C.red, align: 'center',
  });

  // After card
  s.addShape(pptx.ShapeType.roundRect, {
    x: 6.7, y: 1.2, w: 5.7, h: 3.2,
    fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
    rectRadius: 0.12, shadow: SHADOW,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 6.7, y: 1.2, w: 5.7, h: 0.5,
    fill: { color: C.green }, rectRadius: 0.12,
  });
  s.addShape(pptx.ShapeType.rect, { x: 6.7, y: 1.5, w: 5.7, h: 0.2, fill: { color: C.green } });
  s.addText('😊  After', {
    x: 6.7, y: 1.2, w: 5.7, h: 0.5,
    fontSize: 14, bold: true, color: C.white, align: 'center', valign: 'middle',
  });
  ba.after.forEach((item, j) => {
    s.addText(`✓  ${item}`, {
      x: 7.1, y: 1.9 + j * 0.5, w: 5, h: 0.4,
      fontSize: 12, bold: true, color: C.darkGray, fontFace: 'Microsoft JhengHei',
    });
  });
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

function renderPyramid(s: any, slide: SlideContent, pptx: PptxGenJS) {
  addSlideTitle(s, slide.title, pptx, slide.subtitle);
  const levels = slide.pyramid || [];
  const count = levels.length;
  const maxW = 10;
  const startX = 1.3;
  const startY = 1.3;
  const layerH = 2.8 / count;

  levels.forEach((level, i) => {
    const w = maxW * (0.3 + 0.7 * (i / Math.max(count - 1, 1)));
    const x = startX + (maxW - w) / 2;
    const y = startY + i * layerH;
    const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];

    // Trapezoid approximation with rounded rect
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w, h: layerH - 0.05,
      fill: { color: accent },
      rectRadius: 0.06,
      shadow: i === 0 ? SHADOW : undefined,
    });

    s.addText(level, {
      x, y, w, h: layerH - 0.05,
      fontSize: i === 0 ? 14 : 12,
      bold: i === 0,
      color: C.white,
      align: 'center', valign: 'middle',
      fontFace: 'Microsoft JhengHei',
    });
  });
  if (slide.notes) addInsightBar(s, slide.notes, pptx);
}

export async function createPptx(data: PresentationData): Promise<PptxGenJS> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Ken Talk';

  // 封面
  const coverSlide = pptx.addSlide();
  coverSlide.background = { fill: C.white };

  // 左側紅色塊
  coverSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 4.5, h: '100%',
    fill: { color: C.red },
  });

  // 標題（白色在紅底上）
  coverSlide.addText(data.title, {
    x: 0.5, y: 1.2, w: 3.5, h: 2,
    fontSize: 36, bold: true, color: C.white,
    fontFace: 'Microsoft JhengHei',
    lineSpacingMultiple: 1.2,
  });

  // 副標題
  coverSlide.addText(data.subtitle || '', {
    x: 5, y: 1.5, w: 7, h: 1,
    fontSize: 20, color: C.darkGray,
    fontFace: 'Microsoft JhengHei',
  });

  // 分隔線
  coverSlide.addShape(pptx.ShapeType.line, {
    x: 5, y: 2.8, w: 3, h: 0,
    line: { color: C.red, width: 3 },
  });

  // 底部資訊
  coverSlide.addText('Ken Talk | 討論即簡報', {
    x: 5, y: 3.2, w: 7, h: 0.5,
    fontSize: 12, color: C.gray,
    fontFace: 'Microsoft JhengHei',
  });

  const today = new Date().toLocaleDateString('zh-TW');
  coverSlide.addText(today, {
    x: 5, y: 3.7, w: 7, h: 0.4,
    fontSize: 11, color: C.lightGray,
  });

  // 內容頁
  for (const slide of data.slides) {
    const s = pptx.addSlide();
    s.background = { fill: C.white };

    const layout = slide.layout || 'bullets';

    switch (layout) {
      case 'table': renderTable(s, slide, pptx); break;
      case 'flow': renderFlow(s, slide, pptx); break;
      case 'icons': renderIcons(s, slide, pptx); break;
      case 'timeline': renderTimeline(s, slide, pptx); break;
      case 'compare': renderCompare(s, slide, pptx); break;
      case 'bigNumber': renderBigNumber(s, slide, pptx); break;
      case 'quote': renderQuote(s, slide, pptx); break;
      case 'matrix': renderMatrix(s, slide, pptx); break;
      case 'kpis': renderKpis(s, slide, pptx); break;
      case 'beforeAfter': renderBeforeAfter(s, slide, pptx); break;
      case 'pyramid': renderPyramid(s, slide, pptx); break;
      default: renderBullets(s, slide, pptx); break;
    }

    if (slide.notes) s.addNotes(slide.notes);

    // 頁碼
    const pageNum = data.slides.indexOf(slide) + 2;
    s.addShape(pptx.ShapeType.ellipse, {
      x: 12, y: 4.85, w: 0.35, h: 0.35,
      fill: { color: C.red },
    });
    s.addText(`${pageNum}`, {
      x: 12, y: 4.85, w: 0.35, h: 0.35,
      fontSize: 8, bold: true, color: C.white, align: 'center', valign: 'middle',
    });
  }

  // 結尾頁
  const endSlide = pptx.addSlide();
  endSlide.background = { fill: C.white };

  // 紅色右側塊
  endSlide.addShape(pptx.ShapeType.rect, {
    x: 8, y: 0, w: 5.33, h: '100%',
    fill: { color: C.red },
  });

  endSlide.addText('Thank You', {
    x: 0.8, y: 1.5, w: 6.5, h: 1.2,
    fontSize: 48, bold: true, color: C.red,
    fontFace: 'Microsoft JhengHei',
  });

  endSlide.addShape(pptx.ShapeType.line, {
    x: 0.8, y: 2.8, w: 3, h: 0,
    line: { color: C.red, width: 3 },
  });

  endSlide.addText('Generated by Ken Talk', {
    x: 0.8, y: 3.2, w: 6.5, h: 0.5,
    fontSize: 13, color: C.gray,
    fontFace: 'Microsoft JhengHei',
  });

  return pptx;
}
