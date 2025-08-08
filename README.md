# MindWebs Dashboard

A comprehensive React TypeScript dashboard that visualizes dynamic weather data over an interactive map with timeline controls and polygon drawing capabilities.

## Features

### ✅ Core Features Implemented

- **Timeline Slider (STEP 1)**
  - Horizontal timeline slider with hourly resolution
  - Single draggable handle and dual-ended range slider modes
  - 30-day window (July 18 - August 17, 2025)
  - Visual time range display and selection

- **Interactive Map (STEP 2)**
  - Leaflet-based interactive map
  - Move and center reset functionality
  - Locked zoom at 2 sq. km resolution
  - Persistent polygon visibility

- **Polygon Drawing Tools (STEP 3)**
  - Draw polygons with 3-12 points
  - Click to add points, double-click to finish
  - Automatic data source assignment
  - Polygon editing and deletion capabilities

- **Data Source Selection Sidebar (STEP 4)**
  - Control panel for data sources and thresholds
  - User-defined color coding rules
  - Threshold-based coloring with operators (=, <, >, <=, >=)
  - Visual color rule management

- **Dynamic Polygon Coloring (STEP 5)**
  - Real-time polygon coloring based on data values
  - Automatic color updates when timeline changes
  - Centroid-based data fetching for polygons

- **Open-Meteo API Integration (STEP 6)**
  - Connected to Open-Meteo Archive API
  - Temperature data fetching (temperature_2m field)
  - Caching system for optimized API usage
  - Error handling and fallback values

- **Dynamic Timeline Updates (STEP 7)**
  - Automatic polygon data refresh on timeline changes
  - Real-time color rule application
  - Loading indicators during data updates

### 🎯 Bonus Features

- **Modern UI/UX**: Clean, responsive design with Ant Design components
- **State Management**: Redux Toolkit for efficient state management
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance**: API caching and optimized re-renders
- **Accessibility**: Keyboard navigation and screen reader support

## Tech Stack

- **Frontend**: React 18, TypeScript
- **State Management**: Redux Toolkit
- **UI Framework**: Ant Design + Bootstrap CSS
- **Mapping**: Leaflet + React-Leaflet
- **Slider**: React-Range
- **API**: Open-Meteo Archive API
- **Build Tool**: Create React App

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MindWebs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage Guide

### 1. Timeline Control
- Use the switch to toggle between single and dual-handle modes
- Drag the slider handle(s) to select time ranges
- View selected time range details in the info panel

### 2. Drawing Polygons
- Click "Draw Polygon" button to enter drawing mode
- Click on the map to add points (3-12 points allowed)
- Double-click or click near the first point to complete the polygon
- Polygons are automatically assigned the selected data source

### 3. Managing Data Sources
- Select active data source from the dropdown
- Configure color rules with operators and threshold values
- Add/remove color rules as needed
- View legend for current color mappings

### 4. Polygon Management
- View all active polygons in the sidebar
- Delete polygons using the delete button
- Monitor polygon values and colors in real-time

## API Configuration

The application uses the Open-Meteo Archive API:
- **Endpoint**: `https://archive-api.open-meteo.com/v1/archive`
- **Data Field**: `temperature_2m` (Temperature at 2 meters)
- **Time Range**: July 18 - August 17, 2025
- **Resolution**: Hourly data

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx          # Main dashboard layout
│   ├── TimelineSlider.tsx     # Timeline control component
│   ├── InteractiveMap.tsx     # Leaflet map with drawing tools
│   └── Sidebar.tsx            # Data source and polygon management
├── store/
│   ├── index.ts               # Redux store configuration
│   └── dashboardSlice.ts      # Main application state slice
├── services/
│   └── weatherApi.ts          # Open-Meteo API service
├── types/
│   └── index.ts               # TypeScript type definitions
├── App.tsx                    # Root application component
└── index.tsx                  # Application entry point
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] Additional data sources (humidity, pressure, wind speed)
- [ ] Polygon labeling and renaming
- [ ] Data export functionality
- [ ] Advanced polygon editing (vertex manipulation)
- [ ] Mobile-responsive optimizations
- [ ] State persistence across page reloads
- [ ] Animation effects for timeline and polygon updates
- [ ] Tooltip system for enhanced user guidance
