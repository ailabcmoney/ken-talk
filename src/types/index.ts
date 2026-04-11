export interface Attachment {
  type: 'image' | 'google-slide';
  uri: string;       // image base64/uri or google slides URL
  name?: string;     // file name or slide title
  thumbnailUri?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'ken';
  content: string;
  timestamp: number;
  narration?: string;
  attachments?: Attachment[];
}

export interface Discussion {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 表格
export interface TableData {
  headers: string[];
  rows: string[][];
}

// 流程圖節點
export interface FlowNode {
  label: string;
  type?: 'start' | 'process' | 'decision' | 'end';
}

// 圖示重點（icon + 文字）
export interface IconPoint {
  icon: string;   // emoji 或符號
  title: string;
  desc: string;
}

// 時間軸
export interface TimelineItem {
  time: string;
  label: string;
}

// 對比欄
export interface CompareColumn {
  title: string;
  items: string[];
}

// 矩陣格子
export interface MatrixCell {
  icon: string;
  title: string;
  desc: string;
}

// KPI 卡片
export interface KpiCard {
  number: string;
  label: string;
  trend?: string; // "up" | "down" | "flat"
  sub?: string;
}

export interface SlideContent {
  title: string;
  layout: 'bullets' | 'table' | 'flow' | 'icons' | 'timeline' | 'compare' | 'bigNumber' | 'quote' | 'matrix' | 'kpis' | 'beforeAfter' | 'pyramid';
  // 基本欄位
  subtitle?: string;      // 頁面副標題/補充說明
  bullets?: string[];
  table?: TableData;
  flow?: FlowNode[];
  icons?: IconPoint[];
  timeline?: TimelineItem[];
  compare?: CompareColumn[];
  bigNumber?: { number: string; label: string; sub?: string };
  quote?: { text: string; author?: string };
  // 新增版面
  matrix?: MatrixCell[];   // 2x2 或 2x3 矩陣卡片
  kpis?: KpiCard[];        // 多個 KPI 指標
  beforeAfter?: { before: string[]; after: string[] };  // 前後對比
  pyramid?: string[];      // 金字塔（由上到下）
  notes?: string;
}

export interface PresentationData {
  title: string;
  subtitle: string;
  slides: SlideContent[];
  discussionId: string;
}
