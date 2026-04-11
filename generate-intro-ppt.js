const PptxGenJS = require('pptxgenjs');

const C = {
  red: 'C00000',
  darkRed: 'A61C00',
  black: '1C1C1B',
  darkGray: '4A4A4A',
  gray: '7F7F7F',
  lightGray: 'BFBFBF',
  bgGray: 'F5F5F5',
  white: 'FFFFFF',
  blue: '2F5496',
  teal: '2EAAAA',
  green: '548235',
  orange: 'ED7D31',
};

const SHADOW = { type: 'outer', blur: 4, offset: 2, opacity: 0.15, color: '000000' };

function addTitle(s, pptx, title) {
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: C.red } });
  s.addText(title, {
    x: 0.6, y: 0.2, w: '85%', h: 0.75,
    fontSize: 24, bold: true, color: C.black, fontFace: 'Microsoft JhengHei',
  });
  s.addShape(pptx.ShapeType.line, { x: 0.6, y: 1, w: 11.5, h: 0, line: { color: C.lightGray, width: 1 } });
}

function addInsight(s, pptx, text) {
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 4.65, w: '100%', h: 0.6, fill: { color: C.bgGray } });
  s.addText(text, { x: 0.6, y: 4.7, w: '85%', h: 0.5, fontSize: 11, italic: true, color: C.darkGray, fontFace: 'Microsoft JhengHei' });
}

function addPageNum(s, pptx, num) {
  s.addShape(pptx.ShapeType.ellipse, { x: 12, y: 4.85, w: 0.35, h: 0.35, fill: { color: C.red } });
  s.addText(`${num}`, { x: 12, y: 4.85, w: 0.35, h: 0.35, fontSize: 8, bold: true, color: C.white, align: 'center', valign: 'middle' });
}

