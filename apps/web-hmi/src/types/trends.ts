/**
 * Типы данных и модели для модуля промышленных трендов SCADA
 */

export interface TrendPen {
  tagId: string;
  name: string;
  color: string;
  unit: string;
  axis: 'left' | 'right';
  scaleMode?: 'auto' | 'custom' | 'percent';
  visible: boolean;
  minRange?: number;
  maxRange?: number;
}

export interface TrendPreset {
  id: string;
  name: string;
  icon?: string;
  section: string;
  isFactory?: boolean;
  timeRangeSec: number;
  pens: TrendPen[];
}

export interface TrendPoint {
  timestamp: number; // Unix timestamp in seconds
  values: Record<string, number | null>;
}

export interface TrendPenStats {
  tagId: string;
  min: number;
  max: number;
  avg: number;
  last: number;
  delta: number;
}
