import { PresentationData, SlideContent } from '../types';

function renderSlideHTML(slide: SlideContent, index: number): string {
  const layout = slide.layout || 'bullets';
  const colors = ['#C00000', '#2F5496', '#2EAAAA', '#548235', '#ED7D31', '#6C63FF'];

  const header = `
    <div class="s-header">
      <h2>${slide.title}</h2>
      ${slide.subtitle ? `<div class="sub">${slide.subtitle}</div>` : ''}
    </div>`;

  const footer = `
    <div class="s-footer">
      <span>${slide.notes ? '💡 ' + slide.notes : ''}</span>
      <span class="pg">${index + 2}</span>
    </div>`;

  let body = '';

  switch (layout) {
    case 'bullets':
      body = `<ul class="bullets">${(slide.bullets || []).map(b => `<li>${b}</li>`).join('')}</ul>`;
      break;

    case 'table':
      if (slide.table) {
        body = `<table class="s-table">
          <thead><tr>${slide.table.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${slide.table.rows.map((row, ri) => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;
      }
      break;

    case 'flow':
      body = `<div class="flow-wrap">${(slide.flow || []).map((n, i) => {
        const c = colors[i % colors.length];
        return `<div class="flow-node" style="--accent:${c}"><div class="step-num" style="background:${c}">${i + 1}</div><p>${n.label.replace(/\\n/g, '<br>')}</p></div>${i < (slide.flow?.length || 0) - 1 ? '<div class="flow-arrow">→</div>' : ''}`;
      }).join('')}</div>`;
      break;

    case 'icons':
      body = `<div class="icon-grid">${(slide.icons || []).map((ic, i) => {
        const c = colors[i % colors.length];
        return `<div class="icon-card" style="--accent:${c}"><div class="emoji">${ic.icon}</div><h4>${ic.title}</h4><p>${ic.desc}</p></div>`;
      }).join('')}</div>`;
      break;

    case 'matrix':
      body = `<div class="icon-grid">${(slide.matrix || []).map((m, i) => {
        const c = colors[i % colors.length];
        return `<div class="icon-card" style="--accent:${c}"><div class="emoji">${m.icon}</div><h4>${m.title}</h4><p>${m.desc}</p></div>`;
      }).join('')}</div>`;
      break;

    case 'timeline':
      body = `<div class="tl-wrap"><div class="tl-line"></div>${(slide.timeline || []).map((t, i) => {
        const c = colors[i % colors.length];
        return `<div class="tl-item"><div class="tl-dot" style="background:${c}">${i + 1}</div><div class="info"><h5>${t.time}</h5><p>${t.label}</p></div></div>`;
      }).join('')}</div>`;
      break;

    case 'compare':
      body = `<div class="compare-wrap">${(slide.compare || []).map((col, i) => {
        const c = colors[i % colors.length];
        return `<div class="compare-col"><h4 style="background:${c}">${col.title}</h4><ul>${col.items.map(it => `<li>• ${it}</li>`).join('')}</ul></div>`;
      }).join('')}</div>`;
      break;

    case 'bigNumber':
      if (slide.bigNumber) {
        body = `<div class="big-num-wrap">
          <div class="num">${slide.bigNumber.number}</div>
          <div class="label">${slide.bigNumber.label}</div>
          ${slide.bigNumber.sub ? `<div class="sub-text">${slide.bigNumber.sub}</div>` : ''}
        </div>`;
      }
      break;

    case 'quote':
      if (slide.quote) {
        body = `<div class="quote-wrap">
          <div class="qt">「${slide.quote.text}」</div>
          ${slide.quote.author ? `<div class="qa">— ${slide.quote.author}</div>` : ''}
        </div>`;
      }
      break;

    case 'kpis':
      body = `<div class="kpi-grid">${(slide.kpis || []).map((k, i) => {
        const c = colors[i % colors.length];
        const arrow = k.trend === 'up' ? '▲' : k.trend === 'down' ? '▼' : '●';
        const arrowColor = k.trend === 'up' ? '#548235' : k.trend === 'down' ? '#C00000' : '#7F7F7F';
        return `<div class="kpi-card" style="--accent:${c}"><div class="trend" style="color:${arrowColor}">${arrow}</div><div class="knum">${k.number}</div><h4>${k.label}</h4>${k.sub ? `<p>${k.sub}</p>` : ''}</div>`;
      }).join('')}</div>`;
      break;

    case 'beforeAfter':
      if (slide.beforeAfter) {
        body = `<div class="ba-wrap">
          <div class="ba-col before"><h4>😞 Before</h4><ul>${slide.beforeAfter.before.map(b => `<li>✕ ${b}</li>`).join('')}</ul></div>
          <div class="ba-arrow">→</div>
          <div class="ba-col after"><h4>😊 After</h4><ul>${slide.beforeAfter.after.map(a => `<li>✓ ${a}</li>`).join('')}</ul></div>
        </div>`;
      }
      break;

    case 'pyramid':
      body = `<div class="pyramid-wrap">${(slide.pyramid || []).map((level, i, arr) => {
        const c = colors[i % colors.length];
        const w = 30 + (i / Math.max(arr.length - 1, 1)) * 70;
        return `<div class="pyramid-level" style="background:${c};width:${w}%">${level}</div>`;
      }).join('')}</div>`;
      break;

    default:
      body = `<ul class="bullets">${(slide.bullets || []).map(b => `<li>${b}</li>`).join('')}</ul>`;
  }

  return `<div class="slide-card"><div class="slide-frame s-content">${header}<div class="s-body">${body}</div>${footer}</div></div>`;
}

export function generatePreviewHTML(data: PresentationData): string {
  const slidesHTML = data.slides.map((s, i) => renderSlideHTML(s, i)).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.title} — Ken Talk</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,'Microsoft JhengHei',sans-serif;background:#0a0a12;color:#fff;padding:0}
.top-bar{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:rgba(10,10,18,.95);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06)}
.top-bar .logo{font-size:16px;font-weight:800;color:#C00000}
.top-bar .title{font-size:13px;color:rgba(255,255,255,.5)}
.container{max-width:960px;margin:0 auto;padding:24px}
.slide-card{margin-bottom:32px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.06);opacity:0;transform:translateY(30px);transition:all .6s cubic-bezier(.16,1,.3,1)}
.slide-card.visible{opacity:1;transform:translateY(0)}

/* Cover */
.cover-frame{display:flex;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.06);margin-bottom:32px;opacity:0;transform:translateY(30px);transition:all .6s cubic-bezier(.16,1,.3,1)}
.cover-frame.visible{opacity:1;transform:translateY(0)}
.cover-left{width:38%;background:#C00000;padding:48px 36px;display:flex;flex-direction:column;justify-content:center}
.cover-left h1{font-size:clamp(24px,3.5vw,36px);font-weight:900;color:#fff;line-height:1.2;margin-bottom:12px}
.cover-left p{font-size:14px;color:rgba(255,255,255,.8);line-height:1.6}
.cover-right{flex:1;background:#fff;padding:48px 36px;display:flex;flex-direction:column;justify-content:center}
.cover-right .sub{font-size:18px;color:#4A4A4A;margin-bottom:16px;line-height:1.5}
.cover-right .line{width:60px;height:3px;background:#C00000;margin-bottom:12px}
.cover-right .meta{font-size:12px;color:#BFBFBF}

/* End */
.end-frame{display:flex;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.06);margin-bottom:32px;opacity:0;transform:translateY(30px);transition:all .6s cubic-bezier(.16,1,.3,1)}
.end-frame.visible{opacity:1;transform:translateY(0)}
.end-left{flex:1;background:#fff;padding:48px;display:flex;flex-direction:column;justify-content:center}
.end-left h2{font-size:48px;font-weight:900;color:#C00000;margin-bottom:12px}
.end-left .line{width:60px;height:3px;background:#C00000;margin-bottom:12px}
.end-left p{font-size:14px;color:#7F7F7F}
.end-right{width:35%;background:#C00000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px}
.end-right .emoji{font-size:48px;margin-bottom:12px}
.end-right h3{font-size:20px;font-weight:800;color:#fff}

/* Slide content */
.s-content{background:#fff;color:#1C1C1B}
.s-header{padding:24px 36px 12px;border-top:4px solid #C00000}
.s-header h2{font-size:clamp(18px,2.5vw,24px);font-weight:800;color:#1C1C1B;margin-bottom:4px}
.s-header .sub{font-size:14px;color:#7F7F7F;line-height:1.5}
.s-body{padding:20px 36px 16px}
.s-footer{padding:12px 36px;background:#F5F5F5;font-size:12px;color:#4A4A4A;font-style:italic;display:flex;justify-content:space-between;align-items:center}
.s-footer .pg{width:28px;height:28px;border-radius:50%;background:#C00000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;font-style:normal}

.bullets{list-style:none;padding:0}
.bullets li{font-size:15px;color:#4A4A4A;line-height:1.7;margin-bottom:10px;padding-left:20px;position:relative}
.bullets li::before{content:'';width:7px;height:7px;border-radius:50%;background:#C00000;position:absolute;left:0;top:10px}

.icon-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.icon-card{background:#F5F5F5;border-radius:12px;padding:20px;text-align:center;border-top:3px solid var(--accent,#C00000);transition:transform .3s}
.icon-card:hover{transform:translateY(-4px)}
.icon-card .emoji{font-size:32px;margin-bottom:8px}
.icon-card h4{font-size:14px;font-weight:700;color:#1C1C1B;margin-bottom:6px}
.icon-card p{font-size:12px;color:#7F7F7F;line-height:1.6}

.big-num-wrap{text-align:center;padding:32px 0}
.big-num-wrap .num{font-size:clamp(56px,10vw,88px);font-weight:900;color:#C00000}
.big-num-wrap .label{font-size:22px;color:#1C1C1B;font-weight:700;margin-top:4px}
.big-num-wrap .sub-text{font-size:14px;color:#2EAAAA;margin-top:8px}

.ba-wrap{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:start}
.ba-col{background:#F5F5F5;border-radius:12px;padding:20px}
.ba-col h4{font-size:15px;font-weight:700;margin-bottom:12px;text-align:center;padding:8px;border-radius:8px;color:#fff}
.ba-col.before h4{background:#7F7F7F}
.ba-col.after h4{background:#548235}
.ba-col ul{list-style:none;padding:0}
.ba-col li{font-size:13px;color:#4A4A4A;line-height:1.7;margin-bottom:6px}
.ba-arrow{font-size:32px;color:#C00000;align-self:center;padding-top:28px}

.flow-wrap{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;padding:12px 0}
.flow-node{background:#F5F5F5;border:2px solid var(--accent,#C00000);border-radius:12px;padding:14px 18px;text-align:center;min-width:110px;transition:transform .3s}
.flow-node:hover{transform:scale(1.05)}
.flow-node .step-num{width:24px;height:24px;border-radius:50%;background:var(--accent,#C00000);color:#fff;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;margin-bottom:6px}
.flow-node p{font-size:12px;color:#4A4A4A;line-height:1.4}
.flow-arrow{font-size:20px;color:#BFBFBF}

.s-table{width:100%;border-collapse:collapse;font-size:14px}
.s-table th{background:#C00000;color:#fff;padding:10px 14px;text-align:center;font-weight:700}
.s-table td{padding:10px 14px;text-align:center;color:#4A4A4A;border-bottom:1px solid #eee}
.s-table tr:nth-child(even) td{background:#F5F5F5}

.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}
.kpi-card{background:#F5F5F5;border-radius:12px;padding:20px;text-align:center;border-top:3px solid var(--accent,#2F5496);transition:transform .3s}
.kpi-card:hover{transform:translateY(-4px)}
.kpi-card .trend{font-size:16px}
.kpi-card .knum{font-size:clamp(28px,5vw,40px);font-weight:900;color:var(--accent,#2F5496)}
.kpi-card h4{font-size:13px;font-weight:700;color:#1C1C1B;margin:6px 0 4px}
.kpi-card p{font-size:11px;color:#7F7F7F}

.quote-wrap{border-left:4px solid #C00000;padding:24px 28px;background:#F5F5F5;border-radius:0 12px 12px 0;margin:16px 0}
.quote-wrap .qt{font-size:clamp(16px,2.5vw,22px);font-style:italic;color:#1C1C1B;line-height:1.6;margin-bottom:12px}
.quote-wrap .qa{font-size:14px;color:#C00000;text-align:right}

.tl-wrap{position:relative;padding-left:32px}
.tl-line{position:absolute;left:12px;top:0;bottom:0;width:3px;background:#C00000}
.tl-item{position:relative;margin-bottom:18px;display:flex;gap:14px;align-items:flex-start}
.tl-dot{width:24px;height:24px;border-radius:50%;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1}
.tl-item .info h5{font-size:14px;font-weight:700;color:#1C1C1B}
.tl-item .info p{font-size:13px;color:#7F7F7F}

.compare-wrap{display:flex;gap:16px}
.compare-col{flex:1;background:#F5F5F5;border-radius:12px;overflow:hidden;transition:transform .3s}
.compare-col:hover{transform:translateY(-4px)}
.compare-col h4{padding:10px;text-align:center;color:#fff;font-size:14px;font-weight:700}
.compare-col ul{list-style:none;padding:12px 16px}
.compare-col li{font-size:12px;color:#4A4A4A;line-height:1.7;margin-bottom:4px}

.pyramid-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;padding:16px 0}
.pyramid-level{text-align:center;padding:12px 16px;border-radius:6px;color:#fff;font-size:13px;font-weight:600;transition:transform .3s}
.pyramid-level:hover{transform:scale(1.03)}

@media(max-width:768px){
  .cover-frame,.end-frame{flex-direction:column}
  .cover-left,.end-right{width:100%}
  .ba-wrap{grid-template-columns:1fr}
  .ba-arrow{display:none}
  .flow-wrap{flex-direction:column}
  .flow-arrow{transform:rotate(90deg)}
  .compare-wrap{flex-direction:column}
}
</style>
</head>
<body>

<div class="top-bar">
  <span class="logo">Ken Talk</span>
  <span class="title">${data.title}</span>
</div>

<div class="container">
  <!-- Cover -->
  <div class="cover-frame" id="cover">
    <div class="cover-left">
      <h1>${data.title}</h1>
      <p>${data.subtitle || ''}</p>
    </div>
    <div class="cover-right">
      <div class="sub">由 Ken Talk 自動生成</div>
      <div class="line"></div>
      <div class="meta">Ken Talk | 討論即簡報 | ${new Date().toLocaleDateString('zh-TW')}</div>
    </div>
  </div>

  ${slidesHTML}

  <!-- End -->
  <div class="end-frame" id="end">
    <div class="end-left">
      <h2>Thank You</h2>
      <div class="line"></div>
      <p>Generated by Ken Talk</p>
    </div>
    <div class="end-right">
      <div class="emoji">🚀</div>
      <h3>討論即簡報</h3>
    </div>
  </div>
</div>

<script>
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)} });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.slide-card,.cover-frame,.end-frame').forEach(el => observer.observe(el));
</script>
</body>
</html>`;
}
