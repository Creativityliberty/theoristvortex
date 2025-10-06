
import React from 'react';

interface MetricsDisplayProps {
  data: Record<string, string | number | undefined | null>;
  title: string;
}

const formatValue = (value: any): string => {
  if (typeof value === 'number') {
    if (Math.abs(value) < 1e-3 && value !== 0) return value.toExponential(2);
    return value.toFixed(3);
  }
  if (typeof value === 'string') return value;
  return 'N/A';
};

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ data, title }) => (
  <div className="mb-4">
    <h4 className="text-md font-semibold text-gray-400 mb-2">{title}</h4>
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      {Object.entries(data).map(([key, value]) => (
        <React.Fragment key={key}>
          <span className="text-gray-500">{key}</span>
          <span className="font-mono text-gray-200">{formatValue(value)}</span>
        </React.Fragment>
      ))}
    </div>
  </div>
);
