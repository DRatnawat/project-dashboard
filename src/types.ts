export type ChartType = 'line' | 'bar' | 'area' | 'pie';

export interface Widget {
  id?: string;
  type: ChartType;
  title?: string;
  dataKey: string | string[];
  data?: any;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  queryPayload?: {
    entities: string[];
    fields: string[];
    join: string[];
    filters: string[];
    aggregations: string[];
  };
  onModify?: (widget: Widget) => void;
  onRefresh?: () => void;
}

export interface FilterState {
  title: string;
  type: ChartType | '';
  minValue: string;
  maxValue: string;
}