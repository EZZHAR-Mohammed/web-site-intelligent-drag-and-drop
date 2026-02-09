export enum ComponentType {
  TABLE = 'table',
  STAT_CARD = 'stat-card',
  COMPLEX_CARD = 'complex-card',
  CHART_BAR = 'chart-bar',
  CHART_LINE = 'chart-line',
  CHART_PIE = 'chart-pie',
  CHART_AREA = 'chart-area',
  PDF_VIEWER = 'pdf-viewer',
  IMAGE_VIEWER = 'image-viewer',
  VIDEO_PLAYER = 'video-player',
  HERO = 'hero',
  DIVIDER = 'divider',
  PARAGRAPH = 'paragraph',
}

export type Role = 'admin' | 'viewer';

export interface ComponentData {
  title?: string;
  subtitle?: string;
  text?: string;
  image?: string; // URL
  videoUrl?: string; // URL for video
  value?: number | string;
  points?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataset?: any[]; // For charts/tables
  pdfUrl?: string;
  sections?: { title: string; content: string; }[];
}

export interface PageComponent {
  id: string;
  type: ComponentType;
  width: '50%' | '100%';
  role: 'admin' | 'viewer' | 'both';
  apiSource?: string;
  data: ComponentData;
}

export interface Suggestion {
  type: ComponentType;
  confidence: number;
  reason: string;
  previewData?: ComponentData;
}
