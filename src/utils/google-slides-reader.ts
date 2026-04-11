import { getGoogleToken, signInWithGoogle } from './google-auth';

const API = 'https://slides.googleapis.com/v1/presentations';

export interface SlideTextData {
  slideIndex: number;
  texts: string[];
}

export async function readGoogleSlides(url: string): Promise<string> {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error('無效的 Google Slides 連結');
  const presId = match[1];

  let token = await getGoogleToken();
  if (!token) {
    token = await signInWithGoogle();
  }

  const res = await fetch(`${API}/${presId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 403 || res.status === 401) {
      throw new Error('沒有權限讀取這份簡報，請確認已分享或重新登入 Google');
    }
    throw new Error('無法讀取 Google Slides');
  }

  const data = await res.json();
  const title = data.title || '';
  const slides: SlideTextData[] = [];

  for (let i = 0; i < (data.slides?.length || 0); i++) {
    const slide = data.slides[i];
    const texts: string[] = [];

    function extractText(elements: any[]) {
      if (!elements) return;
      for (const el of elements) {
        if (el.shape?.text?.textElements) {
          for (const te of el.shape.text.textElements) {
            if (te.textRun?.content?.trim()) {
              texts.push(te.textRun.content.trim());
            }
          }
        }
        if (el.table) {
          for (const row of el.table.tableRows || []) {
            for (const cell of row.tableCells || []) {
              if (cell.text?.textElements) {
                for (const te of cell.text.textElements) {
                  if (te.textRun?.content?.trim()) {
                    texts.push(te.textRun.content.trim());
                  }
                }
              }
            }
          }
        }
        if (el.elementGroup?.children) {
          extractText(el.elementGroup.children);
        }
      }
    }

    extractText(slide.pageElements || []);
    slides.push({ slideIndex: i + 1, texts });
  }

  // Format as readable text
  let output = `簡報標題：${title}\n\n`;
  for (const s of slides) {
    output += `--- 第 ${s.slideIndex} 頁 ---\n`;
    output += s.texts.join('\n') + '\n\n';
  }

  return output;
}
