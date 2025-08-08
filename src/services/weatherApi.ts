import { ApiResponse } from '../types';

const BASE_URL = 'https://archive-api.open-meteo.com/v1/archive';

export class WeatherApiService {
  private cache: Map<string, ApiResponse> = new Map();

  async fetchWeatherData(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse> {
    const cacheKey = `${latitude},${longitude},${startDate},${endDate}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const url = `${BASE_URL}?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  async fetchPolygonData(
    coordinates: [number, number][],
    startDate: string,
    endDate: string,
    dataSourceKey: string = 'temperature_2m'
  ): Promise<number> {
    // Calculate centroid of polygon
    const centroid = this.calculateCentroid(coordinates);
    
    try {
      const data = await this.fetchWeatherData(
        centroid[0],
        centroid[1],
        startDate,
        endDate
      );
      
      // Get the appropriate data array based on the data source
      let dataArray: (number | null)[];
      switch (dataSourceKey) {
        case 'temperature_2m':
          dataArray = data.hourly.temperature_2m;
          break;
        case 'relative_humidity_2m':
          dataArray = data.hourly.relative_humidity_2m;
          break;
        case 'wind_speed_10m':
          dataArray = data.hourly.wind_speed_10m;
          break;
        case 'precipitation':
          dataArray = data.hourly.precipitation;
          break;
        default:
          dataArray = data.hourly.temperature_2m;
      }
      
      // Filter out null values and calculate average
      const validValues = dataArray.filter(value => value !== null) as number[];
      if (validValues.length === 0) return 0;
      
      return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
    } catch (error) {
      console.error('Error fetching polygon data:', error);
      return 0; // Return default value on error
    }
  }

  private calculateCentroid(coordinates: [number, number][]): [number, number] {
    const sumLat = coordinates.reduce((sum, coord) => sum + coord[0], 0);
    const sumLng = coordinates.reduce((sum, coord) => sum + coord[1], 0);
    return [sumLat / coordinates.length, sumLng / coordinates.length];
  }

  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const weatherApi = new WeatherApiService();