async function generate() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Ken Talk';
  pptx.title = 'Ken Talk — 討論即簡報';

  // ===== 封面 =====
  const s1 = pptx.addSlide();
  s1.background = { fill: C.white };
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.8, h: '100%', fill: { color: C.red } });
  s1.addText('Ken Talk', {
    x: 0.5, y: 0.8, w: 3.8, h: 1,
    fontSize: 44, bold: true, color: C.white, fontFace: 'Microsoft JhengHei',
  });
  s1.addText('討論即簡報', {
    x: 0.5, y: 1.8, w: 3.8, h: 0.6,
    fontSize: 22, color: C.white, fontFace: 'Microsoft JhengHei',
  });
  s1.addText('跟老闆 AI 對話\n一鍵產出專業簡報', {
    x: 0.5, y: 2.8, w: 3.8, h: 1,
    fontSize: 14, color: C.white, fontFace: 'Microsoft JhengHei', lineSpacingMultiple: 1.5,
  });
  // 右側
  s1.addText('為什麼我們需要 Ken Talk？', {
    x: 5.5, y: 1.5, w: 6.5, h: 0.6,
    fontSize: 20, color: C.darkGray, fontFace: 'Microsoft JhengHei',
  });
  s1.addShape(pptx.ShapeType.line, { x: 5.5, y: 2.3, w: 3, h: 0, line: { color: C.red, width: 3 } });
  s1.addText('產品介紹 & 使用情境分享', {
    x: 5.5, y: 2.6, w: 6.5, h: 0.5,
    fontSize: 13, color: C.gray, fontFace: 'Microsoft JhengHei',
  });
  const today = new Date().toLocaleDateString('zh-TW');
  s1.addText(today, { x: 5.5, y: 3.3, w: 6.5, h: 0.4, fontSize: 11, color: C.lightGray });

  // ===== P2: 痛點 =====
  const s2 = pptx.addSlide();
  s2.background = { fill: C.white };
  addTitle(s2, pptx, '我們每天花多少時間在「準備報告」？');

  const painPoints = [
    { icon: '😩', title: '反覆修改簡報', desc: '花 2-3 小時做簡報\n老闆一句話全部重來' },
    { icon: '🤔', title: '猜老闆在想什麼', desc: '不確定老闆的思維框架\n簡報方向常常偏離' },
    { icon: '⏰', title: '溝通效率低', desc: '想法→文件→會議→修改\n來回至少要 3 天' },
    { icon: '📊', title: '簡報品質不穩定', desc: '每個人做出來的\n風格和邏輯都不同' },
  ];

  painPoints.forEach((p, i) => {
    const x = 0.6 + i * 3;
    s2.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: 2.7, h: 2.8,
      fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
      rectRadius: 0.12, shadow: SHADOW,
    });
    s2.addShape(pptx.ShapeType.rect, { x, y: 1.3, w: 2.7, h: 0.05, fill: { color: C.red } });
    s2.addText(p.icon, { x, y: 1.5, w: 2.7, h: 0.6, fontSize: 32, align: 'center' });
    s2.addText(p.title, {
      x: x + 0.1, y: 2.15, w: 2.5, h: 0.4,
      fontSize: 14, bold: true, color: C.black, align: 'center', fontFace: 'Microsoft JhengHei',
    });
    s2.addText(p.desc, {
      x: x + 0.1, y: 2.6, w: 2.5, h: 0.9,
      fontSize: 11, color: C.gray, align: 'center', fontFace: 'Microsoft JhengHei', lineSpacingMultiple: 1.3,
    });
  });

  addInsight(s2, pptx, '💡 根據調查，中階主管平均每週花 6+ 小時在簡報製作，其中 40% 的時間用在揣摩上意');
  addPageNum(s2, pptx, 2);

  // ===== P3: 解法 — Ken Talk 是什麼 =====
  const s3 = pptx.addSlide();
  s3.background = { fill: C.white };
  addTitle(s3, pptx, 'Ken Talk — 用對話取代傳統簡報流程');

  // Flow chart
  const steps = [
    { label: '跟 Ken AI\n聊你的想法', color: C.red },
    { label: 'AI 即時回饋\n模擬老闆視角', color: C.blue },
    { label: '自動整理\n討論重點', color: C.teal },
    { label: '一鍵生成\n專業簡報', color: C.green },
    { label: '下載 PPT 或\n存 Google Slides', color: C.orange },
  ];

  steps.forEach((step, i) => {
    const x = 0.5 + i * 2.4;
    s3.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.8, w: 2.1, h: 1.2,
      fill: { color: C.white }, line: { color: step.color, width: 2 },
      rectRadius: 0.1, shadow: SHADOW,
    });
    s3.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.85, y: 1.55, w: 0.4, h: 0.4, fill: { color: step.color },
    });
    s3.addText(`${i + 1}`, {
      x: x + 0.85, y: 1.55, w: 0.4, h: 0.4,
      fontSize: 12, bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    s3.addText(step.label, {
      x, y: 2.05, w: 2.1, h: 0.85,
      fontSize: 12, color: C.darkGray, align: 'center', valign: 'middle',
      fontFace: 'Microsoft JhengHei', lineSpacingMultiple: 1.3,
    });
    if (i < steps.length - 1) {
      s3.addShape(pptx.ShapeType.line, {
        x: x + 2.1, y: 2.4, w: 0.3, h: 0,
        line: { color: C.red, width: 2, endArrowType: 'triangle' },
      });
    }
  });

  s3.addText('從想法到簡報，只要一場對話的時間', {
    x: 0.6, y: 3.5, w: '85%', h: 0.5,
    fontSize: 16, bold: true, color: C.red, align: 'center', fontFace: 'Microsoft JhengHei',
  });

  addInsight(s3, pptx, '💡 Ken Talk 就像一個永遠在線的老闆模擬器 — 先跟 AI 對練，再上真正的戰場');
  addPageNum(s3, pptx, 3);

  // ===== P4: 核心功能 =====
  const s4 = pptx.addSlide();
  s4.background = { fill: C.white };
  addTitle(s4, pptx, '四大核心功能');

  const features = [
    { icon: '🤖', title: 'AI 老闆對話', desc: '完整模擬 Ken 的思維模式\n回覆風格、提問方式、價值觀\n讓你提前知道老闆會問什麼', color: C.red },
    { icon: '📊', title: '智慧簡報生成', desc: '8 種專業版面自動配置\n表格、流程圖、時間軸、對比圖\n符合 SCQA 說服框架', color: C.blue },
    { icon: '⚡', title: '一鍵匯出', desc: '下載 PPT 或直接存到\nGoogle Slides\n隨時隨地都能使用', color: C.teal },
    { icon: '🎯', title: '自訂 Prompt', desc: '可調整老闆人格設定\n可調整簡報生成邏輯\n適用於不同報告場景', color: C.green },
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 6;
    const y = 1.2 + row * 1.7;

    s4.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 5.7, h: 1.5,
      fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
      rectRadius: 0.1, shadow: SHADOW,
    });
    s4.addShape(pptx.ShapeType.rect, { x, y, w: 0.06, h: 1.5, fill: { color: f.color } });

    s4.addText(f.icon, { x: x + 0.2, y: y + 0.1, w: 0.8, h: 0.8, fontSize: 32 });
    s4.addText(f.title, {
      x: x + 1.1, y: y + 0.1, w: 4, h: 0.35,
      fontSize: 15, bold: true, color: C.black, fontFace: 'Microsoft JhengHei',
    });
    s4.addText(f.desc, {
      x: x + 1.1, y: y + 0.5, w: 4, h: 0.9,
      fontSize: 11, color: C.gray, fontFace: 'Microsoft JhengHei', lineSpacingMultiple: 1.4,
    });
  });

  addPageNum(s4, pptx, 4);

  // ===== P5: 使用情境 =====
  const s5 = pptx.addSlide();
  s5.background = { fill: C.white };
  addTitle(s5, pptx, '三大使用情境');

  const scenarios = [
    {
      title: '情境一：週會提案',
      before: '花整個下午做簡報，上場被問到啞口無言',
      after: '午休時跟 Ken AI 對練 15 分鐘，簡報自動產出，提案一次過',
      color: C.red,
    },
    {
      title: '情境二：新產品企劃',
      before: '寫了 30 頁企劃書，老闆只看前 3 頁就說「這不是我要的」',
      after: '先用 Ken Talk 驗證思路，確認方向對了再展開，省下 80% 無效工作',
      color: C.blue,
    },
    {
      title: '情境三：跨部門協作',
      before: '不知道其他部門主管在意什麼，簡報做出來各說各話',
      after: '調整 System Prompt 模擬不同主管，針對性準備，一份簡報打動所有人',
      color: C.teal,
    },
  ];

  scenarios.forEach((sc, i) => {
    const y = 1.2 + i * 1.15;
    // Card
    s5.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y, w: 12, h: 1,
      fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
      rectRadius: 0.08, shadow: SHADOW,
    });
    s5.addShape(pptx.ShapeType.rect, { x: 0.6, y, w: 0.06, h: 1, fill: { color: sc.color } });

    s5.addText(sc.title, {
      x: 0.85, y, w: 2, h: 1,
      fontSize: 13, bold: true, color: sc.color, valign: 'middle', fontFace: 'Microsoft JhengHei',
    });
    // Before
    s5.addText('Before', {
      x: 3, y: y + 0.05, w: 0.8, h: 0.35,
      fontSize: 9, bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    s5.addShape(pptx.ShapeType.roundRect, {
      x: 3, y: y + 0.05, w: 0.8, h: 0.3,
      fill: { color: C.gray }, rectRadius: 0.05,
    });
    s5.addText('Before', {
      x: 3, y: y + 0.05, w: 0.8, h: 0.3,
      fontSize: 8, bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    s5.addText(sc.before, {
      x: 3.9, y: y + 0.05, w: 4, h: 0.4,
      fontSize: 10, color: C.gray, fontFace: 'Microsoft JhengHei',
    });
    // After
    s5.addShape(pptx.ShapeType.roundRect, {
      x: 3, y: y + 0.55, w: 0.8, h: 0.3,
      fill: { color: sc.color }, rectRadius: 0.05,
    });
    s5.addText('After', {
      x: 3, y: y + 0.55, w: 0.8, h: 0.3,
      fontSize: 8, bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    s5.addText(sc.after, {
      x: 3.9, y: y + 0.5, w: 8, h: 0.45,
      fontSize: 10, bold: true, color: C.darkGray, fontFace: 'Microsoft JhengHei',
    });
  });

  addInsight(s5, pptx, '💡 不是取代思考，而是加速從「想法」到「可執行方案」的過程');
  addPageNum(s5, pptx, 5);

  // ===== P6: 效益 (Big Numbers) =====
  const s6 = pptx.addSlide();
  s6.background = { fill: C.white };
  addTitle(s6, pptx, '預期效益');

  const metrics = [
    { num: '80%', label: '簡報製作時間縮短', sub: '從 3 小時 → 30 分鐘', color: C.red },
    { num: '3x', label: '提案通過率提升', sub: '提前模擬老闆思維', color: C.blue },
    { num: '0', label: '元額外成本', sub: '用現有 OpenAI API Key', color: C.teal },
  ];

  metrics.forEach((m, i) => {
    const x = 0.6 + i * 4.1;
    s6.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: 3.8, h: 2.8,
      fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
      rectRadius: 0.15, shadow: SHADOW,
    });
    s6.addShape(pptx.ShapeType.rect, { x, y: 1.3, w: 3.8, h: 0.06, fill: { color: m.color } });

    s6.addText(m.num, {
      x, y: 1.5, w: 3.8, h: 1.2,
      fontSize: 56, bold: true, color: m.color, align: 'center', valign: 'middle',
    });
    s6.addText(m.label, {
      x, y: 2.7, w: 3.8, h: 0.5,
      fontSize: 16, bold: true, color: C.black, align: 'center', fontFace: 'Microsoft JhengHei',
    });
    s6.addText(m.sub, {
      x, y: 3.2, w: 3.8, h: 0.4,
      fontSize: 12, color: C.gray, align: 'center', fontFace: 'Microsoft JhengHei',
    });
  });

  addInsight(s6, pptx, '💡 真正的效益不是省時間，而是讓每個人的想法都能被「正確地」傳達');
  addPageNum(s6, pptx, 6);

  // ===== P7: 為什麼是現在做 =====
  const s7 = pptx.addSlide();
  s7.background = { fill: C.white };
  addTitle(s7, pptx, '為什麼是現在？為什麼是我們？');

  // Two columns
  const whyNow = [
    'AI 技術已經成熟到可以精準模擬人格',
    '遠端工作讓「非同步溝通」成為新常態',
    '公司規模擴大，溝通成本指數級增長',
  ];
  const whyUs = [
    '我們最了解 Ken 的思維模式和決策邏輯',
    '我們有第一手的痛點體驗',
    '技術棧（Expo + AI）可快速迭代驗證',
  ];

  // Why Now card
  s7.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 1.2, w: 5.8, h: 3.2,
    fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
    rectRadius: 0.12, shadow: SHADOW,
  });
  s7.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 1.2, w: 5.8, h: 0.5,
    fill: { color: C.red }, rectRadius: 0.12,
  });
  s7.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.5, w: 5.8, h: 0.2, fill: { color: C.red } });
  s7.addText('為什麼是現在', {
    x: 0.6, y: 1.2, w: 5.8, h: 0.5,
    fontSize: 15, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: 'Microsoft JhengHei',
  });
  whyNow.forEach((t, i) => {
    s7.addShape(pptx.ShapeType.ellipse, {
      x: 1, y: 1.95 + i * 0.7, w: 0.3, h: 0.3, fill: { color: C.red },
    });
    s7.addText(`${i + 1}`, {
      x: 1, y: 1.95 + i * 0.7, w: 0.3, h: 0.3,
      fontSize: 10, bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    s7.addText(t, {
      x: 1.5, y: 1.9 + i * 0.7, w: 4.5, h: 0.4,
      fontSize: 12, color: C.darkGray, fontFace: 'Microsoft JhengHei',
    });
  });

  // Why Us card
  s7.addShape(pptx.ShapeType.roundRect, {
    x: 6.7, y: 1.2, w: 5.8, h: 3.2,
    fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
    rectRadius: 0.12, shadow: SHADOW,
  });
  s7.addShape(pptx.ShapeType.roundRect, {
    x: 6.7, y: 1.2, w: 5.8, h: 0.5,
    fill: { color: C.blue }, rectRadius: 0.12,
  });
  s7.addShape(pptx.ShapeType.rect, { x: 6.7, y: 1.5, w: 5.8, h: 0.2, fill: { color: C.blue } });
  s7.addText('為什麼是我們', {
    x: 6.7, y: 1.2, w: 5.8, h: 0.5,
    fontSize: 15, bold: true, color: C.white, align: 'center', valign: 'middle', fontFace: 'Microsoft JhengHei',
  });
  whyUs.forEach((t, i) => {
    s7.addShape(pptx.ShapeType.ellipse, {
      x: 7.1, y: 1.95 + i * 0.7, w: 0.3, h: 0.3, fill: { color: C.blue },
    });
    s7.addText(`${i + 1}`, {
      x: 7.1, y: 1.95 + i * 0.7, w: 0.3, h: 0.3,
      fontSize: 10, bold: true, color: C.white, align: 'center', valign: 'middle',
    });
    s7.addText(t, {
      x: 7.6, y: 1.9 + i * 0.7, w: 4.5, h: 0.4,
      fontSize: 12, color: C.darkGray, fontFace: 'Microsoft JhengHei',
    });
  });

  addPageNum(s7, pptx, 7);

  // ===== P8: 技術架構 =====
  const s8 = pptx.addSlide();
  s8.background = { fill: C.white };
  addTitle(s8, pptx, '技術架構 — 簡單但完整');

  // Table
  const techHeaders = ['層級', '技術', '用途'].map(h => ({
    text: h, options: { bold: true, color: C.white, fill: { color: C.red }, align: 'center', fontSize: 13, fontFace: 'Microsoft JhengHei', border: { type: 'solid', pt: 0.5, color: C.lightGray } }
  }));
  const techRows = [
    ['前端 APP', 'Expo (React Native)', 'iOS + Web 一套程式碼'],
    ['AI 引擎', 'OpenAI GPT-4o', '模擬老闆對話 + 簡報結構生成'],
    ['簡報產出', 'pptxgenjs', '8 種專業版面 PPT 生成'],
    ['雲端儲存', 'Google Slides API', '一鍵存到 Google Drive'],
    ['資料儲存', 'AsyncStorage', '本地持久化，無需後端'],
  ];

  const rows = techRows.map((row, ri) => row.map(cell => ({
    text: cell,
    options: {
      color: C.darkGray, fill: { color: ri % 2 === 0 ? C.white : C.bgGray },
      align: 'center', fontSize: 12, fontFace: 'Microsoft JhengHei',
      border: { type: 'solid', pt: 0.5, color: C.lightGray },
    }
  })));

  s8.addTable([techHeaders, ...rows], {
    x: 1, y: 1.3, w: 11,
    colW: [2.5, 3.5, 5],
    rowH: 0.45,
    margin: 6,
    shadow: SHADOW,
  });

  addInsight(s8, pptx, '💡 零後端架構 — 不需要部署伺服器，API Key 存在用戶端，立刻可用');
  addPageNum(s8, pptx, 8);

  // ===== P9: 行動方案 =====
  const s9 = pptx.addSlide();
  s9.background = { fill: C.white };
  addTitle(s9, pptx, '下一步行動方案');

  // Timeline
  const timeline = [
    { time: '本週', label: '內部測試\n收集回饋', color: C.red },
    { time: '第 2 週', label: '調整 Ken\nSystem Prompt', color: C.blue },
    { time: '第 3 週', label: '開放全公司\n使用', color: C.teal },
    { time: '第 4 週', label: '收集數據\n量化效益', color: C.green },
    { time: '長期', label: '支援更多\n主管模擬', color: C.orange },
  ];

  const lineY = 2.5;
  s9.addShape(pptx.ShapeType.line, {
    x: 1, y: lineY, w: 11, h: 0,
    line: { color: C.red, width: 3 },
  });

  timeline.forEach((t, i) => {
    const x = 1 + (i / (timeline.length - 1)) * 11;
    const above = i % 2 === 0;

    s9.addShape(pptx.ShapeType.ellipse, {
      x: x - 0.2, y: lineY - 0.2, w: 0.4, h: 0.4,
      fill: { color: t.color }, shadow: SHADOW,
    });
    s9.addText(`${i + 1}`, {
      x: x - 0.2, y: lineY - 0.2, w: 0.4, h: 0.4,
      fontSize: 10, bold: true, color: C.white, align: 'center', valign: 'middle',
    });

    s9.addShape(pptx.ShapeType.line, {
      x, y: above ? lineY - 1 : lineY + 0.25,
      w: 0, h: 0.75,
      line: { color: C.lightGray, width: 1, dashType: 'dash' },
    });

    const labelY = above ? lineY - 1.7 : lineY + 1.1;
    s9.addText(t.time, {
      x: x - 0.7, y: labelY, w: 1.4, h: 0.3,
      fontSize: 11, bold: true, color: t.color, align: 'center', fontFace: 'Microsoft JhengHei',
    });
    s9.addText(t.label, {
      x: x - 0.7, y: labelY + 0.3, w: 1.4, h: 0.45,
      fontSize: 10, color: C.darkGray, align: 'center', fontFace: 'Microsoft JhengHei', lineSpacingMultiple: 1.3,
    });
  });

  addInsight(s9, pptx, '💡 小規模測試，用最極致的方式驗證 — 如果連我們自己都不用，這件事根本不用做');
  addPageNum(s9, pptx, 9);

  // ===== P10: 引言結尾 =====
  const s10 = pptx.addSlide();
  s10.background = { fill: C.white };

  s10.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: C.red } });

  // Quote card
  s10.addShape(pptx.ShapeType.roundRect, {
    x: 1.5, y: 0.8, w: 10, h: 2.5,
    fill: { color: C.white }, line: { color: C.bgGray, width: 1 },
    rectRadius: 0.15, shadow: SHADOW,
  });
  s10.addShape(pptx.ShapeType.rect, { x: 1.5, y: 0.8, w: 0.08, h: 2.5, fill: { color: C.red } });

  s10.addText('\u201C', {
    x: 2, y: 0.8, w: 0.8, h: 0.8,
    fontSize: 60, color: C.red, fontFace: 'Georgia',
  });
  s10.addText('不是用說教的方式來幫助別人，\n而是潛移默化的方式來讓人變得更好。', {
    x: 2.5, y: 1.3, w: 8.5, h: 1.2,
    fontSize: 22, italic: true, color: C.black, lineSpacingMultiple: 1.5, fontFace: 'Microsoft JhengHei',
  });
  s10.addText('— Ken', {
    x: 2.5, y: 2.6, w: 8.5, h: 0.4,
    fontSize: 14, color: C.red, align: 'right', fontFace: 'Microsoft JhengHei',
  });

  // CTA
  s10.addText('Ken Talk 就是這個理念的實踐 —\n讓每個人在對話中自然地提升思考品質', {
    x: 1.5, y: 3.6, w: 10, h: 0.8,
    fontSize: 15, color: C.darkGray, align: 'center', fontFace: 'Microsoft JhengHei', lineSpacingMultiple: 1.5,
  });

  addPageNum(s10, pptx, 10);

  // ===== 結尾 =====
  const sEnd = pptx.addSlide();
  sEnd.background = { fill: C.white };
  sEnd.addShape(pptx.ShapeType.rect, { x: 8, y: 0, w: 5.33, h: '100%', fill: { color: C.red } });

  sEnd.addText('Thank You', {
    x: 0.8, y: 1.2, w: 6.5, h: 1,
    fontSize: 48, bold: true, color: C.red, fontFace: 'Microsoft JhengHei',
  });
  sEnd.addShape(pptx.ShapeType.line, { x: 0.8, y: 2.4, w: 3, h: 0, line: { color: C.red, width: 3 } });
  sEnd.addText('Ken Talk — 討論即簡報', {
    x: 0.8, y: 2.7, w: 6.5, h: 0.5,
    fontSize: 16, color: C.darkGray, fontFace: 'Microsoft JhengHei',
  });
  sEnd.addText('現在就開始跟 Ken 聊聊你的想法吧！', {
    x: 0.8, y: 3.3, w: 6.5, h: 0.5,
    fontSize: 13, color: C.gray, fontFace: 'Microsoft JhengHei',
  });

  // White text on red side
  sEnd.addText('🚀', { x: 9, y: 1.5, w: 3, h: 1, fontSize: 48, align: 'center' });
  sEnd.addText('立即體驗', {
    x: 9, y: 2.5, w: 3, h: 0.5,
    fontSize: 20, bold: true, color: C.white, align: 'center', fontFace: 'Microsoft JhengHei',
  });
  sEnd.addText('npm run web\nnpm run ios', {
    x: 9, y: 3.2, w: 3, h: 0.8,
    fontSize: 13, color: C.white, align: 'center', fontFace: 'Courier New', lineSpacingMultiple: 1.5,
  });

  await pptx.writeFile({ fileName: '/Users/rebeccachiu/Desktop/KenTalk-介紹簡報.pptx' });
  console.log('Done! Saved to Desktop/KenTalk-介紹簡報.pptx');
}

generate().catch(console.error);
