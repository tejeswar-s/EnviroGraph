import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState, Polygon, DataSource, TimeRange, ColorRule } from '../types';

// Calculate timeline for previous 30 days from current date
const getCurrentTimeRange = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  return {
    start: thirtyDaysAgo,
    end: now,
  };
};

const initialState: AppState = {
  timeRange: getCurrentTimeRange(),
  polygons: [],
  dataSources: [
    {
      id: 'temperature',
      name: 'Temperature (°C)',
      field: 'temperature_2m',
      unit: '°C',
      apiKey: 'temperature_2m',
      colorRules: [
        { operator: '<', value: 10, color: '#1890ff' },
        { operator: '>=', value: 10, color: '#52c41a' },
        { operator: '>=', value: 25, color: '#faad14' },
        { operator: '>=', value: 35, color: '#ff4d4f' },
      ],
    },
    {
      id: 'humidity',
      name: 'Humidity (%)',
      field: 'relative_humidity_2m',
      unit: '%',
      apiKey: 'relative_humidity_2m',
      colorRules: [
        { operator: '<', value: 30, color: '#faad14' },
        { operator: '>=', value: 30, color: '#1890ff' },
        { operator: '>=', value: 50, color: '#52c41a' },
        { operator: '>=', value: 70, color: '#13c2c2' },
        { operator: '>=', value: 85, color: '#ff7a45' },
        { operator: '>=', value: 95, color: '#ff4d4f' },
      ],
    },
    {
      id: 'windspeed',
      name: 'Wind Speed (km/h)',
      field: 'wind_speed_10m',
      unit: 'km/h',
      apiKey: 'wind_speed_10m',
      colorRules: [
        { operator: '<', value: 10, color: '#52c41a' },
        { operator: '>=', value: 10, color: '#1890ff' },
        { operator: '>=', value: 30, color: '#faad14' },
        { operator: '>=', value: 50, color: '#ff4d4f' },
      ],
    },
    {
      id: 'precipitation',
      name: 'Precipitation (mm)',
      field: 'precipitation',
      unit: 'mm',
      apiKey: 'precipitation',
      colorRules: [
        { operator: '=', value: 0, color: '#f0f0f0' },
        { operator: '>', value: 0, color: '#e6f7ff' },
        { operator: '>=', value: 0.5, color: '#bae7ff' },
        { operator: '>=', value: 2, color: '#1890ff' },
        { operator: '>=', value: 5, color: '#52c41a' },
        { operator: '>=', value: 10, color: '#faad14' },
        { operator: '>=', value: 20, color: '#ff4d4f' },
      ],
    },
  ],
  selectedDataSource: 'temperature',
  isDrawing: false,
  mapCenter: [20.5937, 78.9629], // India center coordinates
  mapZoom: 10,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setTimeRange: (state, action: PayloadAction<TimeRange>) => {
      state.timeRange = action.payload;
    },
    addPolygon: (state, action: PayloadAction<Polygon>) => {
      state.polygons.push(action.payload);
    },
    updatePolygon: (state, action: PayloadAction<{ id: string; updates: Partial<Polygon> }>) => {
      state.polygons = state.polygons.map(p => {
        if (p.id !== action.payload.id) return p;
        const next: Polygon = { ...p, ...action.payload.updates };
        // If value or dataSource changed, recompute color using current rules
        const shouldRecolor =
          Object.prototype.hasOwnProperty.call(action.payload.updates, 'value') ||
          Object.prototype.hasOwnProperty.call(action.payload.updates, 'dataSource');
        if (shouldRecolor && typeof next.value === 'number' && !isNaN(next.value)) {
          const ds = state.dataSources.find(ds => ds.id === next.dataSource);
          if (ds) {
            next.color = getColorFromRules(next.value, ds.colorRules);
          }
        }
        return next;
      });
    },
    deletePolygon: (state, action: PayloadAction<string>) => {
      state.polygons = state.polygons.filter(p => p.id !== action.payload);
    },
    setIsDrawing: (state, action: PayloadAction<boolean>) => {
      state.isDrawing = action.payload;
    },
    setSelectedDataSource: (state, action: PayloadAction<string>) => {
      state.selectedDataSource = action.payload;
    },
    updateDataSourceColorRules: (state, action: PayloadAction<{ id: string; colorRules: ColorRule[] }>) => {
      const dataSource = state.dataSources.find(ds => ds.id === action.payload.id);
      if (dataSource) {
        dataSource.colorRules = action.payload.colorRules;
        // Immediately reflect new rules on map: recompute colors for polygons using this data source
        state.polygons = state.polygons.map(poly => {
          if (poly.dataSource === dataSource.id && typeof poly.value === 'number' && !isNaN(poly.value)) {
            return { ...poly, color: getColorFromRules(poly.value, dataSource.colorRules) };
          }
          return poly;
        });
      }
    },
    addDataSource: (state, action: PayloadAction<DataSource>) => {
      state.dataSources.push(action.payload);
    },
    setMapCenter: (state, action: PayloadAction<[number, number]>) => {
      state.mapCenter = action.payload;
    },
    updatePolygonValue: (state, action: PayloadAction<{ id: string; value: number }>) => {
      state.polygons = state.polygons.map(p => {
        if (p.id !== action.payload.id) return p;
        const updated: Polygon = { ...p, value: action.payload.value };
        const dataSource = state.dataSources.find(ds => ds.id === updated.dataSource);
        if (dataSource && typeof updated.value === 'number' && !isNaN(updated.value)) {
          updated.color = getColorFromRules(updated.value, dataSource.colorRules);
        }
        return updated;
      });
    },
  },
});

function getColorFromRules(value: number, rules: ColorRule[]): string {
  const approxEqual = (a: number, b: number) => Math.abs(a - b) < 0.001;
  const byDesc = (a: ColorRule, b: ColorRule) => b.value - a.value;
  const byAsc = (a: ColorRule, b: ColorRule) => a.value - b.value;

  // 1) Exact matches first
  for (const r of rules.filter(r => r.operator === '=')) {
    if (approxEqual(value, r.value)) return r.color;
  }

  // 2) Greater-or-equal thresholds (highest first)
  for (const r of rules.filter(r => r.operator === '>=').sort(byDesc)) {
    if (value >= r.value) return r.color;
  }

  // 3) Greater-than thresholds (highest first)
  for (const r of rules.filter(r => r.operator === '>').sort(byDesc)) {
    if (value > r.value) return r.color;
  }

  // 4) Less-or-equal thresholds (lowest first)
  for (const r of rules.filter(r => r.operator === '<=').sort(byAsc)) {
    if (value <= r.value) return r.color;
  }

  // 5) Less-than thresholds (lowest first)
  for (const r of rules.filter(r => r.operator === '<').sort(byAsc)) {
    if (value < r.value) return r.color;
  }

  // Default gray if nothing matches
  return '#d9d9d9';
}

export const {
  setTimeRange,
  addPolygon,
  updatePolygon,
  deletePolygon,
  setIsDrawing,
  setSelectedDataSource,
  updateDataSourceColorRules,
  addDataSource,
  setMapCenter,
  updatePolygonValue,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
