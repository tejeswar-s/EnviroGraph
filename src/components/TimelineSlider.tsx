import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { Range } from 'react-range';
import { Card, Switch, Typography, Space, Select } from 'antd';
import { setTimeRange } from '../store/dashboardSlice';
import { TimeRange } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

type TimeUnit = 'hour' | 'day' | 'week';

interface TimelineSliderProps {
  className?: string;
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const timeRange = useAppSelector((state) => state.dashboard.timeRange);
  const [isDualHandle, setIsDualHandle] = useState(false);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('hour');

  // Timeline bounds: dynamic rolling 30 days ending "now"
  const windowEnd = React.useMemo(() => new Date(), []);
  const windowStart = React.useMemo(
    () => new Date(windowEnd.getTime() - 30 * 24 * 60 * 60 * 1000),
    [windowEnd]
  );

  const getUnitMultiplier = (unit: TimeUnit): number => {
    switch (unit) {
      case 'hour': return 1;
      case 'day': return 24;
      case 'week': return 24 * 7;
      default: return 1;
    }
  };

  const unitMultiplier = getUnitMultiplier(timeUnit);
  const totalUnits = Math.max(
    1,
    Math.floor(
      (windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * unitMultiplier)
    )
  );

  const getUnitFromTimestamp = (timestamp: number): number => {
    return Math.floor((timestamp - windowStart.getTime()) / (1000 * 60 * 60 * unitMultiplier));
  };

  const getTimestampFromUnit = (unit: number): number => {
    return windowStart.getTime() + unit * unitMultiplier * 60 * 60 * 1000;
  };

  const clampUnit = (u: number) => Math.max(0, Math.min(totalUnits - 1, u));
  const currentStartUnit = clampUnit(getUnitFromTimestamp(timeRange.start.getTime()));
  const currentEndUnit = clampUnit(getUnitFromTimestamp(timeRange.end.getTime()));

  const handleRangeChange = useCallback(
    (values: number[]) => {
      const v0 = clampUnit(values[0] ?? 0);
      const v1Raw = values[1] ?? v0;
      const v1 = clampUnit(v1Raw);

      let startUnit: number;
      let endUnit: number;
      if (isDualHandle) {
        // Preserve handle identity: index 0 is start handle, index 1 is end handle
        startUnit = v0;
        endUnit = v1 < v0 ? v0 : v1; // prevent crossing; allow moving end backward up to start
      } else {
        startUnit = v0;
        endUnit = clampUnit(startUnit + 1);
      }

      const newStart = new Date(getTimestampFromUnit(startUnit));
      const newEnd = new Date(getTimestampFromUnit(endUnit));

      const newTimeRange: TimeRange = {
        start: newStart,
        end: newEnd,
      };

      dispatch(setTimeRange(newTimeRange));
    },
    [dispatch, isDualHandle, unitMultiplier]
  );

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTrackBackground = (values: number[]): string => {
    if (isDualHandle) {
      const leftPercent = (values[0] / totalUnits) * 100;
      const rightPercent = (values[1] / totalUnits) * 100;
      return `linear-gradient(to right, #ccc ${leftPercent}%, #1890ff ${leftPercent}%, #1890ff ${rightPercent}%, #ccc ${rightPercent}%)`;
    } else {
      const percent = (values[0] / totalUnits) * 100;
      return `linear-gradient(to right, #1890ff ${percent}%, #ccc ${percent}%)`;
    }
  };

  const renderTrack = ({ props, children }: any) => {
    const { key, ...restProps } = props;
    return (
      <div
        key={key}
        {...restProps}
        style={{
          ...props.style,
          height: '8px',
          width: '100%',
          borderRadius: '4px',
          background: getTrackBackground(
            isDualHandle ? [currentStartUnit, currentEndUnit] : [currentStartUnit]
          ),
        }}
      >
        {children}
      </div>
    );
  };

  const renderThumb = ({ props, index }: any) => {
    const { key, ...restProps } = props;
    return (
      <div
        key={key}
        {...restProps}
        style={{
          ...props.style,
          height: '20px',
          width: '20px',
          borderRadius: '50%',
          backgroundColor: '#1890ff',
          border: '2px solid #fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          cursor: 'pointer',
        }}
      />
    );
  };

  return (
    <Card className={className} style={{ marginBottom: '16px' }}>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>Timeline Control</Title>
          <Space>
            <Text>Time Unit:</Text>
            <Select
              value={timeUnit}
              onChange={setTimeUnit}
              size="small"
              style={{ width: '80px' }}
            >
              <Option value="hour">Hour</Option>
              <Option value="day">Day</Option>
              <Option value="week">Week</Option>
            </Select>
            <Text>Single Handle</Text>
            <Switch
              checked={isDualHandle}
              onChange={setIsDualHandle}
              size="small"
            />
            <Text>Dual Handle</Text>
          </Space>
        </div>

        <div style={{ margin: '24px 0' }}>
          <Range
            step={1}
            min={0}
            max={totalUnits - 1}
            values={
              isDualHandle
                ? [currentStartUnit, currentEndUnit]
                : [currentStartUnit]
            }
            onChange={handleRangeChange}
            renderTrack={renderTrack}
            renderThumb={renderThumb}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
          <span>{timeRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {timeRange.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          <span>{timeRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {timeRange.end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
          <Space direction="vertical" size="small">
            <Text strong>Selected Time Range:</Text>
            <Text>
              <strong>Start:</strong> {formatDateTime(timeRange.start)}
            </Text>
            <Text>
              <strong>End:</strong> {formatDateTime(timeRange.end)}
            </Text>
            <Text type="secondary">
              Duration: {Math.round((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * unitMultiplier))} {timeUnit}(s)
            </Text>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default TimelineSlider;
