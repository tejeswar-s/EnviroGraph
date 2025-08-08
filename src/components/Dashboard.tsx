import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { Layout, Row, Col, Typography, Spin } from 'antd';
import { RootState } from '../store';
import { updatePolygonValue, updatePolygon } from '../store/dashboardSlice';
import { weatherApi } from '../services/weatherApi';
import TimelineSlider from './TimelineSlider';
import InteractiveMap from './InteractiveMap';
import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const polygons = useAppSelector((state: RootState) => state.dashboard.polygons);
  const timeRange = useAppSelector((state: RootState) => state.dashboard.timeRange);
  const dataSources = useAppSelector((state: RootState) => state.dashboard.dataSources);
  const selectedDataSource = useAppSelector((state: RootState) => state.dashboard.selectedDataSource);
  const [loading, setLoading] = React.useState(false);

  // Calculate statistics based on current polygons with current data source values
  const calculateStats = useCallback(() => {
    if (!polygons.length) return null;

    // Filter polygons that have values (regardless of original data source)
    const polygonsWithData = polygons.filter((polygon: any) => 
      polygon.value !== undefined && polygon.value !== null && !isNaN(polygon.value)
    );
    
    if (!polygonsWithData.length) {
      // Return basic info even if no data yet
      const currentDataSource = dataSources.find((ds: any) => ds.id === selectedDataSource);
      return {
        minValue: null,
        maxValue: null,
        avgValue: null,
        minPolygonName: '',
        maxPolygonName: '',
        activePolygons: polygons.length,
        dataSourceName: currentDataSource?.name || 'Unknown',
        unit: (currentDataSource as any)?.unit || ''
      };
    }

    // Get current data source info
    const currentDataSource = dataSources.find((ds: any) => ds.id === selectedDataSource);
    if (!currentDataSource) return null;

    let minValue = Infinity;
    let maxValue = -Infinity;
    let totalValue = 0;
    let minPolygonName = '';
    let maxPolygonName = '';
    let validPolygons = 0;

    polygonsWithData.forEach((polygon: any) => {
      const value = polygon.value;
      
      if (value !== undefined && value !== null && !isNaN(value)) {
        totalValue += value;
        validPolygons++;
        
        if (value < minValue) {
          minValue = value;
          minPolygonName = polygon.name;
        }
        if (value > maxValue) {
          maxValue = value;
          maxPolygonName = polygon.name;
        }
      }
    });

    if (validPolygons === 0) {
      return {
        minValue: null,
        maxValue: null,
        avgValue: null,
        minPolygonName: '',
        maxPolygonName: '',
        activePolygons: polygons.length,
        dataSourceName: currentDataSource.name,
        unit: (currentDataSource as any).unit
      };
    }

    const avgValue = totalValue / validPolygons;

    return {
      minValue: minValue === Infinity ? null : minValue,
      maxValue: maxValue === -Infinity ? null : maxValue,
      avgValue: avgValue,
      minPolygonName,
      maxPolygonName,
      activePolygons: polygons.length,
      dataSourceName: currentDataSource.name,
      unit: (currentDataSource as any).unit
    };
  }, [polygons, timeRange, dataSources, selectedDataSource]);

  // Update polygon data when timeline or data source changes
  useEffect(() => {
    const updatePolygonData = async () => {
      if (polygons.length === 0) return;

      setLoading(true);
      try {
        const startDate = weatherApi.formatDateForApi(timeRange.start);
        const endDate = weatherApi.formatDateForApi(timeRange.end);
        
        // Get the API key for the selected data source
        const currentDataSource = dataSources.find(ds => ds.id === selectedDataSource);
        const dataSourceKey = currentDataSource?.apiKey || 'temperature_2m';

        // Update all polygons with new data based on selected data source
        const updatePromises = polygons.map(async (polygon: any) => {
          try {
            const value = await weatherApi.fetchPolygonData(
              polygon.coordinates,
              startDate,
              endDate,
              dataSourceKey
            );
            
            // Update both the value and the dataSource property
            dispatch(updatePolygon({
              id: polygon.id,
              updates: { 
                value,
                dataSource: selectedDataSource
              }
            }));
          } catch (error) {
            console.error(`Error updating polygon ${polygon.id}:`, error);
          }
        });

        await Promise.all(updatePromises);
      } catch (error) {
        console.error('Error updating polygon data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only update if we have polygons and a valid data source
    if (polygons.length > 0 && selectedDataSource) {
      updatePolygonData();
    }
  }, [timeRange, selectedDataSource, dispatch, dataSources]);

  // Separate effect to handle polygon changes (additions/deletions)
  useEffect(() => {
    const updateNewPolygons = async () => {
      if (polygons.length === 0) return;

      const startDate = weatherApi.formatDateForApi(timeRange.start);
      const endDate = weatherApi.formatDateForApi(timeRange.end);
      
      // Get the API key for the selected data source
      const currentDataSource = dataSources.find(ds => ds.id === selectedDataSource);
      const dataSourceKey = currentDataSource?.apiKey || 'temperature_2m';

      // Find polygons that don't have values yet
      const polygonsNeedingData = polygons.filter((polygon: any) => 
        polygon.value === undefined || polygon.value === null
      );

      if (polygonsNeedingData.length > 0) {
        const updatePromises = polygonsNeedingData.map(async (polygon: any) => {
          try {
            const value = await weatherApi.fetchPolygonData(
              polygon.coordinates,
              startDate,
              endDate,
              dataSourceKey
            );
            
            dispatch(updatePolygon({
              id: polygon.id,
              updates: { 
                value,
                dataSource: selectedDataSource
              }
            }));
          } catch (error) {
            console.error(`Error updating polygon ${polygon.id}:`, error);
          }
        });

        await Promise.all(updatePromises);
      }
    };

    updateNewPolygons();
  }, [polygons.length]);

  const stats = calculateStats();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          MindWebs Dashboard
        </Title>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Spin size="small" />
              <span style={{ fontSize: '14px', color: '#666' }}>Updating data...</span>
            </div>
          )}
        </div>
      </Header>

      <Layout>
        <Content style={{ padding: '24px' }}>
          <Row gutter={[16, 16]}>
            {/* Timeline Slider - Full Width */}
            <Col span={24}>
              <TimelineSlider />
            </Col>

            {/* Map and Sidebar */}
            <Col span={18}>
              <div style={{ 
                background: '#fff', 
                borderRadius: '8px',
                border: '1px solid #f0f0f0',
                overflow: 'hidden'
              }}>
                <InteractiveMap />
              </div>
            </Col>

            <Col span={6}>
              <div style={{ 
                background: '#fff', 
                borderRadius: '8px',
                border: '1px solid #f0f0f0',
                padding: '16px',
                height: '500px'
              }}>
                <Sidebar />
              </div>
            </Col>
          </Row>

          {/* Enhanced Statistics Row */}
          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            <Col span={6}>
              <div style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #f0f0f0',
                textAlign: 'center'
              }}>
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                  {stats?.activePolygons || 0}
                </Title>
                <div style={{ color: '#666', fontSize: '14px' }}>Active Polygons</div>
              </div>
            </Col>

            <Col span={6}>
              <div style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #f0f0f0',
                textAlign: 'center'
              }}>
                <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>
                  {stats?.maxValue !== null && stats?.maxValue !== undefined ? 
                    `${stats.maxValue.toFixed(1)}${stats.unit}` : 
                    'N/A'
                  }
                </Title>
                <div style={{ color: '#666', fontSize: '14px' }}>Max {stats?.dataSourceName || 'Value'}</div>
                {stats?.maxPolygonName && (
                  <div style={{ color: '#999', fontSize: '12px' }}>
                    {stats.maxPolygonName}
                  </div>
                )}
              </div>
            </Col>

            <Col span={6}>
              <div style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #f0f0f0',
                textAlign: 'center'
              }}>
                <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                  {stats?.minValue !== null && stats?.minValue !== undefined ? 
                    `${stats.minValue.toFixed(1)}${stats.unit}` : 
                    'N/A'
                  }
                </Title>
                <div style={{ color: '#666', fontSize: '14px' }}>Min {stats?.dataSourceName || 'Value'}</div>
                {stats?.minPolygonName && (
                  <div style={{ color: '#999', fontSize: '12px' }}>
                    {stats.minPolygonName}
                  </div>
                )}
              </div>
            </Col>

            <Col span={6}>
              <div style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #f0f0f0',
                textAlign: 'center'
              }}>
                <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
                  {stats?.avgValue !== null && stats?.avgValue !== undefined ? 
                    `${stats.avgValue.toFixed(1)}${stats.unit}` : 
                    'N/A'
                  }
                </Title>
                <div style={{ color: '#666', fontSize: '14px' }}>Avg {stats?.dataSourceName || 'Value'}</div>
              </div>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
