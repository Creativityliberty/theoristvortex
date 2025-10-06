
import React from 'react';
import type { AgentStatus } from '../types';

interface AgentCardProps {
  icon: React.ReactNode;
  title: string;
  status: AgentStatus;
  children: React.ReactNode;
}

const statusClasses = {
  idle: {
    bg: 'bg-gray-800',
    border: 'border-gray-700',
    text: 'text-gray-400',
  },
  running: {
    bg: 'bg-blue-900/50',
    border: 'border-blue-500',
    text: 'text-blue-400',
  },
  success: {
    bg: 'bg-green-900/50',
    border: 'border-green-500',
    text: 'text-green-400',
  },
  failure: {
    bg: 'bg-red-900/50',
    border: 'border-red-500',
    text: 'text-red-400',
  },
};

export const AgentCard: React.FC<AgentCardProps> = ({ icon, title, status, children }) => {
  const classes = statusClasses[status];

  return (
    <div className={`flex-1 min-w-[300px] rounded-lg border ${classes.border} ${classes.bg} shadow-lg transition-all duration-300`}>
      <div className={`flex items-center p-4 border-b ${classes.border}`}>
        {icon}
        <h3 className="text-xl font-bold ml-3">{title}</h3>
        <div className="ml-auto flex items-center">
          {status === 'running' && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
          )}
          <span className={`text-sm font-medium uppercase ${classes.text}`}>{status}</span>
        </div>
      </div>
      <div className="p-4 h-[calc(100%-70px)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
