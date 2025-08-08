import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Typography, Space } from 'antd';
import { RootState } from '../store';
import { DataSource, ColorRule } from '../types';

const { Text } = Typography;

interface MapLegendProps {
  className?: string;
}

const MapLegend: React.FC<MapLegendProps> = ({ className }) => {
  const selectedDataSource = useSelector((state: RootState) => state.dashboard.selectedDataSource);
  const dataSources = useSelector((state: RootState) => state.dashboard.dataSources);

  const selectedDataSourceObj = dataSources.find((ds: DataSource) => ds.id === selectedDataSource);

  if (!selectedDataSourceObj || selectedDataSourceObj.colorRules.length === 0) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        maxWidth: '200px',
      }}
    >
      <Card size="small" title="Legend" style={{ fontSize: '12px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Text strong style={{ fontSize: '11px' }}>
            {selectedDataSourceObj.name}
          </Text>
          {selectedDataSourceObj.colorRules.map((rule: ColorRule, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: rule.color,
                  borderRadius: '2px',
                  border: '1px solid #d9d9d9',
                  flexShrink: 0,
                }}
              />
              <Text style={{ fontSize: '10px', lineHeight: '12px' }}>
                {rule.operator} {rule.value}{selectedDataSourceObj.unit}
              </Text>
            </div>
          ))}
        </Space>
      </Card>
    </div>
  );
};

export default MapLegend;
