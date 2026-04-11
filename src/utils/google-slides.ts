import { PresentationData, SlideContent } from '../types';

const API = 'https://slides.googleapis.com/v1/presentations';

// 色彩（Google Slides 用 0-1 的 RGB）
const COLORS = {
  bg1: { red: 0.06, green: 0.06, blue: 0.1 },
  bg2: { red: 0.1, green: 0.1, blue: 0.18 },
  purple: { red: 0.42, green: 0.39, blue: 1 },
  white: { red: 1, green: 1, blue: 1 },
  text: { red: 0.91, green: 0.91, blue: 0.91 },
  textDim: { red: 0.53, green: 0.53, blue: 0.67 },
  teal: { red: 0.31, green: 0.8, blue: 0.77 },
  pink: { red: 1, green: 0.42, blue: 0.42 },
};

function uid() {
  return 'id_' + Math.random().toString(36).slice(2, 10);
}

function pt(val: number) {
  return { magnitude: val, unit: 'PT' };
}

function emu(inches: number) {
  return Math.round(inches * 914400);
}

export async function saveToGoogleSlides(
  data: PresentationData,
  token: string
): Promise<string> {
  // 1. Create blank presentation
  const createRes = await fetch(API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: data.title }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`建立簡報失敗: ${err}`);
  }

  const presentation = await createRes.json();
  const presId = presentation.presentationId;
  const firstSlideId = presentation.slides?.[0]?.objectId;

  // 2. Build all batch update requests
  const requests: any[] = [];

  // Delete the default blank slide (we'll create our own)
  if (firstSlideId) {
    requests.push({ deleteObject: { objectId: firstSlideId } });
  }

  // Cover slide
  const coverSlideId = uid();
  requests.push({
    createSlide: {
      objectId: coverSlideId,
      insertionIndex: 0,
      slideLayoutReference: { predefinedLayout: 'BLANK' },
    },
  });

  // Cover background
  requests.push({
    updatePageProperties: {
      objectId: coverSlideId,
      pageProperties: {
        pageBackgroundFill: {
          solidFill: { color: { rgbColor: COLORS.bg2 } },
        },
      },
      fields: 'pageBackgroundFill',
    },
  });

  // Cover title
  const coverTitleId = uid();
  requests.push({
    createShape: {
      objectId: coverTitleId,
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: coverSlideId,
        size: { width: pt(500), height: pt(80) },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(0.8), translateY: emu(1.5), unit: 'EMU' },
      },
    },
  });
  requests.push({
    insertText: { objectId: coverTitleId, text: data.title },
  });
  requests.push({
    updateTextStyle: {
      objectId: coverTitleId,
      style: {
        fontSize: pt(36),
        bold: true,
        foregroundColor: { opaqueColor: { rgbColor: COLORS.white } },
      },
      fields: 'fontSize,bold,foregroundColor',
    },
  });

  // Cover subtitle
  if (data.subtitle) {
    const coverSubId = uid();
    requests.push({
      createShape: {
        objectId: coverSubId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: coverSlideId,
          size: { width: pt(500), height: pt(40) },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(0.8), translateY: emu(2.8), unit: 'EMU' },
        },
      },
    });
    requests.push({
      insertText: { objectId: coverSubId, text: data.subtitle },
    });
    requests.push({
      updateTextStyle: {
        objectId: coverSubId,
        style: {
          fontSize: pt(18),
          foregroundColor: { opaqueColor: { rgbColor: COLORS.textDim } },
        },
        fields: 'fontSize,foregroundColor',
      },
    });
  }

  // Content slides
  data.slides.forEach((slide, i) => {
    const slideId = uid();
    requests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: i + 1,
        slideLayoutReference: { predefinedLayout: 'BLANK' },
      },
    });

    // Background
    requests.push({
      updatePageProperties: {
        objectId: slideId,
        pageProperties: {
          pageBackgroundFill: {
            solidFill: { color: { rgbColor: COLORS.bg1 } },
          },
        },
        fields: 'pageBackgroundFill',
      },
    });

    // Accent bar
    const barId = uid();
    requests.push({
      createShape: {
        objectId: barId,
        shapeType: 'RECTANGLE',
        elementProperties: {
          pageObjectId: slideId,
          size: { width: pt(4), height: pt(50) },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(0.3), translateY: emu(0.4), unit: 'EMU' },
        },
      },
    });
    requests.push({
      updateShapeProperties: {
        objectId: barId,
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: { color: { rgbColor: COLORS.purple } },
          },
          outline: { outlineFill: { solidFill: { color: { rgbColor: COLORS.purple } } }, weight: pt(0) },
        },
        fields: 'shapeBackgroundFill,outline',
      },
    });

    // Title
    const titleId = uid();
    requests.push({
      createShape: {
        objectId: titleId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: { width: pt(550), height: pt(50) },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(0.55), translateY: emu(0.35), unit: 'EMU' },
        },
      },
    });
    requests.push({
      insertText: { objectId: titleId, text: slide.title },
    });
    requests.push({
      updateTextStyle: {
        objectId: titleId,
        style: {
          fontSize: pt(26),
          bold: true,
          foregroundColor: { opaqueColor: { rgbColor: COLORS.white } },
        },
        fields: 'fontSize,bold,foregroundColor',
      },
    });

    // Content based on layout
    const contentId = uid();
    const contentText = buildSlideContent(slide);

    requests.push({
      createShape: {
        objectId: contentId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: { width: pt(550), height: pt(250) },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(0.6), translateY: emu(1.5), unit: 'EMU' },
        },
      },
    });
    requests.push({
      insertText: { objectId: contentId, text: contentText },
    });
    requests.push({
      updateTextStyle: {
        objectId: contentId,
        style: {
          fontSize: pt(14),
          foregroundColor: { opaqueColor: { rgbColor: COLORS.text } },
        },
        fields: 'fontSize,foregroundColor',
      },
    });

    // Table (native Google Slides table)
    if (slide.layout === 'table' && slide.table) {
      const tableId = uid();
      const rows = slide.table.rows.length + 1; // +1 for header
      const cols = slide.table.headers.length;
      requests.push({
        createTable: {
          objectId: tableId,
          elementProperties: {
            pageObjectId: slideId,
            size: { width: pt(550), height: pt(200) },
            transform: { scaleX: 1, scaleY: 1, translateX: emu(0.6), translateY: emu(1.6), unit: 'EMU' },
          },
          rows,
          columns: cols,
        },
      });

      // Fill header cells
      slide.table.headers.forEach((header, c) => {
        requests.push({
          insertText: {
            objectId: tableId,
            cellLocation: { rowIndex: 0, columnIndex: c },
            text: header,
          },
        });
      });

      // Fill data cells
      slide.table.rows.forEach((row, r) => {
        row.forEach((cell, c) => {
          requests.push({
            insertText: {
              objectId: tableId,
              cellLocation: { rowIndex: r + 1, columnIndex: c },
              text: cell,
            },
          });
        });
      });

      // Delete the text box content for table slides (we use native table instead)
      requests.push({ deleteObject: { objectId: contentId } });
    }
  });

  // End slide
  const endSlideId = uid();
  requests.push({
    createSlide: {
      objectId: endSlideId,
      insertionIndex: data.slides.length + 1,
      slideLayoutReference: { predefinedLayout: 'BLANK' },
    },
  });
  requests.push({
    updatePageProperties: {
      objectId: endSlideId,
      pageProperties: {
        pageBackgroundFill: {
          solidFill: { color: { rgbColor: COLORS.bg2 } },
        },
      },
      fields: 'pageBackgroundFill',
    },
  });
  const endTitleId = uid();
  requests.push({
    createShape: {
      objectId: endTitleId,
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: endSlideId,
        size: { width: pt(500), height: pt(80) },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(1), translateY: emu(1.8), unit: 'EMU' },
      },
    },
  });
  requests.push({
    insertText: { objectId: endTitleId, text: 'Thank You' },
  });
  requests.push({
    updateTextStyle: {
      objectId: endTitleId,
      style: {
        fontSize: pt(48),
        bold: true,
        foregroundColor: { opaqueColor: { rgbColor: COLORS.purple } },
      },
      fields: 'fontSize,bold,foregroundColor',
    },
  });

  // 3. Execute batch update
  const batchRes = await fetch(`${API}/${presId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!batchRes.ok) {
    const err = await batchRes.text();
    throw new Error(`更新簡報失敗: ${err.slice(0, 200)}`);
  }

  return `https://docs.google.com/presentation/d/${presId}/edit`;
}

