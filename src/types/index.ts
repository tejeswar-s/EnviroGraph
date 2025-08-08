export interface TimeRange {
  start: Date;
  end: Date;
}

export interface Polygon {
  id: string;
  name: string;
  coordinates: [number, number][];
  dataSource: string;
  color: string;
  value?: number;
}

export interface ColorRule {
  operator: '=' | '<' | '>' | '<=' | '>=';
  value: number;
  color: string;
}

export interface DataSource {
  id: string;
  name: string;
  field: string;
  colorRules: ColorRule[];
  unit: string;
  apiKey: string;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    precipitation: number[];
  };
}

export interface AppState {
  timeRange: TimeRange;
  polygons: Polygon[];
  dataSources: DataSource[];
  selectedDataSource: string;
  isDrawing: boolean;
  mapCenter: [number, number];
  mapZoom: number;
}

export interface ApiResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
    relative_humidity_2m: string;
    wind_speed_10m: string;
    precipitation: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    precipitation: number[];
  };
}
