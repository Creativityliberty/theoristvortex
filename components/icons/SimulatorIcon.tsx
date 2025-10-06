
import React from 'react';

export const SimulatorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M7 3v18" />
    <path d="M3 7h18" />
    <path d="M3 12h18" />
    <path d="M3 17h18" />
    <path d="M17 3v18" />
    <path d="M12 3v18" />
  </svg>
);
