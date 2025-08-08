import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  Card,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  Input,
  ColorPicker,
  List,
  Popconfirm,
  message,
  Tag,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { RootState } from '../store';
import {
  setSelectedDataSource,
  updateDataSourceColorRules,
  addDataSource,
  deletePolygon,
} from '../store/dashboardSlice';
import { ColorRule, DataSource, Polygon } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface ColorRuleEditorProps {
  rule: ColorRule;
  onUpdate: (rule: ColorRule) => void;
  onDelete: () => void;
}

const ColorRuleEditor: React.FC<ColorRuleEditorProps> = ({ rule, onUpdate, onDelete }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      padding: '8px',
      border: '1px solid #d9d9d9',
      borderRadius: '6px',
      marginBottom: '8px'
    }}>
      <Select
        value={rule.operator}
        onChange={(operator) => onUpdate({ ...rule, operator })}
        style={{ width: '60px' }}
        size="small"
      >
        <Option value="<">&lt;</Option>
        <Option value="<=">&le;</Option>
        <Option value="=">=</Option>
        <Option value=">=">&ge;</Option>
        <Option value=">">&gt;</Option>
      </Select>
      
      <Input
        type="number"
        value={rule.value}
        onChange={(e) => onUpdate({ ...rule, value: parseFloat(e.target.value) || 0 })}
        style={{ width: '80px' }}
        size="small"
      />
      
      <ColorPicker
        value={rule.color}
        onChange={(color) => onUpdate({ ...rule, color: color.toHexString() })}
        size="small"
      />
      
      <Button
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={onDelete}
        size="small"
      />
    </div>
  );
};

interface DataSourceConfigProps {
  dataSource: DataSource;
}

const DataSourceConfig: React.FC<DataSourceConfigProps> = ({ dataSource }) => {
  const dispatch = useAppDispatch();
  const [newRule, setNewRule] = useState<ColorRule>({
    operator: '>=',
    value: 0,
    color: '#1890ff',
  });

  const handleAddRule = () => {
    const updatedRules = [...dataSource.colorRules, newRule];
    dispatch(updateDataSourceColorRules({
      id: dataSource.id,
      colorRules: updatedRules,
    }));
    setNewRule({
      operator: '>=',
      value: 0,
      color: '#1890ff',
    });
    message.success('Color rule added');
  };

  const handleUpdateRule = (index: number, updatedRule: ColorRule) => {
    const updatedRules = [...dataSource.colorRules];
    updatedRules[index] = updatedRule;
    dispatch(updateDataSourceColorRules({
      id: dataSource.id,
      colorRules: updatedRules,
    }));
  };

  const handleDeleteRule = (index: number) => {
    const updatedRules = dataSource.colorRules.filter((_, i) => i !== index);
    dispatch(updateDataSourceColorRules({
      id: dataSource.id,
      colorRules: updatedRules,
    }));
    message.success('Color rule deleted');
  };

  return (
    <Card size="small" title={`${dataSource.name} Color Rules`} style={{ marginBottom: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text type="secondary">Field: {dataSource.field}</Text>
        
        <Divider style={{ margin: '8px 0' }} />
        
        <Text strong>Color Rules:</Text>
        
        {dataSource.colorRules.map((rule, index) => (
          <ColorRuleEditor
            key={index}
            rule={rule}
            onUpdate={(updatedRule) => handleUpdateRule(index, updatedRule)}
            onDelete={() => handleDeleteRule(index)}
          />
        ))}
        
        <Divider style={{ margin: '8px 0' }} />
        
        <Text strong>Add New Rule:</Text>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px'
        }}>
          <Select
            value={newRule.operator}
            onChange={(operator) => setNewRule({ ...newRule, operator })}
            style={{ width: '60px' }}
            size="small"
          >
            <Option value="<">&lt;</Option>
            <Option value="<=">&le;</Option>
            <Option value="=">=</Option>
            <Option value=">=">&ge;</Option>
            <Option value=">">&gt;</Option>
          </Select>
          
          <Input
            type="number"
            value={newRule.value}
            onChange={(e) => setNewRule({ ...newRule, value: parseFloat(e.target.value) || 0 })}
            style={{ width: '80px' }}
            size="small"
            placeholder="Value"
          />
          
          <ColorPicker
            value={newRule.color}
            onChange={(color) => setNewRule({ ...newRule, color: color.toHexString() })}
            size="small"
          />
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddRule}
            size="small"
          >
            Add
          </Button>
        </div>
      </Space>
    </Card>
  );
};

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const dataSources = useAppSelector((state) => state.dashboard.dataSources);
  const selectedDataSource = useAppSelector((state) => state.dashboard.selectedDataSource);
  const polygons = useAppSelector((state) => state.dashboard.polygons);

  const handleDataSourceChange = (value: string) => {
    dispatch(setSelectedDataSource(value));
  };

  const handleDeletePolygon = (polygonId: string) => {
    dispatch(deletePolygon(polygonId));
    message.success('Polygon deleted');
  };

  const selectedDataSourceObj = dataSources.find((ds: DataSource) => ds.id === selectedDataSource);

  return (
    <div className={className} style={{ height: '100%', overflowY: 'auto' }}>
      <Card title="Data Source Control" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Selected Data Source:</Text>
            <Select
              value={selectedDataSource}
              onChange={handleDataSourceChange}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {dataSources.map(ds => (
                <Option key={ds.id} value={ds.id}>
                  {ds.name}
                </Option>
              ))}
            </Select>
          </div>
          
          <Text type="secondary">
            New polygons will use this data source for coloring
          </Text>
        </Space>
      </Card>

      {selectedDataSourceObj && (
        <DataSourceConfig dataSource={selectedDataSourceObj} />
      )}

      <Card title="Polygon Management" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Active Polygons ({polygons.length}):</Text>
          
          {polygons.length === 0 ? (
            <Text type="secondary" style={{ textAlign: 'center', padding: '16px' }}>
              No polygons created yet. Use the map to draw polygons.
            </Text>
          ) : (
            <List
              size="small"
              dataSource={polygons}
              renderItem={(polygon: Polygon) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="Delete this polygon?"
                      onConfirm={() => handleDeletePolygon(polygon.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        title="Delete Polygon"
                      />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{polygon.name}</span>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: polygon.color,
                            borderRadius: '2px',
                            border: '1px solid #d9d9d9',
                          }}
                        />
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">
                          Data Source: {dataSources.find((ds: DataSource) => ds.id === polygon.dataSource)?.name}
                        </Text>
                        {polygon.value !== undefined && (
                          <Tag color={polygon.color}>
                            Value: {polygon.value.toFixed(1)}{dataSources.find((ds: DataSource) => ds.id === selectedDataSource)?.unit || '°C'}
                          </Tag>
                        )}
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          Points: {polygon.coordinates.length}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Space>
      </Card>


    </div>
  );
};

export default Sidebar;
