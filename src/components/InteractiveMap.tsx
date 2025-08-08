import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon as LeafletPolygon, useMapEvents, useMap } from 'react-leaflet';
import { Button, message } from 'antd';
import { DeleteOutlined, PlusOutlined, HomeOutlined } from '@ant-design/icons';
import L from 'leaflet';
import { useAppDispatch, useAppSelector } from '../store';
import { addPolygon, deletePolygon, setIsDrawing, setMapCenter, updatePolygon } from '../store/dashboardSlice';
import { Polygon } from '../types';
import { weatherApi } from '../services/weatherApi';
import MapLegend from './MapLegend';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Global variable to store current drawing points (simple approach to avoid React state issues)
let globalDrawingPoints: [number, number][] = [];

// Simple drawing handler that avoids all useEffect and callback dependencies
const DrawingHandler: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isDrawing, selectedDataSource, timeRange, polygons, dataSources } = useAppSelector((state) => state.dashboard);
  const [, forceUpdate] = useState(0); // Simple force update mechanism
  const map = useMap();

  // Simple polygon completion function
  const completePolygon = async (points: [number, number][]) => {
    if (points.length < 3) {
      message.warning('Polygon needs at least 3 points');
      return;
    }

    // Get current polygons count to generate sequential name
    const polygonCount = polygons.length + 1;

    const newPolygon: Polygon = {
      id: `polygon_${Date.now()}`,
      name: `Polygon ${polygonCount}`,
      coordinates: points,
      dataSource: selectedDataSource,
      color: '#1890ff',
    };

    // Clear global points first
    globalDrawingPoints = [];
    
    dispatch(addPolygon(newPolygon));
    dispatch(setIsDrawing(false));
    
    // Fetch initial data for the polygon
    try {
      const startDate = weatherApi.formatDateForApi(timeRange.start);
      const endDate = weatherApi.formatDateForApi(timeRange.end);
      
      // Get the API key for the selected data source
      const currentDataSource = dataSources.find(ds => ds.id === selectedDataSource);
      const dataSourceKey = currentDataSource?.apiKey || 'temperature_2m';
      
      const value = await weatherApi.fetchPolygonData(points, startDate, endDate, dataSourceKey);
      
      dispatch(updatePolygon({
        id: newPolygon.id,
        updates: { value }
      }));
    } catch (error) {
      console.error('Error fetching polygon data:', error);
    }

    message.success('Polygon created successfully!');
  };

  useMapEvents({
    click: (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return;

      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      globalDrawingPoints = [...globalDrawingPoints, newPoint];
      
      forceUpdate(prev => prev + 1); // Force re-render

      // Check if this is close to the first point (for closing) when we have at least 3 points
      if (globalDrawingPoints.length >= 3) {
        const firstPoint = globalDrawingPoints[0];
        const distance = map.distance(e.latlng, L.latLng(firstPoint[0], firstPoint[1]));
        
        if (distance < 50) { // 50 meters threshold
          completePolygon([...globalDrawingPoints]);
          return;
        }
      }

      // Auto-complete when reaching max points
      if (globalDrawingPoints.length >= 12) {
        completePolygon([...globalDrawingPoints]);
      }
    },
    dblclick: (e: L.LeafletMouseEvent) => {
      if (!isDrawing || globalDrawingPoints.length < 3) return;
      
      e.originalEvent.preventDefault();
      completePolygon([...globalDrawingPoints]);
    },
  });

  // Clear points when drawing stops
  React.useEffect(() => {
    if (!isDrawing && globalDrawingPoints.length > 0) {
      // If we have 3+ points when stopping, complete the polygon
      if (globalDrawingPoints.length >= 3) {
        completePolygon([...globalDrawingPoints]);
      } else {
        // Otherwise just clear the points
        globalDrawingPoints = [];
        forceUpdate(prev => prev + 1);
      }
    }
  }, [isDrawing]);

  // Render current drawing polygon
  if (globalDrawingPoints.length > 0 && isDrawing) {
    return (
      <LeafletPolygon
        positions={globalDrawingPoints}
        pathOptions={{
          color: '#ff4d4f',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.2,
          dashArray: '5, 5',
        }}
      />
    );
  }

  return null;
};

interface MapControlsProps {
  onResetCenter: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ onResetCenter }) => {
  const dispatch = useAppDispatch();
  const isDrawing = useAppSelector((state) => state.dashboard.isDrawing);

  const handleStartDrawing = () => {
    // Clear any existing drawing points
    globalDrawingPoints = [];
    dispatch(setIsDrawing(true));
    message.info('Drawing mode enabled. Click to add points (minimum 3).');
  };

  const handleStopDrawing = () => {
    // The DrawingHandler useEffect will handle polygon completion
    dispatch(setIsDrawing(false));
    message.success('Drawing mode stopped.');
  };

  const handleCancelDrawing = () => {
    // Clear drawing points and stop drawing
    globalDrawingPoints = [];
    dispatch(setIsDrawing(false));
    message.info('Drawing cancelled. Current polygon discarded.');
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {!isDrawing ? (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleStartDrawing}
          size="small"
        >
          Draw Polygon
        </Button>
      ) : (
        <>
          <Button
            type="primary"
            onClick={handleStopDrawing}
            size="small"
          >
            Stop Drawing
          </Button>
          <Button
            danger
            onClick={handleCancelDrawing}
            size="small"
          >
            Cancel Drawing
          </Button>
        </>
      )}
      <Button
        icon={<HomeOutlined />}
        onClick={onResetCenter}
        size="small"
      >
        Reset Center
      </Button>
    </div>
  );
};

interface PolygonComponentProps {
  polygon: Polygon;
  onDelete: (id: string) => void;
}

const PolygonComponent: React.FC<PolygonComponentProps> = ({ polygon, onDelete }) => {
  const [showControls, setShowControls] = useState(false);

  const eventHandlers = {
    mouseover: () => setShowControls(true),
    mouseout: () => setShowControls(false),
  };

  return (
    <>
      <LeafletPolygon
        positions={polygon.coordinates}
        pathOptions={{
          color: polygon.color,
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.4,
        }}
        eventHandlers={eventHandlers}
      />
      {showControls && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          display: 'flex',
          gap: '4px',
        }}>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(polygon.id)}
          />
        </div>
      )}
    </>
  );
};

interface InteractiveMapProps {
  className?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const { polygons, mapCenter } = useAppSelector((state) => state.dashboard);
  const mapRef = useRef<L.Map | null>(null);

  const handlePolygonDelete = (id: string) => {
    dispatch(deletePolygon(id));
    message.success('Polygon deleted');
  };

  const handleResetCenter = () => {
    const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center coordinates
    dispatch(setMapCenter(defaultCenter));
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, 5);
    }
  };

  return (
    <div className={className} style={{ position: 'relative', height: '500px', width: '100%' }}>
      <MapContainer
        center={mapCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <DrawingHandler />

        {polygons.map((polygon: Polygon) => (
          <PolygonComponent
            key={polygon.id}
            polygon={polygon}
            onDelete={handlePolygonDelete}
          />
        ))}
      </MapContainer>

      <MapControls onResetCenter={handleResetCenter} />
      <MapLegend />
    </div>
  );
};

export default InteractiveMap;
