// Define the DataPoint type
export interface DataPoint {
  // Add appropriate fields for DataPoint
  value: number;
  timestamp: Date;
}

export interface Widget {
  id: string;
  type: string;
  title: string;
  data: DataPoint[];
  dataKey: string;
  layout: { x: number; y: number; w: number; h: number };
} 