function buildSlideContent(slide: SlideContent): string {
  const layout = slide.layout || 'bullets';

  switch (layout) {
    case 'bullets':
      return (slide.bullets || []).map((b) => `• ${b}`).join('\n');

    case 'flow':
      return (slide.flow || []).map((n) => n.label).join('  →  ');

    case 'icons':
      return (slide.icons || []).map((ic) => `${ic.icon}  ${ic.title}\n     ${ic.desc}`).join('\n\n');

    case 'timeline':
      return (slide.timeline || []).map((t) => `▸ ${t.time}：${t.label}`).join('\n');

    case 'compare':
      return (slide.compare || [])
        .map((col) => `【${col.title}】\n${col.items.map((i) => `  • ${i}`).join('\n')}`)
        .join('\n\n');

    case 'bigNumber':
      if (!slide.bigNumber) return '';
      return `${slide.bigNumber.number}\n${slide.bigNumber.label}${slide.bigNumber.sub ? `\n${slide.bigNumber.sub}` : ''}`;

    case 'quote':
      if (!slide.quote) return '';
      return `「${slide.quote.text}」${slide.quote.author ? `\n\n— ${slide.quote.author}` : ''}`;

    case 'table':
      return ''; // handled by native table

    case 'matrix':
      return (slide.matrix || []).map((c) => `${c.icon}  ${c.title}\n   ${c.desc}`).join('\n\n');

    case 'kpis':
      return (slide.kpis || []).map((k) => `${k.number}  ${k.label}${k.sub ? `  (${k.sub})` : ''}`).join('\n');

    case 'beforeAfter':
      if (!slide.beforeAfter) return '';
      return `【Before】\n${slide.beforeAfter.before.map((b) => `✕ ${b}`).join('\n')}\n\n【After】\n${slide.beforeAfter.after.map((a) => `✓ ${a}`).join('\n')}`;

    case 'pyramid':
      return (slide.pyramid || []).map((l, i) => `${'  '.repeat(i)}${l}`).join('\n');

    default:
      return (slide.bullets || []).map((b) => `• ${b}`).join('\n');
  }
}
