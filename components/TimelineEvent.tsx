
import React from 'react';
import type { IterationLog } from '../types';

interface TimelineEventProps {
  log: IterationLog;
}

const decisionClasses = {
  accept: { bg: 'bg-green-500', text: 'text-green-100' },
  revise: { bg: 'bg-yellow-500', text: 'text-yellow-100' },
  reject: { bg: 'bg-red-500', text: 'text-red-100' },
};

export const TimelineEvent: React.FC<TimelineEventProps> = ({ log }) => {
  const classes = decisionClasses[log.evaluation.decision];

  return (
    <li className="mb-6 ms-4">
      <div className={`absolute w-3 h-3 ${classes.bg} rounded-full mt-1.5 -start-1.5 border border-gray-900`}></div>
      <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
        <div className="flex justify-between items-center mb-2">
            <time className="text-sm font-normal leading-none text-gray-500">
                Iteration {log.iteration}
            </time>
            <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded ${classes.bg} ${classes.text}`}>
                {log.evaluation.decision.toUpperCase()}
            </span>
        </div>
        <p className="text-base font-normal text-gray-300">
          Score: <span className="font-bold">{log.evaluation.score.toFixed(3)}</span>.
          Critiques: {log.evaluation.critiques.length > 0 ? log.evaluation.critiques[0] : 'None'}.
        </p>
      </div>
    </li>
  );
};
